# Database Schema Documentation

## Overview

The Politics and War Alliance Manager uses PostgreSQL with Prisma ORM for data persistence. The schema is designed to handle user authentication via Discord, secure API key management, alliance-specific permissions, and comprehensive audit logging.

## Core Tables

### Users Table
Stores user accounts linked to Discord profiles and optionally to Politics and War nations.

**Key Fields:**
- `discordId` - Unique Discord user identifier
- `pnwApiKey` - Encrypted Politics and War API key
- `pnwNationId` - Linked nation ID from Politics and War
- `preferences` - JSON object for user settings

**Relationships:**
- One-to-many with `AllianceManager` (user can manage multiple alliances)
- One-to-one with `SystemAdmin` (optional admin privileges)
- One-to-many with `ApiUsageLog` and `AuditLog`

### Alliance Table
Represents Politics and War alliances with routing and management configuration.

**Key Fields:**
- `pnwAllianceId` - Actual alliance ID from Politics and War
- `routeSlug` - URL-friendly identifier for dynamic routing
- `isPublic` - Controls visibility of alliance data
- Cached statistics from PnW API

**Relationships:**
- One-to-many with `AllianceManager`
- One-to-many with logging tables

### AllianceManager Table
Junction table managing user permissions for specific alliances.

**Key Fields:**
- `managerApiKey` - Alliance-specific encrypted API key
- `permissions` - JSON object defining what actions manager can perform
- `role` - Manager level (viewer, manager, admin)

**Relationships:**
- Many-to-one with `User` and `Alliance`
- Self-referential to track who assigned the manager

## Security Tables

### SystemAdmin Table
Defines system-wide administrative privileges.

**Key Fields:**
- `level` - Admin tier (admin, super_admin)
- `permissions` - JSON object with system-wide permissions

### UserSession Table
Manages JWT tokens and session security.

**Key Fields:**
- `sessionToken` - Unique session identifier
- `expiresAt` - Session expiration timestamp
- Security metadata (IP, User-Agent)

### AuditLog Table
Comprehensive logging for security and compliance.

**Key Fields:**
- `action` - What happened (login, api_key_added, etc.)
- `oldValues`/`newValues` - Change tracking
- Context information (IP, User-Agent)

## Performance & Monitoring Tables

### ApiUsageLog Table
Tracks API usage for rate limiting and analytics.

**Key Fields:**
- `endpoint` - API endpoint called
- `queryHash` - Deduplicated GraphQL query identifier
- `responseTimeMs` - Performance metrics
- `cacheHit` - Cache utilization tracking

### RateLimit Table
Implements sliding window rate limiting.

**Key Fields:**
- `identifier` - User, alliance, or IP identifier
- `windowStart`/`windowEnd` - Time window boundaries
- `requests`/`maxRequests` - Current and maximum request counts

### PnwDataCache Table
Caches responses from Politics and War API.

**Key Fields:**
- `cacheKey` - Unique identifier for cached data
- `data` - JSON cached response
- `expiresAt` - Cache expiration
- `tags` - For targeted cache invalidation

## Configuration

### AppConfig Table
Stores application-wide configuration settings.

**Key Fields:**
- `key`/`value` - Configuration key-value pairs
- `category` - Grouping for related configs
- `dataType` - Type validation (string, number, boolean, json)

## Data Security

### Encryption Strategy

**API Keys:**
- All Politics and War API keys are encrypted using AES-256
- Unique salt per user for additional security
- Encryption key stored in environment variables

**Password Fields:**
- No passwords stored (Discord OAuth only)
- Session tokens are cryptographically secure

### Access Patterns

**Row-Level Security:**
- Users can only access their own data
- Alliance managers can only access their assigned alliance data
- System admins have broader access based on permissions

**Index Strategy:**
- Primary indexes on all foreign keys
- Composite indexes for common query patterns
- Time-based indexes for logging tables

## Migration Strategy

### Development
```bash
# Create new migration
npx prisma migrate dev --name migration_name

# Reset database (development only)
npx prisma migrate reset
```

### Production
```bash
# Deploy migrations
npx prisma migrate deploy

# Generate client
npx prisma generate
```

## Relationships Diagram

```
User
├── AllianceManager (many)
│   └── Alliance (one)
├── SystemAdmin (one, optional)
├── UserSession (many)
├── ApiUsageLog (many)
└── AuditLog (many)

Alliance
├── AllianceManager (many)
│   └── User (one)
├── ApiUsageLog (many)
└── AuditLog (many)

AllianceManager
├── User (one)
├── Alliance (one)
└── AssignedByUser (one, optional)
```

## Permissions Model

### User Permissions
```json
{
  "canViewOwnData": true,
  "canEditOwnProfile": true,
  "canLinkApiKey": true,
  "canDeleteAccount": true
}
```

### Alliance Manager Permissions
```json
{
  "canViewMembers": true,
  "canManageMembers": false,
  "canViewBank": true,
  "canManageBank": false,
  "canViewWars": true,
  "canViewTrades": true,
  "canManageSettings": false,
  "canViewAuditLog": true
}
```

### System Admin Permissions
```json
{
  "canManageUsers": true,
  "canManageAlliances": true,
  "canViewAuditLogs": true,
  "canManageSystem": true,
  "canManageAdmins": false
}
```

## Performance Considerations

### Indexes
- All foreign keys are indexed
- Composite indexes for common query patterns
- Partial indexes for filtered queries

### Caching
- API responses cached in `PnwDataCache`
- Redis used for session storage
- Application-level caching for frequently accessed data

### Query Optimization
- Use of Prisma's query optimization features
- Selective field loading
- Pagination for large datasets
- Connection pooling for database connections

## Backup and Recovery

### Regular Backups
- Daily full database backups
- Transaction log backups every 15 minutes
- Point-in-time recovery capability

### Data Retention
- API usage logs: 90 days
- Audit logs: 1 year
- Cache data: Based on TTL settings
- User data: Retained until account deletion

---

This schema design provides a robust foundation for the Politics and War Alliance Manager while maintaining security, performance, and scalability.