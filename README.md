# Politics and War Alliance Manager - Vercel + Supabase

A comprehensive web-based alliance management system for the Politics and War browser game, now fully optimized for Vercel + Supabase deployment.

## 🚀 **Fully Rebuilt for Vercel + Supabase**

- ✅ **Next.js 14 with App Router** - Modern React framework
- ✅ **Vercel API Routes** - Serverless backend functions
- ✅ **Supabase PostgreSQL** - Managed database with existing schema
- ✅ **$0/month hosting cost** - Free tier deployment
- ✅ **Automatic scaling** - Serverless architecture
- ✅ **Global CDN performance** - Edge deployment

## Features

- **Discord OAuth Authentication** - Seamless login integration
- **API Key Management** - Secure storage and management of Politics and War API keys
- **Alliance-Specific Dashboards** - Dedicated management interfaces for each alliance
- **Central Administration** - System-wide administration for assigning alliance managers
- **Real-time Data Integration** - Direct integration with Politics and War GraphQL API
- **Role-Based Access Control** - Granular permissions for different user types

## Tech Stack

### Frontend
- **Next.js 14** with **App Router**
- **TypeScript** for type safety
- **Material-UI** for components
- **Zustand** for state management

### Backend
- **Vercel API Routes** (serverless functions)
- **TypeScript**
- **Prisma** ORM for database management
- **JWT** authentication with Discord OAuth

### Database & Storage
- **Supabase PostgreSQL** (free tier: 500MB)
- **Encrypted API key storage** with AES-256
- **Audit logging** for security and compliance

## 🚀 Quick Deployment

### 1. Set up Supabase (2 minutes)
```bash
# 1. Create account at supabase.com
# 2. Create new project: pnw-alliance-manager
# 3. Get DATABASE_URL from Settings → Database
```

### 2. Deploy to Vercel (2 minutes)
```bash
# Install Vercel CLI
npm i -g vercel

# Deploy
vercel

# Environment variables will be prompted during deployment
```

### 3. Complete Setup
```bash
# Push database schema to Supabase
npm run db:push

# Seed initial data (optional)
npm run db:seed
```

## Environment Variables

Set these in Vercel dashboard or during deployment:

```env
DATABASE_URL=postgresql://postgres:[password]@db.[project].supabase.co:5432/postgres
JWT_SECRET=your-super-secret-jwt-key
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_REDIRECT_URI=https://your-app.vercel.app/api/auth/discord/callback
ADMIN_DISCORD_IDS=discord-id-1,discord-id-2
ENCRYPTION_KEY=your-32-character-encryption-key
NEXT_PUBLIC_APP_URL=https://your-app.vercel.app
NEXT_PUBLIC_SUPABASE_URL=https://[project].supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=[anon_key]
```

## Development

### Local Development
```bash
# Install dependencies
npm install

# Set up environment variables
cp .env.example .env.local

# Start development server
npm run dev

# Open http://localhost:3000
```

### Database Operations
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes to Supabase
npm run db:push

# Seed database
npm run db:seed
```

## Project Structure

```
├── app/                    # Next.js 14 App Router
│   ├── api/               # API routes (serverless functions)
│   │   └── auth/         # Authentication endpoints
│   ├── dashboard/        # Dashboard page
│   ├── login/           # Login page
│   └── auth/            # Auth success page
├── components/          # React components
├── lib/                # Utilities and configurations
│   ├── stores/         # Zustand stores
│   ├── supabase/       # Supabase client
│   ├── auth.ts         # Authentication utilities
│   ├── prisma.ts       # Database client
│   └── theme.ts        # Material-UI theme
├── prisma/             # Database schema and migrations
├── vercel.json         # Vercel deployment config
└── next.config.js      # Next.js configuration
```

## API Routes

### Authentication
- `GET /api/auth/discord` - Discord OAuth login
- `GET /api/auth/discord/callback` - OAuth callback
- `GET /api/auth/me` - Current user info

### Database Schema

The application uses a comprehensive Prisma schema with:
- **Users** - Discord profiles with encrypted API keys
- **Alliances** - Game alliance data with routing slugs
- **Alliance Managers** - Permission-based access control
- **Audit Logs** - Security and compliance tracking
- **User Sessions** - JWT session management
- **Rate Limits** - API usage tracking

## Deployment Steps Completed

1. ✅ **Analyzed existing architecture** - Complex Express + React hybrid
2. ✅ **Planned new architecture** - Next.js 14 + Vercel + Supabase
3. ✅ **Cleaned up old files** - Removed Express backend and Vite frontend
4. ✅ **Set up Next.js 14** - App Router with TypeScript
5. ✅ **Configured Supabase** - Database integration with existing schema
6. ✅ **Rebuilt API routes** - Converted to Vercel serverless functions
7. ✅ **Migrated frontend** - React components to Next.js App Router
8. ✅ **Set up deployment** - Vercel configuration and environment variables

## Cost Comparison

| Platform | Monthly Cost |
|----------|-------------|
| **Vercel + Supabase** | **$0** ✅ |
| Previous Render Setup | $18.50 |
| DigitalOcean | $21.00 |
| AWS | $25-50 |

## Next Steps

1. **Deploy to Vercel** - `vercel --prod`
2. **Set up Supabase database** - Create project and get connection string
3. **Configure environment variables** - Add all required env vars in Vercel
4. **Push database schema** - `npm run db:push`
5. **Test authentication flow** - Login with Discord
6. **Configure custom domain** - Optional, free with Vercel

## Security Features

- **API Key Encryption**: AES-256-GCM encryption for all API keys
- **Audit Logging**: Complete activity logging for security compliance
- **Rate Limiting**: Per-user and per-alliance API usage limits
- **JWT Sessions**: Secure token-based authentication
- **CORS Protection**: Proper cross-origin resource sharing configuration

---

**✨ Fully rebuilt and optimized for Vercel + Supabase deployment**