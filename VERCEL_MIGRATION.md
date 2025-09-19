# Vercel + Supabase Migration Guide

## Why Vercel + Supabase is PERFECT

✅ **$0 cost** for most projects
✅ **Automatic scaling**
✅ **Global CDN** for frontend
✅ **Serverless backend** (no server management)
✅ **Built-in domain management**
✅ **Amazing developer experience**

## Architecture Change

### Current (Express):
```
Frontend (React) → Express Server → PostgreSQL + Redis
```

### New (Vercel + Supabase):
```
Frontend (Next.js) → Vercel API Routes → Supabase (DB + Auth + Storage)
```

## Migration Options

### Option 1: Quick Migration (Recommended)
Keep React frontend, convert Express routes to Vercel API routes:

```bash
# Project structure
├── pages/api/          # Backend API routes (Vercel serverless)
├── frontend/           # React app (unchanged)
├── prisma/            # Database schema (Supabase)
└── vercel.json        # Deployment config
```

### Option 2: Full Next.js (Best Long-term)
Convert React to Next.js 14 with App Router:

```bash
# Project structure
├── app/               # Next.js 14 App Router
│   ├── api/          # API routes
│   ├── dashboard/    # Pages
│   └── alliance/     # Alliance routes
├── components/       # React components
├── lib/             # Utilities
└── prisma/          # Database schema
```

## Benefits of Each Option

### Option 1: API Routes Only
- ✅ Minimal changes to existing React code
- ✅ Keep current frontend architecture
- ✅ Quick deployment
- ⚠️ Missing Next.js benefits (SSR, routing, etc.)

### Option 2: Full Next.js
- ✅ Server-side rendering
- ✅ Built-in routing
- ✅ Better SEO
- ✅ Image optimization
- ✅ Better performance
- ⚠️ More migration work

## Supabase Setup

1. **Database**: Use existing Prisma schema
2. **Auth**: Can replace Discord OAuth with Supabase Auth + Discord provider
3. **Storage**: For alliance logos, user avatars
4. **Real-time**: For live updates (optional)

## Cost Comparison

| Feature | Render | Vercel + Supabase |
|---------|--------|-------------------|
| Frontend | FREE | **FREE** |
| Backend | $7/month | **FREE** |
| Database | $7/month | **FREE** (500MB) |
| Storage | $4.5/month | **FREE** (1GB) |
| Domain | $12/year | **FREE** |
| **Total** | **$18.5/month** | **$0/month** |

## Redis Replacement

Since Vercel doesn't have Redis, we'll use:
- **Supabase**: For session storage (database)
- **Vercel KV**: For caching (if needed, $20/month)
- **Memory**: For rate limiting (per-function memory)

## Next Steps

1. **Choose migration path** (Option 1 or 2)
2. **Set up Supabase project**
3. **Convert authentication to serverless**
4. **Deploy to Vercel**
5. **Configure custom domain**