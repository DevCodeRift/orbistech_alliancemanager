# Politics and War Alliance Manager

A comprehensive web-based alliance management system for the Politics and War browser game, featuring Discord authentication, API key management, and alliance-specific dashboards.

## 🚀 **Now Powered by Vercel + Supabase!**

- ✅ **$0/month hosting cost**
- ✅ **Automatic scaling**
- ✅ **Global CDN performance**
- ✅ **Free custom domains**
- ✅ **Serverless architecture**

## Features

- **Discord OAuth Authentication** - Seamless login integration
- **API Key Management** - Secure storage and management of Politics and War API keys
- **Alliance-Specific Dashboards** - Dedicated management interfaces for each alliance
- **Central Administration** - System-wide administration for assigning alliance managers
- **Real-time Data Integration** - Direct integration with Politics and War GraphQL API
- **Role-Based Access Control** - Granular permissions for different user types

## Tech Stack

### Frontend
- **React 18** with **TypeScript**
- **Vite** for build tooling
- **Material-UI** for components
- **Zustand** for state management
- **React Router** for routing

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

# Add environment variables in Vercel dashboard
```

### 3. Complete Setup
```bash
# Push database schema
npm run db:push

# Seed initial data
npm run db:seed
```

**Full deployment guide: [VERCEL_DEPLOYMENT.md](VERCEL_DEPLOYMENT.md)**

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

### Environment Variables
```env
DATABASE_URL=postgresql://postgres.xxxx:[password]@supabase.com:5432/postgres
JWT_SECRET=your-jwt-secret
DISCORD_CLIENT_ID=your-discord-client-id
DISCORD_CLIENT_SECRET=your-discord-client-secret
ENCRYPTION_KEY=your-32-char-encryption-key
```

### Database Operations
```bash
# Generate Prisma client
npm run db:generate

# Push schema changes
npm run db:push

# Seed database
npm run db:seed
```

## API Routes

### Authentication
- `GET /api/auth/discord` - Discord OAuth login
- `GET /api/auth/discord/callback` - OAuth callback
- `GET /api/auth/me` - Current user info
- `POST /api/auth/logout` - User logout

### API Key Management
- `POST /api/api-keys/link` - Link PnW API key
- `GET /api/api-keys/status` - Get API key status
- `DELETE /api/api-keys/personal` - Remove personal key

### Alliances
- `GET /api/alliances` - List alliances
- `GET /api/alliances/:slug` - Alliance details

### Administration
- `GET /api/admin/users` - User management (admin only)
- `GET /api/admin/system-stats` - System statistics

## Alliance Routing

The application supports dynamic alliance-specific routes:

- `/alliance/:allianceName/dashboard` - Alliance overview
- `/alliance/:allianceName/members` - Member management
- `/alliance/:allianceName/banking` - Bank operations
- `/alliance/:allianceName/wars` - War tracking
- `/alliance/:allianceName/trade` - Trade analysis

## Security Features

- **API Key Encryption**: AES-256-GCM encryption for all API keys
- **Audit Logging**: Complete activity logging for security compliance
- **Rate Limiting**: Per-user and per-alliance API usage limits
- **JWT Sessions**: Secure token-based authentication
- **CORS Protection**: Proper cross-origin resource sharing configuration

## Architecture

```
Frontend (React/Vite) → Vercel API Routes → Supabase PostgreSQL
                            ↓
                     Politics & War GraphQL API
```

### Serverless Functions
- Each API route runs as an independent serverless function
- Automatic scaling based on demand
- Global edge deployment for low latency

### Database Design
- **Users**: Discord profiles with encrypted API keys
- **Alliances**: Game alliance data with routing slugs
- **Alliance Managers**: Permission-based access control
- **Audit Logs**: Security and compliance tracking

## Cost Comparison

| Platform | Monthly Cost |
|----------|-------------|
| **Vercel + Supabase** | **$0** ✅ |
| Render | $18.50 |
| DigitalOcean | $21.00 |
| AWS | $25-50 |

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## Security Policy

This tool is designed to assist with alliance management and does not automate gameplay. All actions require human confirmation as per Politics and War's automation policy.

## Support

- **GitHub Issues**: Bug reports and feature requests
- **Documentation**: Complete setup guides in `/docs`
- **Discord**: Community support server

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

**Built with ❤️ for the Politics and War community**