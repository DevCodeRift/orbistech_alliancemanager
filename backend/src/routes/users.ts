import { Router } from 'express';
import { requireAuth, requireOwnershipOrAdmin } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/users/profile
 * @desc    Get current user's profile
 * @access  Private
 */
router.get('/profile', requireAuth, async (req, res) => {
  try {
    const user = req.user!;

    const profile = await prisma.user.findUnique({
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
      },
    });

    res.json({ success: true, profile });
  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   PUT /api/users/profile
 * @desc    Update user profile
 * @access  Private
 */
router.put('/profile', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const { timezone, language, preferences } = req.body;

    const updatedUser = await prisma.user.update({
      where: { id: user.id },
      data: {
        timezone,
        language,
        preferences,
      },
      select: {
        id: true,
        timezone: true,
        language: true,
        preferences: true,
      },
    });

    // Log profile update
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'profile_updated',
        resource: 'user',
        resourceId: user.id,
        newValues: { timezone, language, preferences },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      },
    });

    res.json({ success: true, profile: updatedUser });
  } catch (error) {
    console.error('Update profile error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;