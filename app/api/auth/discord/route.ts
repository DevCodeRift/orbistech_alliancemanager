import { NextResponse } from 'next/server'

export const dynamic = 'force-dynamic'

export async function GET() {
  const clientId = process.env.DISCORD_CLIENT_ID!
  const redirectUri = process.env.DISCORD_REDIRECT_URI!

  const discordOAuthUrl = new URL('https://discord.com/api/oauth2/authorize')
  discordOAuthUrl.searchParams.set('client_id', clientId)
  discordOAuthUrl.searchParams.set('redirect_uri', redirectUri)
  discordOAuthUrl.searchParams.set('response_type', 'code')
  discordOAuthUrl.searchParams.set('scope', 'identify')

  return NextResponse.redirect(discordOAuthUrl.toString())
}