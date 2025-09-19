import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export default requireAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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