import jwt from 'jsonwebtoken'
import { NextRequest, NextResponse } from 'next/server'
import { prisma } from './prisma'

export interface AuthenticatedUser {
  id: string
  discordId: string
  discordUsername: string
  pnwNationId?: number
  pnwNationName?: string
  isSystemAdmin: boolean
  systemAdminLevel?: string
  systemAdminPermissions?: any
  allianceManagers: Array<{
    id: string
    allianceId: string
    allianceName: string
    allianceSlug: string
    role: string
    permissions: any
    isActive: boolean
  }>
  sessionId: string
}

export async function authenticateUser(request: NextRequest): Promise<AuthenticatedUser | null> {
  try {
    const authHeader = request.headers.get('authorization')
    if (!authHeader || !authHeader.startsWith('Bearer ')) {
      return null
    }

    const token = authHeader.substring(7)
    const payload = jwt.verify(token, process.env.JWT_SECRET!) as any

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
    })

    if (!user || !user.isActive) {
      return null
    }

    const session = await prisma.userSession.findFirst({
      where: {
        userId: user.id,
        sessionToken: payload.sessionId,
        isActive: true,
        expiresAt: {
          gt: new Date(),
        },
      },
    })

    if (!session) {
      return null
    }

    return {
      id: user.id,
      discordId: user.discordId,
      discordUsername: user.discordUsername,
      pnwNationId: user.pnwNationId || undefined,
      pnwNationName: user.pnwNationName || undefined,
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
    }
  } catch (error) {
    console.error('Authentication error:', error)
    return null
  }
}

export function requireAuth<T extends any[]>(
  handler: (request: NextRequest, ...args: [...T, AuthenticatedUser]) => Promise<NextResponse>
) {
  return async (request: NextRequest, ...args: T): Promise<NextResponse> => {
    const user = await authenticateUser(request)

    if (!user) {
      return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
    }

    return handler(request, ...args, user)
  }
}

export function requireSystemAdmin<T extends any[]>(
  handler: (request: NextRequest, ...args: [...T, AuthenticatedUser]) => Promise<NextResponse>
) {
  return requireAuth(async (request: NextRequest, ...args: [...T, AuthenticatedUser]): Promise<NextResponse> => {
    const user = args[args.length - 1] as AuthenticatedUser

    if (!user.isSystemAdmin) {
      return NextResponse.json({ error: 'System admin privileges required' }, { status: 403 })
    }

    return handler(request, ...args)
  })
}