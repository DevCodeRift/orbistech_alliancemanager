# Required Environment Variables for Supabase + Render Deployment

## Backend Web Service Environment Variables

Add these in your Render dashboard under "Environment Variables":

### Database (Supabase)
```
DATABASE_URL=postgresql://postgres.xxxxxxxxxxxx:[password]@aws-0-us-west-1.pooler.supabase.com:5432/postgres
```
**Note**: Get this from your Supabase project settings → Database → Connection string

### Required Discord OAuth Variables
```
DISCORD_CLIENT_ID=your_discord_client_id_here
DISCORD_CLIENT_SECRET=your_discord_client_secret_here
DISCORD_REDIRECT_URI=https://your-backend-url.onrender.com/api/auth/discord/callback
```

### Required Security Variables
```
JWT_SECRET=your_super_secret_jwt_key_minimum_32_characters
ENCRYPTION_KEY=your_32_character_encryption_key_here
SESSION_SECRET=your_session_secret_key_here
```

### Application Configuration
```
NODE_ENV=production
PORT=10000
CORS_ORIGIN=https://your-frontend-url.onrender.com
LOG_LEVEL=info
```

### Optional Admin Configuration
```
ADMIN_DISCORD_IDS=your_discord_id,another_admin_discord_id
```

### Rate Limiting (Optional - has defaults)
```
RATE_LIMIT_WINDOW_MS=900000
RATE_LIMIT_MAX_REQUESTS=100
```

## Frontend Environment Variables

Create a `.env.production` file in the frontend directory:

```
VITE_API_BASE_URL=https://your-backend-url.onrender.com/api
```

## How to Get Discord OAuth Credentials

1. Go to https://discord.com/developers/applications
2. Click "New Application"
3. Give it a name (e.g., "PnW Alliance Manager")
4. Go to "OAuth2" → "General"
5. Copy the "Client ID" and "Client Secret"
6. Add redirect URI: `https://your-backend-url.onrender.com/api/auth/discord/callback`

## Security Key Generation

Generate secure keys with:
```bash
# JWT Secret (32+ characters)
openssl rand -base64 32

# Encryption Key (exactly 32 characters)
openssl rand -hex 16

# Session Secret
openssl rand -base64 32
```

## Database & Redis URLs

These are automatically provided by Render when you create the services:
- `DATABASE_URL` - Automatically set from PostgreSQL service
- `REDIS_URL` - Automatically set from Redis service