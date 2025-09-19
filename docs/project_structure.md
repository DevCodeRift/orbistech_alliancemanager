# Project Structure

## Directory Layout

```
orbistech_alliancemanager/
├── docs/                           # Documentation
│   ├── project_tracking.md
│   ├── system_architecture.md
│   └── project_structure.md
├── backend/                        # Node.js/Express API
│   ├── src/
│   │   ├── controllers/           # API route handlers
│   │   ├── middleware/            # Authentication, validation, etc.
│   │   ├── models/               # Database models
│   │   ├── services/             # Business logic
│   │   ├── utils/                # Helper functions
│   │   ├── routes/               # Route definitions
│   │   ├── config/               # Configuration files
│   │   └── app.ts                # Express app setup
│   ├── prisma/                   # Database schema and migrations
│   ├── tests/                    # Backend tests
│   ├── package.json
│   ├── tsconfig.json
│   └── .env.example
├── frontend/                       # React application
│   ├── src/
│   │   ├── components/           # Reusable components
│   │   ├── pages/                # Page components
│   │   ├── hooks/                # Custom React hooks
│   │   ├── services/             # API calls
│   │   ├── store/                # State management
│   │   ├── utils/                # Helper functions
│   │   ├── types/                # TypeScript type definitions
│   │   ├── styles/               # CSS/SCSS files
│   │   └── App.tsx               # Main app component
│   ├── public/                   # Static assets
│   ├── package.json
│   ├── tsconfig.json
│   └── vite.config.ts
├── docker/                         # Docker configuration
│   ├── Dockerfile.backend
│   ├── Dockerfile.frontend
│   └── docker-compose.yml
├── scripts/                        # Build and deployment scripts
├── .gitignore
├── README.md
└── pnw_api_reference.md
```

## Technology Stack

### Backend
- **Runtime**: Node.js 18+
- **Framework**: Express.js
- **Language**: TypeScript
- **Database**: PostgreSQL with Prisma ORM
- **Caching**: Redis
- **Authentication**: Passport.js with Discord strategy
- **API Documentation**: Swagger/OpenAPI

### Frontend
- **Framework**: React 18+ with TypeScript
- **Build Tool**: Vite
- **Routing**: React Router v6
- **State Management**: Zustand
- **UI Framework**: Material-UI (MUI)
- **HTTP Client**: Axios
- **Form Handling**: React Hook Form

### Development Tools
- **Linting**: ESLint with TypeScript rules
- **Formatting**: Prettier
- **Testing**: Jest + React Testing Library
- **Pre-commit**: Husky + lint-staged

### Infrastructure
- **Containerization**: Docker
- **Orchestration**: Docker Compose
- **Load Balancer**: Nginx
- **Process Manager**: PM2 (production)

## Key Features Implementation

### Alliance-Specific Routing
Frontend routes will handle dynamic alliance segments:
```
/alliance/:allianceName/dashboard
/alliance/:allianceName/members
/alliance/:allianceName/banking
/alliance/:allianceName/wars
/alliance/:allianceName/trade
```

### API Structure
Backend API will follow RESTful conventions with GraphQL proxy:
```
/api/auth/*                 # Authentication endpoints
/api/users/*                # User management
/api/alliances/*            # Alliance management
/api/pnw-proxy/*           # Politics & War API proxy
/api/admin/*               # Administrative functions
```

### Security Implementation
- JWT tokens for session management
- API keys encrypted with AES-256
- Rate limiting per user and alliance
- CORS configuration for frontend
- Input validation and sanitization

### Database Design
Using Prisma ORM with PostgreSQL for:
- User management with Discord integration
- Alliance and manager relationships
- API usage logging and analytics
- Session storage with Redis

This structure provides clear separation of concerns, scalability, and maintainability for the Politics and War Alliance Manager.