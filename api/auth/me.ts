import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Extract JWT token
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const token = authHeader.substring(7);
    const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Get user data
    const userData = await prisma.user.findUnique({
      where: { id: decoded.userId },
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
}