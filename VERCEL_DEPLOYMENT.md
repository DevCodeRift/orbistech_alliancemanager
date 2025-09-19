# Vercel + Supabase Deployment Guide

## 🚀 Quick Deploy (5 minutes)

### Step 1: Set up Supabase (2 minutes)

1. **Create Supabase Account**
   - Go to [supabase.com](https://supabase.com)
   - Sign up/login with GitHub

2. **Create New Project**
   - Click "New Project"
   - **Name**: `pnw-alliance-manager`
   - **Database Password**: Generate strong password (save it!)
   - **Region**: Choose closest to your users
   - Click "Create new project"

3. **Get Database URL**
   - Go to **Settings** → **Database**
   - Copy **Connection string** (URI format)
   - Should look like: `postgresql://postgres.xxxx:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres`

4. **Run Database Setup**
   ```bash
   # Set your DATABASE_URL temporarily
   export DATABASE_URL="your-supabase-connection-string"

   # Push database schema to Supabase
   npm run db:push

   # Seed with initial data
   npm run db:seed
   ```

### Step 2: Deploy to Vercel (2 minutes)

1. **Install Vercel CLI**
   ```bash
   npm i -g vercel
   ```

2. **Deploy Project**
   ```bash
   # Deploy to Vercel
   vercel

   # Follow prompts:
   # - Link to existing project? No
   # - Project name: pnw-alliance-manager
   # - Directory: ./
   # - Override settings? No
   ```

3. **Set Environment Variables**
   - Go to Vercel dashboard → Your project → Settings → Environment Variables
   - Add these variables:

   ```env
   DATABASE_URL=postgresql://postgres.xxxx:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
   JWT_SECRET=your-super-secret-jwt-key-here
   ENCRYPTION_KEY=your-32-character-encryption-key
   DISCORD_CLIENT_ID=your-discord-client-id
   DISCORD_CLIENT_SECRET=your-discord-client-secret
   DISCORD_REDIRECT_URI=https://your-app.vercel.app/api/auth/discord/callback
   CORS_ORIGIN=https://your-app.vercel.app
   ADMIN_DISCORD_IDS=your-discord-id
   ```

4. **Redeploy with Environment Variables**
   ```bash
   vercel --prod
   ```

### Step 3: Configure Discord OAuth (1 minute)

1. **Go to Discord Developer Portal**
   - Visit [discord.com/developers/applications](https://discord.com/developers/applications)
   - Click your application or create new one

2. **Update OAuth Settings**
   - Go to **OAuth2** → **General**
   - Add redirect URI: `https://your-app.vercel.app/api/auth/discord/callback`
   - Save changes

### Step 4: Test Deployment

1. **Visit Your App**
   - Go to `https://your-app.vercel.app`
   - Test Discord login
   - Link your PnW API key

2. **Check Logs**
   ```bash
   vercel logs
   ```

## 🔧 Environment Variables

### Required Variables

```env
# Database (from Supabase)
DATABASE_URL=postgresql://postgres.xxxx:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres

# Security (generate these)
JWT_SECRET=generate-with-openssl-rand-base64-32
ENCRYPTION_KEY=generate-with-openssl-rand-hex-16
SESSION_SECRET=generate-with-openssl-rand-base64-32

# Discord OAuth (from Discord Developer Portal)
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
DISCORD_REDIRECT_URI=https://your-app.vercel.app/api/auth/discord/callback

# Application Config
CORS_ORIGIN=https://your-app.vercel.app
NODE_ENV=production
```

### Optional Variables

```env
# Admin Users (your Discord ID)
ADMIN_DISCORD_IDS=your-discord-id,another-admin-id

# Politics & War API
PNW_API_BASE_URL=https://api.politicsandwar.com/graphql

# Rate Limiting
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## 🔐 Security Key Generation

```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Encryption Key (exactly 32 characters)
openssl rand -hex 16

# Session Secret
openssl rand -base64 32
```

## 🎯 Custom Domain Setup

1. **Add Domain in Vercel**
   - Go to project → Settings → Domains
   - Add your custom domain
   - Follow DNS setup instructions

2. **Update Environment Variables**
   - Change `CORS_ORIGIN` to your custom domain
   - Update `DISCORD_REDIRECT_URI` to your custom domain
   - Update Discord OAuth settings

## 🔍 Troubleshooting

### Common Issues

1. **"Prisma Client not found"**
   ```bash
   # Make sure Prisma generates after install
   vercel env add DATABASE_URL
   vercel --prod
   ```

2. **Discord OAuth not working**
   - Check redirect URI matches exactly
   - Ensure CORS_ORIGIN is set correctly
   - Verify Discord client ID/secret

3. **Database connection errors**
   - Verify Supabase connection string format
   - Check database is created and accessible
   - Ensure schema is pushed to Supabase

4. **API routes returning 404**
   - Check `pages/api/` directory structure
   - Verify Next.js configuration
   - Check Vercel function logs

### Debug Commands

```bash
# Check Vercel logs
vercel logs

# Test local development
vercel dev

# Check environment variables
vercel env ls

# Redeploy with logs
vercel --prod --debug
```

## 💰 Cost Breakdown

| Service | Plan | Cost |
|---------|------|------|
| **Vercel** | Hobby | **FREE** |
| **Supabase** | Free Tier | **FREE** |
| **Domain** | Optional | $10-15/year |
| **Total** | | **$0/month** 🎉 |

## 🎉 You're Done!

Your Politics and War Alliance Manager is now running on:
- ✅ **Vercel** (frontend + API)
- ✅ **Supabase** (PostgreSQL database)
- ✅ **Free hosting** with custom domain support
- ✅ **Automatic scaling** and global CDN
- ✅ **Zero monthly costs**

The app will automatically scale based on usage and handle thousands of users without any server management!