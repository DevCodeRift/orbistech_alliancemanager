import { Router } from 'express';
import { requireAuth, requireAllianceManager, optionalAuth } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';

const router = Router();
const prisma = new PrismaClient();

/**
 * @route   GET /api/alliances
 * @desc    Get list of alliances
 * @access  Public
 */
router.get('/', optionalAuth, async (req, res) => {
  try {
    const user = req.user;
    const page = parseInt(req.query.page as string) || 1;
    const limit = Math.min(parseInt(req.query.limit as string) || 50, 100);
    const skip = (page - 1) * limit;

    // Only show public alliances unless user is authenticated
    const where = user ? {} : { isPublic: true };

    const [alliances, total] = await Promise.all([
      prisma.alliance.findMany({
        where,
        select: {
          id: true,
          allianceName: true,
          acronym: true,
          routeSlug: true,
          displayName: true,
          logoUrl: true,
          memberCount: true,
          totalScore: true,
          averageScore: true,
          rank: true,
          isPublic: true,
        },
        orderBy: { rank: 'asc' },
        skip,
        take: limit,
      }),
      prisma.alliance.count({ where }),
    ]);

    res.json({
      success: true,
      alliances,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit),
      },
    });
  } catch (error) {
    console.error('Get alliances error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/alliances/:slug
 * @desc    Get alliance details
 * @access  Public/Private based on alliance visibility
 */
router.get('/:slug', optionalAuth, async (req, res) => {
  try {
    const { slug } = req.params;
    const user = req.user;

    const alliance = await prisma.alliance.findUnique({
      where: { routeSlug: slug },
      include: {
        managers: {
          where: { isActive: true },
          include: {
            user: {
              select: {
                discordUsername: true,
                discordAvatar: true,
              },
            },
          },
        },
      },
    });

    if (!alliance) {
      return res.status(404).json({ error: 'Alliance not found' });
    }

    // Check access permissions
    if (!alliance.isPublic && !user) {
      return res.status(403).json({ error: 'Authentication required' });
    }

    // Check if user has access to this alliance
    const hasAccess = alliance.isPublic ||
      user?.isSystemAdmin ||
      user?.allianceManagers.some(m => m.allianceSlug === slug);

    if (!hasAccess) {
      return res.status(403).json({ error: 'Access denied' });
    }

    res.json({ success: true, alliance });
  } catch (error) {
    console.error('Get alliance error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;