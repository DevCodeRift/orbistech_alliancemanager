# Politics and War Alliance Manager

A comprehensive web-based alliance management system for the Politics and War browser game, featuring Discord authentication, API key management, and alliance-specific dashboards.

## Features

- **Discord OAuth Authentication** - Seamless login integration with Discord
- **API Key Management** - Secure storage and management of Politics and War API keys
- **Alliance-Specific Dashboards** - Dedicated management interfaces for each alliance
- **Central Administration** - System-wide administration for assigning alliance managers
- **Real-time Data Integration** - Direct integration with Politics and War GraphQL API
- **Role-Based Access Control** - Granular permissions for different user types

## Project Structure

```
├── backend/          # Node.js/Express API server
├── frontend/         # React application
├── docker/           # Docker configuration files
├── docs/            # Project documentation
└── scripts/         # Build and deployment scripts
```

## Tech Stack

### Backend
- **Node.js** with **TypeScript**
- **Express.js** web framework
- **PostgreSQL** database with **Prisma** ORM
- **Redis** for caching and sessions
- **Passport.js** for Discord OAuth
- **JWT** for authentication

### Frontend
- **React 18** with **TypeScript**
- **Vite** for build tooling
- **Material-UI** for components
- **Zustand** for state management
- **React Router** for routing

## Quick Start

### Prerequisites
- Node.js 18+
- PostgreSQL 15+
- Redis 7+
- Discord Application (for OAuth)
- Politics and War API Key

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/orbixtech/pnw-alliance-manager.git
   cd pnw-alliance-manager
   ```

2. **Install dependencies**
   ```bash
   npm run install:all
   ```

3. **Environment Configuration**
   ```bash
   # Backend environment
   cp backend/.env.example backend/.env
   # Edit backend/.env with your configuration
   ```

4. **Database Setup**
   ```bash
   npm run db:setup
   ```

5. **Start development servers**
   ```bash
   npm run dev
   ```

### Using Docker

1. **Start all services**
   ```bash
   npm run docker:dev
   ```

2. **Stop services**
   ```bash
   npm run docker:down
   ```

## Configuration

### Discord OAuth Setup

1. Create a Discord Application at https://discord.com/developers/applications
2. Add redirect URI: `http://localhost:5000/api/auth/discord/callback`
3. Copy Client ID and Secret to `.env` file

### Politics and War API

1. Get your API key from https://politicsandwar.com/account/#7
2. Add to environment configuration
3. Ensure proper rate limiting configuration

## API Routes

### Authentication
- `POST /api/auth/discord` - Discord OAuth login
- `POST /api/auth/logout` - User logout
- `GET /api/auth/me` - Current user info

### Users
- `GET /api/users/profile` - User profile
- `PUT /api/users/profile` - Update profile
- `POST /api/users/api-key` - Link PnW API key

### Alliances
- `GET /api/alliances` - List all alliances
- `GET /api/alliances/:slug` - Alliance details
- `POST /api/alliances/:slug/manager` - Assign manager

### Administration
- `GET /api/admin/users` - User management
- `POST /api/admin/alliances` - Create alliance
- `PUT /api/admin/users/:id/role` - Update user role

## Development

### Available Scripts

```bash
# Development
npm run dev              # Start both frontend and backend
npm run dev:backend      # Start only backend
npm run dev:frontend     # Start only frontend

# Building
npm run build           # Build both applications
npm run build:backend   # Build only backend
npm run build:frontend  # Build only frontend

# Testing
npm run test           # Run all tests
npm run test:backend   # Run backend tests
npm run test:frontend  # Run frontend tests

# Linting
npm run lint           # Lint all code
npm run lint:backend   # Lint backend code
npm run lint:frontend  # Lint frontend code
```

### Database Operations

```bash
# Migrations
npm run db:setup        # Run migrations and seed
npm run db:reset        # Reset database

# Prisma commands (from backend directory)
npx prisma migrate dev  # Create and run migration
npx prisma generate     # Generate Prisma client
npx prisma studio      # Open Prisma Studio
```

## Alliance Routing

The application supports dynamic alliance-specific routes:

- `/alliance/:allianceName/dashboard` - Alliance overview
- `/alliance/:allianceName/members` - Member management
- `/alliance/:allianceName/banking` - Bank operations
- `/alliance/:allianceName/wars` - War tracking
- `/alliance/:allianceName/trade` - Trade analysis

## Security

- API keys encrypted at rest using AES-256
- JWT tokens for session management
- Rate limiting to prevent abuse
- CORS protection
- Input validation and sanitization
- Audit logging for sensitive operations

## Contributing

1. Fork the repository
2. Create a feature branch
3. Make your changes
4. Add tests for new functionality
5. Ensure all tests pass
6. Submit a pull request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Support

For issues and questions:
- Create an issue on GitHub
- Join our Discord server
- Check the documentation in the `/docs` folder

---

**Note**: This tool is designed to assist with alliance management and does not automate gameplay. All actions require human confirmation as per Politics and War's automation policy.