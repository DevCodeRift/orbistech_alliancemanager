import { Router } from 'express';
import passport from '../config/passport';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';
import { requireAuth } from '../middleware/auth';
import { v4 as uuidv4 } from 'uuid';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/auth/discord
 * @desc    Initiate Discord OAuth flow
 * @access  Public
 */
router.get('/discord', passport.authenticate('discord'));

/**
 * @route   GET /api/auth/discord/callback
 * @desc    Handle Discord OAuth callback
 * @access  Public
 */
router.get(
  '/discord/callback',
  passport.authenticate('discord', { session: false }),
  async (req, res) => {
    try {
      const user = req.user as any;

      if (!user) {
        return res.redirect(`${process.env.CORS_ORIGIN}/login?error=auth_failed`);
      }

      // Generate session token
      const sessionToken = uuidv4();

      // Create user session
      const session = await prisma.userSession.create({
        data: {
          userId: user.id,
          sessionToken,
          expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
          userAgent: req.get('User-Agent') || null,
          ipAddress: req.ip || null,
        },
      });

      // Generate JWT token
      const token = jwt.sign(
        {
          userId: user.id,
          sessionId: sessionToken,
        },
        process.env.JWT_SECRET!,
        {
          expiresIn: process.env.JWT_EXPIRES_IN || '7d',
        }
      );

      // Redirect to frontend with token
      const redirectUrl = new URL('/auth/success', process.env.CORS_ORIGIN!);
      redirectUrl.searchParams.set('token', token);

      res.redirect(redirectUrl.toString());
    } catch (error) {
      console.error('OAuth callback error:', error);
      res.redirect(`${process.env.CORS_ORIGIN}/login?error=server_error`);
    }
  }
);

/**
 * @route   POST /api/auth/logout
 * @desc    Logout user and invalidate session
 * @access  Private
 */
router.post('/logout', requireAuth, async (req, res) => {
  try {
    const user = req.user as any;

    // Invalidate current session
    await prisma.userSession.updateMany({
      where: {
        userId: user.id,
        sessionToken: user.sessionId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Log logout action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user_logout',
        resource: 'user',
        resourceId: user.id,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      },
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   POST /api/auth/logout-all
 * @desc    Logout from all sessions
 * @access  Private
 */
router.post('/logout-all', requireAuth, async (req, res) => {
  try {
    const user = req.user as any;

    // Invalidate all user sessions
    await prisma.userSession.updateMany({
      where: {
        userId: user.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Log logout all action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user_logout_all',
        resource: 'user',
        resourceId: user.id,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      },
    });

    res.json({ success: true, message: 'Logged out from all sessions' });
  } catch (error) {
    console.error('Logout all error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/auth/me
 * @desc    Get current user information
 * @access  Private
 */
router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = req.user as any;

    // Get full user data with relationships
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        id: true,
        discordId: true,
        discordUsername: true,
        discordAvatar: true,
        discordTag: true,
        pnwNationId: true,
        pnwNationName: true,
        createdAt: true,
        lastLogin: true,
        timezone: true,
        language: true,
        preferences: true,
        systemAdmin: {
          select: {
            level: true,
            permissions: true,
            isActive: true,
          },
        },
        allianceManagers: {
          where: { isActive: true },
          select: {
            id: true,
            role: true,
            title: true,
            permissions: true,
            assignedAt: true,
            alliance: {
              select: {
                id: true,
                allianceName: true,
                acronym: true,
                routeSlug: true,
                displayName: true,
                logoUrl: true,
              },
            },
          },
        },
      },
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    res.json({
      success: true,
      user: userData,
    });
  } catch (error) {
    console.error('Get user info error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   POST /api/auth/refresh
 * @desc    Refresh JWT token
 * @access  Private
 */
router.post('/refresh', requireAuth, async (req, res) => {
  try {
    const user = req.user as any;

    // Check if session is still valid
    const session = await prisma.userSession.findFirst({
      where: {
        userId: user.id,
        sessionToken: user.sessionId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      return res.status(401).json({ error: 'Session expired' });
    }

    // Generate new JWT token
    const token = jwt.sign(
      {
        userId: user.id,
        sessionId: user.sessionId,
      },
      process.env.JWT_SECRET!,
      {
        expiresIn: process.env.JWT_EXPIRES_IN || '7d',
      }
    );

    res.json({
      success: true,
      token,
    });
  } catch (error) {
    console.error('Token refresh error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/auth/sessions
 * @desc    Get user's active sessions
 * @access  Private
 */
router.get('/sessions', requireAuth, async (req, res) => {
  try {
    const user = req.user as any;

    const sessions = await prisma.userSession.findMany({
      where: {
        userId: user.id,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
      select: {
        id: true,
        createdAt: true,
        expiresAt: true,
        userAgent: true,
        ipAddress: true,
        sessionToken: true,
      },
      orderBy: {
        createdAt: 'desc',
      },
    });

    // Mark current session
    const sessionsWithCurrent = sessions.map(session => ({
      ...session,
      isCurrent: session.sessionToken === user.sessionId,
      sessionToken: undefined, // Don't send token to client
    }));

    res.json({
      success: true,
      sessions: sessionsWithCurrent,
    });
  } catch (error) {
    console.error('Get sessions error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   DELETE /api/auth/sessions/:sessionId
 * @desc    Revoke a specific session
 * @access  Private
 */
router.delete('/sessions/:sessionId', requireAuth, async (req, res) => {
  try {
    const user = req.user as any;
    const { sessionId } = req.params;

    // Invalidate the specified session
    const updatedSession = await prisma.userSession.updateMany({
      where: {
        id: sessionId,
        userId: user.id,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    if (updatedSession.count === 0) {
      return res.status(404).json({ error: 'Session not found' });
    }

    // Log session revocation
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'session_revoked',
        resource: 'session',
        resourceId: sessionId,
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      },
    });

    res.json({ success: true, message: 'Session revoked successfully' });
  } catch (error) {
    console.error('Revoke session error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;