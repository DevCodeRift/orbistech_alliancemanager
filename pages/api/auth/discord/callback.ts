import { NextApiRequest, NextApiResponse } from 'next';
import axios from 'axios';
import jwt from 'jsonwebtoken';
import { v4 as uuidv4 } from 'uuid';
import { prisma } from '../../../../lib/prisma';

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const { code } = req.query;

    if (!code) {
      return res.redirect(`${process.env.CORS_ORIGIN}/login?error=no_code`);
    }

    // Exchange code for access token
    const tokenResponse = await axios.post('https://discord.com/api/oauth2/token', {
      client_id: process.env.DISCORD_CLIENT_ID,
      client_secret: process.env.DISCORD_CLIENT_SECRET,
      grant_type: 'authorization_code',
      code,
      redirect_uri: process.env.DISCORD_REDIRECT_URI,
    }, {
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded',
      },
    });

    const { access_token } = tokenResponse.data;

    // Get user profile from Discord
    const userResponse = await axios.get('https://discord.com/api/users/@me', {
      headers: {
        Authorization: `Bearer ${access_token}`,
      },
    });

    const profile = userResponse.data;

    // Check if user already exists
    let user = await prisma.user.findUnique({
      where: { discordId: profile.id },
    });

    if (user) {
      // Update existing user
      user = await prisma.user.update({
        where: { discordId: profile.id },
        data: {
          discordUsername: profile.username,
          discordTag: `${profile.username}#${profile.discriminator}`,
          discordAvatar: profile.avatar,
          lastLogin: new Date(),
        },
      });
    } else {
      // Check if registration is enabled
      const registrationEnabled = await prisma.appConfig.findUnique({
        where: { key: 'registration_enabled' },
      });

      if (registrationEnabled?.value !== 'true') {
        return res.redirect(`${process.env.CORS_ORIGIN}/login?error=registration_disabled`);
      }

      // Create new user
      user = await prisma.user.create({
        data: {
          discordId: profile.id,
          discordUsername: profile.username,
          discordTag: `${profile.username}#${profile.discriminator}`,
          discordAvatar: profile.avatar,
          lastLogin: new Date(),
          language: 'en',
          timezone: 'UTC',
        },
      });

      // Check if user should be system admin
      const adminDiscordIds = process.env.ADMIN_DISCORD_IDS?.split(',') || [];
      if (adminDiscordIds.includes(profile.id)) {
        await prisma.systemAdmin.create({
          data: {
            userId: user.id,
            level: 'super_admin',
            permissions: {
              canManageUsers: true,
              canManageAlliances: true,
              canViewAuditLogs: true,
              canManageSystem: true,
              canManageAdmins: true,
            },
          },
        });
      }

      // Log user registration
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'user_registered',
          resource: 'user',
          resourceId: user.id,
          newValues: {
            discordId: user.discordId,
            discordUsername: user.discordUsername,
          },
        },
      });
    }

    // Generate session token
    const sessionToken = uuidv4();

    // Create user session
    await prisma.userSession.create({
      data: {
        userId: user.id,
        sessionToken,
        expiresAt: new Date(Date.now() + 7 * 24 * 60 * 60 * 1000), // 7 days
        userAgent: req.headers['user-agent'] || null,
        ipAddress: req.headers['x-forwarded-for']?.toString() || req.socket.remoteAddress || null,
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
        expiresIn: '7d',
      }
    );

    // Log successful login
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user_login',
        resource: 'user',
        resourceId: user.id,
        metadata: {
          method: 'discord_oauth',
        },
      },
    });

    // Redirect to frontend with token
    const redirectUrl = new URL('/auth/success', process.env.CORS_ORIGIN!);
    redirectUrl.searchParams.set('token', token);

    res.redirect(redirectUrl.toString());
  } catch (error) {
    console.error('OAuth callback error:', error);
    res.redirect(`${process.env.CORS_ORIGIN}/login?error=server_error`);
  }
}