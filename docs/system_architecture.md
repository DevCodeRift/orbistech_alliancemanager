# Politics and War Alliance Manager - System Architecture

## Overview

The Politics and War Alliance Manager is a web application that provides alliance-specific management tools for the Politics and War browser game. The system allows Discord-authenticated users to link their game API keys and provides alliance-specific dashboards with dedicated managers.

## Core Requirements

### Functional Requirements

1. **User Authentication**
   - Discord OAuth 2.0 integration
   - Persistent user sessions
   - User profile management

2. **API Key Management**
   - Secure storage of Politics and War API keys
   - Per-user API key linking
   - Alliance-specific manager API keys
   - API key validation and testing

3. **Alliance Management**
   - Dynamic alliance-specific routes (`/AllianceName/ModuleName`)
   - Central administration for assigning alliance managers
   - Alliance manager permissions and access control
   - Alliance data synchronization

4. **Politics and War Integration**
   - GraphQL API integration
   - Real-time data fetching
   - Rate limiting and caching
   - Error handling and retry logic

### Non-Functional Requirements

1. **Security**
   - Encrypted API key storage
   - Secure authentication flow
   - Role-based access control
   - Audit logging

2. **Performance**
   - Response times under 2 seconds
   - Efficient API usage within rate limits
   - Caching for frequently accessed data
   - Scalable architecture

3. **Reliability**
   - 99.5% uptime target
   - Graceful error handling
   - Data backup and recovery
   - Monitoring and alerting

## System Architecture

### High-Level Architecture

```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Discord       │    │   Web Client    │    │  Politics & War │
│   OAuth         │◄──►│   (Frontend)    │◄──►│   GraphQL API   │
└─────────────────┘    └─────────────────┘    └─────────────────┘
                               │
                               ▼
                       ┌─────────────────┐
                       │  Load Balancer  │
                       └─────────────────┘
                               │
                               ▼
                       ┌─────────────────┐
                       │  Web Server     │
                       │  (Node.js/API)  │
                       └─────────────────┘
                               │
                               ▼
                       ┌─────────────────┐
                       │   Database      │
                       │ (PostgreSQL)    │
                       └─────────────────┘
```

### Technology Stack

#### Frontend
- **Framework**: React with TypeScript
- **Routing**: React Router for alliance-specific routes
- **State Management**: Redux Toolkit or Zustand
- **UI Framework**: Material-UI or Tailwind CSS
- **Authentication**: Discord OAuth integration

#### Backend
- **Runtime**: Node.js
- **Framework**: Express.js or Fastify
- **Language**: TypeScript
- **API**: RESTful API + GraphQL proxy
- **Authentication**: Passport.js with Discord strategy

#### Database
- **Primary**: PostgreSQL
- **Caching**: Redis
- **ORM**: Prisma or TypeORM

#### Infrastructure
- **Hosting**: Docker containers
- **Load Balancer**: Nginx
- **Monitoring**: Prometheus + Grafana
- **Logging**: Winston + ELK stack

### Database Schema

#### Core Tables

```sql
-- Users table
CREATE TABLE users (
    id UUID PRIMARY KEY,
    discord_id VARCHAR(255) UNIQUE NOT NULL,
    discord_username VARCHAR(255) NOT NULL,
    discord_avatar VARCHAR(255),
    pnw_api_key TEXT ENCRYPTED,
    pnw_nation_id INTEGER,
    pnw_nation_name VARCHAR(255),
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW(),
    last_login TIMESTAMP
);

-- Alliances table
CREATE TABLE alliances (
    id UUID PRIMARY KEY,
    pnw_alliance_id INTEGER UNIQUE NOT NULL,
    alliance_name VARCHAR(255) NOT NULL,
    alliance_acronym VARCHAR(50),
    route_slug VARCHAR(100) UNIQUE NOT NULL,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Alliance managers table
CREATE TABLE alliance_managers (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    alliance_id UUID REFERENCES alliances(id),
    manager_api_key TEXT ENCRYPTED,
    permissions JSONB,
    assigned_by UUID REFERENCES users(id),
    assigned_at TIMESTAMP DEFAULT NOW(),
    is_active BOOLEAN DEFAULT TRUE,
    UNIQUE(user_id, alliance_id)
);

-- System administrators table
CREATE TABLE system_admins (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    permissions JSONB,
    created_at TIMESTAMP DEFAULT NOW()
);

-- API usage logs table
CREATE TABLE api_usage_logs (
    id UUID PRIMARY KEY,
    user_id UUID REFERENCES users(id),
    alliance_id UUID REFERENCES alliances(id) NULL,
    endpoint VARCHAR(255),
    query_hash VARCHAR(255),
    response_time_ms INTEGER,
    status_code INTEGER,
    created_at TIMESTAMP DEFAULT NOW()
);
```

### API Architecture

#### Authentication Flow

1. User clicks "Login with Discord"
2. Redirect to Discord OAuth authorization
3. Discord returns authorization code
4. Exchange code for access token
5. Fetch user profile from Discord API
6. Create or update user record
7. Generate JWT session token
8. Store session in Redis

#### Alliance Routing

Dynamic routes will be handled by middleware that:

1. Extracts alliance slug from URL (`/AllianceName/ModuleName`)
2. Validates alliance exists and user has access
3. Loads alliance-specific context and manager API key
4. Proxies Politics and War API requests with appropriate key

### Security Architecture

#### API Key Security

```javascript
// API key encryption/decryption
const encryptApiKey = (apiKey: string, userSalt: string): string => {
    const cipher = crypto.createCipher('aes-256-gcm', process.env.ENCRYPTION_KEY + userSalt);
    let encrypted = cipher.update(apiKey, 'utf8', 'hex');
    encrypted += cipher.final('hex');
    return encrypted;
};

// Role-based access control
const permissions = {
    SYSTEM_ADMIN: ['manage_alliances', 'assign_managers', 'view_all_data'],
    ALLIANCE_MANAGER: ['view_alliance_data', 'manage_members', 'access_bank'],
    USER: ['view_own_data', 'link_api_key']
};
```

#### Rate Limiting Strategy

```javascript
// Rate limiting by user and alliance
const rateLimits = {
    perUser: {
        requests: 100,
        window: '15m'
    },
    perAlliance: {
        requests: 500,
        window: '15m'
    },
    global: {
        requests: 1500,
        window: '15m'
    }
};
```

### Politics and War API Integration

#### GraphQL Proxy Architecture

```javascript
// API proxy with caching and rate limiting
class PnWAPIProxy {
    async query(query: string, variables: any, apiKey: string, allianceId?: string) {
        // Check cache first
        const cacheKey = this.generateCacheKey(query, variables);
        const cached = await redis.get(cacheKey);
        if (cached) return JSON.parse(cached);

        // Check rate limits
        await this.checkRateLimit(apiKey, allianceId);

        // Execute query
        const response = await this.executeGraphQLQuery(query, variables, apiKey);

        // Cache response
        await redis.setex(cacheKey, 300, JSON.stringify(response));

        // Log usage
        await this.logAPIUsage(apiKey, query, response);

        return response;
    }
}
```

### Module Architecture

#### Alliance Management Modules

1. **Dashboard Module** (`/AllianceName/dashboard`)
   - Alliance overview and statistics
   - Member activity summary
   - Recent events and notifications

2. **Members Module** (`/AllianceName/members`)
   - Member list with filtering and sorting
   - Individual member profiles
   - Activity tracking

3. **Banking Module** (`/AllianceName/banking`)
   - Bank transaction history
   - Resource management
   - Grant and loan tracking

4. **Wars Module** (`/AllianceName/wars`)
   - Active war tracking
   - War history and statistics
   - Member military status

5. **Trade Module** (`/AllianceName/trade`)
   - Market analysis
   - Trade recommendations
   - Resource price tracking

### Deployment Architecture

#### Container Strategy

```dockerfile
# Multi-stage Docker build
FROM node:18-alpine AS builder
WORKDIR /app
COPY package*.json ./
RUN npm ci --only=production

FROM node:18-alpine AS runtime
WORKDIR /app
COPY --from=builder /app/node_modules ./node_modules
COPY . .
EXPOSE 3000
CMD ["npm", "start"]
```

#### Infrastructure as Code

```yaml
# docker-compose.yml
version: '3.8'
services:
  web:
    build: .
    ports:
      - "3000:3000"
    environment:
      - DATABASE_URL=postgresql://user:pass@db:5432/pnw_alliance_manager
      - REDIS_URL=redis://redis:6379
    depends_on:
      - db
      - redis

  db:
    image: postgres:15
    environment:
      - POSTGRES_DB=pnw_alliance_manager
      - POSTGRES_USER=user
      - POSTGRES_PASSWORD=pass
    volumes:
      - postgres_data:/var/lib/postgresql/data

  redis:
    image: redis:7-alpine

volumes:
  postgres_data:
```

### Monitoring and Observability

#### Metrics Collection

- API response times and error rates
- Database query performance
- Politics and War API usage and rate limits
- User activity and session metrics
- Cache hit/miss ratios

#### Alerting Strategy

- API rate limit approaching (80% of daily limit)
- High error rates (>5% over 5 minutes)
- Database connection issues
- Politics and War API unavailability
- Unusual user activity patterns

### Scalability Considerations

#### Horizontal Scaling

- Stateless application design
- Session storage in Redis
- Database connection pooling
- Load balancing across multiple instances

#### Caching Strategy

- API response caching (5-15 minutes)
- User session caching
- Alliance data caching
- Database query result caching

### Security Measures

#### Data Protection

- API keys encrypted at rest with AES-256
- Sensitive data transmission over HTTPS only
- Regular security audits and penetration testing
- Compliance with data protection regulations

#### Access Control

- JWT-based authentication
- Role-based authorization
- API key scope limitations
- Audit logging for all sensitive operations

---

This architecture provides a robust, scalable, and secure foundation for the Politics and War Alliance Manager system.