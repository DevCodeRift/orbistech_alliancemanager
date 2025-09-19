import { NextApiRequest, NextApiResponse } from 'next';
import jwt from 'jsonwebtoken';
import { prisma } from './prisma';

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

export async function authenticateUser(req: NextApiRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = req.headers.authorization;
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null;
    }

    const token = authHeader.substring(7);
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any;

    // Find user with relationships
    const user = await prisma.user.findUnique({
      where: { id: payload.userId },
      include: {
        systemAdmin: true,
        allianceManagers: {
          include: {
            alliance: true,
          },
        },
      },
    });

    if (!user || !user.isActive) {
      return null;
    }

    // Check session validity
    const session = await prisma.userSession.findFirst({
      where: {
        userId: user.id,
        sessionToken: payload.sessionId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    });

    if (!session) {
      return null;
    }

    return {
      id: user.id,
      discordId: user.discordId,
      discordUsername: user.discordUsername,
      pnwNationId: user.pnwNationId,
      pnwNationName: user.pnwNationName,
      isSystemAdmin: !!user.systemAdmin,
      systemAdminLevel: user.systemAdmin?.level,
      systemAdminPermissions: user.systemAdmin?.permissions,
      allianceManagers: user.allianceManagers.map(manager => ({
        id: manager.id,
        allianceId: manager.allianceId,
        allianceName: manager.alliance.allianceName,
        allianceSlug: manager.alliance.routeSlug,
        role: manager.role,
        permissions: manager.permissions,
        isActive: manager.isActive,
      })),
      sessionId: payload.sessionId,
    };
  } catch (error) {
    console.error('Authentication error:', error);
    return null;
  }
}

export function requireAuth(handler: (req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) => Promise<void>) {
  return async (req: NextApiRequest, res: NextApiResponse) => {
    const user = await authenticateUser(req);

    if (!user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    return handler(req, res, user);
  };
}

export function requireSystemAdmin(handler: (req: NextApiRequest, res: NextApiResponse, user: AuthenticatedUser) => Promise<void>) {
  return requireAuth(async (req, res, user) => {
    if (!user.isSystemAdmin) {
      return res.status(403).json({ error: 'System admin privileges required' });
    }
    return handler(req, res, user);
  });
}