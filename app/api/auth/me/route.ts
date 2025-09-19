import { NextRequest, NextResponse } from 'next/server'
import { authenticateUser } from '@/lib/auth'

export const dynamic = 'force-dynamic'

export async function GET(request: NextRequest) {
  const user = await authenticateUser(request)

  if (!user) {
    return NextResponse.json({ error: 'Authentication required' }, { status: 401 })
  }

  return NextResponse.json({
    id: user.id,
    discordId: user.discordId,
    discordUsername: user.discordUsername,
    discordAvatar: user.discordId ? `https://cdn.discordapp.com/avatars/${user.discordId}/${user.discordId}.png` : null,
    pnwNationName: user.pnwNationName,
    isSystemAdmin: user.isSystemAdmin,
    allianceManagers: user.allianceManagers,
  })
}