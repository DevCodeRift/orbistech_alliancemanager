import { Router } from 'express';
import { requireSystemAdmin, requireSuperAdmin } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/admin/users
 * @desc    Get list of all users (admin only)
 * @access  Admin
 */
router.get('/users', requireSystemAdmin, async (req, res) => {
  try {
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      prisma.user.findMany({
        select: {
          id: true,
          discordUsername: true,
          discordTag: true,
          pnwNationName: true,
          createdAt: true,
          lastLogin: true,
          isActive: true,
          systemAdmin: {
            select: {
              level: true,
              isActive: true,
            },
          },
          allianceManagers: {
            where: { isActive: true },
            select: {
              alliance: {
                select: {
                  allianceName: true,
                  routeSlug: true,
                },
              },
              role: true,
            },
          },
        },
        orderBy: { createdAt: 'desc' },
        skip,
        take: limit,
      }),
      prisma.user.count(),
    ]);

    res.json({
      success: true,
      users,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get users error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/admin/system-stats
 * @desc    Get system statistics
 * @access  Admin
 */
router.get('/system-stats', requireSystemAdmin, async (req, res) => {
  try {
    const [
      userCount,
      allianceCount,
      activeManagerCount,
      recentLogins,
      apiUsageToday,
    ] = await Promise.all([
      prisma.user.count({ where: { isActive: true } }),
      prisma.alliance.count({ where: { isActive: true } }),
      prisma.allianceManager.count({ where: { isActive: true } }),
      prisma.user.count({
        where: {
          lastLogin: {
            gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000), // Last 7 days
          },
        },
      }),
      prisma.apiUsageLog.count({
        where: {
          createdAt: {
            gte: new Date(Date.now() - 24 * 60 * 60 * 1000), // Last 24 hours
          },
        },
      }),
    ]);

    res.json({
      success: true,
      stats: {
        userCount,
        allianceCount,
        activeManagerCount,
        recentLogins,
        apiUsageToday,
      },
    });
  } catch (error) {
    console.error('Get system stats error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;