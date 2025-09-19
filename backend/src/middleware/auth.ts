import { Request, Response, NextFunction } from 'express';
import passport from 'passport';
import { PrismaClient } from '@prisma/client';

const prisma = new PrismaClient();

export interface AuthenticatedUser {
  id: string;
  discordId: string;
  discordUsername: string;
  pnwNationId?: number | null;
  pnwNationName?: string | null;
  isSystemAdmin: boolean;
  systemAdminLevel?: string;
  systemAdminPermissions?: any;
  allianceManagers: {
    id: string;
    allianceId: string;
    allianceName: string;
    allianceSlug: string;
    role: string;
    permissions: any;
    isActive: boolean;
  }[];
  sessionId: string;
}

declare global {
  namespace Express {
    interface User extends AuthenticatedUser {}
  }
}

/**
 * Middleware to require authentication
 */
export const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  passport.authenticate('jwt', { session: false }, (err: any, user: AuthenticatedUser, info: any) => {
    if (err) {
      console.error('Authentication error:', err);
      return res.status(500).json({ error: 'Internal server error' });
    }

    if (!user) {
      const message = info?.message || 'Authentication required';
      return res.status(401).json({ error: message });
    }

    req.user = user;
    next();
  })(req, res, next);
};

/**
 * Middleware to require system admin privileges
 */
export const requireSystemAdmin = (req: Request, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    const user = req.user as AuthenticatedUser;

    if (!user.isSystemAdmin) {
      return res.status(403).json({ error: 'System admin privileges required' });
    }

    next();
  });
};

/**
 * Middleware to require super admin privileges
 */
export const requireSuperAdmin = (req: Request, res: Response, next: NextFunction) => {
  requireAuth(req, res, () => {
    const user = req.user as AuthenticatedUser;

    if (!user.isSystemAdmin || user.systemAdminLevel !== 'super_admin') {
      return res.status(403).json({ error: 'Super admin privileges required' });
    }

    next();
  });
};

/**
 * Middleware to require specific system admin permission
 */
export const requireSystemPermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    requireSystemAdmin(req, res, () => {
      const user = req.user as AuthenticatedUser;
      const permissions = user.systemAdminPermissions || {};

      if (!permissions[permission]) {
        return res.status(403).json({
          error: `System permission '${permission}' required`
        });
      }

      next();
    });
  };
};

/**
 * Middleware to require alliance manager access
 */
export const requireAllianceManager = (req: Request, res: Response, next: NextFunction) => {
  requireAuth(req, res, async () => {
    try {
      const user = req.user as AuthenticatedUser;
      const allianceSlug = req.params.allianceSlug || req.body.allianceSlug;

      if (!allianceSlug) {
        return res.status(400).json({ error: 'Alliance identifier required' });
      }

      // System admins have access to all alliances
      if (user.isSystemAdmin) {
        return next();
      }

      // Check if user is a manager for this alliance
      const allianceManager = user.allianceManagers.find(
        manager => manager.allianceSlug === allianceSlug && manager.isActive
      );

      if (!allianceManager) {
        return res.status(403).json({
          error: 'Alliance manager access required for this alliance'
        });
      }

      // Attach alliance context to request
      req.allianceManager = allianceManager;
      next();
    } catch (error) {
      console.error('Alliance manager check error:', error);
      res.status(500).json({ error: 'Internal server error' });
    }
  });
};

/**
 * Middleware to require specific alliance permission
 */
export const requireAlliancePermission = (permission: string) => {
  return (req: Request, res: Response, next: NextFunction) => {
    requireAllianceManager(req, res, () => {
      const user = req.user as AuthenticatedUser;
      const allianceManager = req.allianceManager;

      // System admins have all permissions
      if (user.isSystemAdmin) {
        return next();
      }

      // Check manager permissions
      const permissions = allianceManager?.permissions || {};

      if (!permissions[permission]) {
        return res.status(403).json({
          error: `Alliance permission '${permission}' required`
        });
      }

      next();
    });
  };
};

/**
 * Middleware to require alliance admin role
 */
export const requireAllianceAdmin = (req: Request, res: Response, next: NextFunction) => {
  requireAllianceManager(req, res, () => {
    const user = req.user as AuthenticatedUser;
    const allianceManager = req.allianceManager;

    // System admins have all permissions
    if (user.isSystemAdmin) {
      return next();
    }

    // Check if user is alliance admin
    if (allianceManager?.role !== 'admin') {
      return res.status(403).json({
        error: 'Alliance admin role required'
      });
    }

    next();
  });
};

/**
 * Middleware to check if user can access their own data or is admin
 */
export const requireOwnershipOrAdmin = (userIdParam: string = 'userId') => {
  return (req: Request, res: Response, next: NextFunction) => {
    requireAuth(req, res, () => {
      const user = req.user as AuthenticatedUser;
      const targetUserId = req.params[userIdParam];

      // System admins can access any user's data
      if (user.isSystemAdmin) {
        return next();
      }

      // Users can access their own data
      if (user.id === targetUserId) {
        return next();
      }

      res.status(403).json({
        error: 'Access denied: can only access your own data'
      });
    });
  };
};

/**
 * Middleware for optional authentication (doesn't fail if no token)
 */
export const optionalAuth = (req: Request, res: Response, next: NextFunction) => {
  const authHeader = req.headers.authorization;

  if (!authHeader || !authHeader.startsWith('Bearer ')) {
    return next();
  }

  passport.authenticate('jwt', { session: false }, (err: any, user: AuthenticatedUser) => {
    if (err) {
      console.error('Optional authentication error:', err);
    }

    if (user) {
      req.user = user;
    }

    next();
  })(req, res, next);
};

/**
 * Middleware to rate limit based on user/IP
 */
export const checkRateLimit = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const user = req.user as AuthenticatedUser;
    const identifier = user?.id || req.ip;
    const type = user ? 'user' : 'ip';

    // Get rate limit configuration
    const windowMs = parseInt(process.env.RATE_LIMIT_WINDOW_MS || '900000'); // 15 minutes
    const maxRequests = parseInt(process.env.RATE_LIMIT_MAX_REQUESTS || '100');

    const windowStart = new Date(Date.now() - windowMs);
    const windowEnd = new Date();

    // Check current usage
    const currentUsage = await prisma.rateLimit.findFirst({
      where: {
        identifier,
        type,
        windowStart: {
          gte: windowStart,
        },
        windowEnd: {
          lte: windowEnd,
        },
      },
    });

    if (currentUsage && currentUsage.requests >= maxRequests) {
      return res.status(429).json({
        error: 'Rate limit exceeded',
        retryAfter: Math.ceil((currentUsage.windowEnd.getTime() - Date.now()) / 1000),
      });
    }

    // Update or create rate limit record
    await prisma.rateLimit.upsert({
      where: {
        identifier_type_windowStart: {
          identifier,
          type,
          windowStart,
        },
      },
      update: {
        requests: {
          increment: 1,
        },
      },
      create: {
        identifier,
        type,
        requests: 1,
        windowStart,
        windowEnd,
        maxRequests,
        windowMs,
      },
    });

    next();
  } catch (error) {
    console.error('Rate limit check error:', error);
    // Don't fail the request if rate limiting fails
    next();
  }
};

// Extend Express Request interface
declare global {
  namespace Express {
    interface Request {
      allianceManager?: {
        id: string;
        allianceId: string;
        allianceName: string;
        allianceSlug: string;
        role: string;
        permissions: any;
        isActive: boolean;
      };
    }
  }
}