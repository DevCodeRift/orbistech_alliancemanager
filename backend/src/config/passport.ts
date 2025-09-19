import passport from 'passport';
import { Strategy as JWTStrategy, ExtractJwt } from 'passport-jwt';
import { Strategy as DiscordStrategy } from 'passport-discord';
import { PrismaClient } from '@prisma/client';
import { Request } from 'express';

const prisma = new PrismaClient();

// JWT Strategy for API authentication
passport.use(
  new JWTStrategy(
    {
      jwtFromRequest: ExtractJwt.fromAuthHeaderAsBearerToken(),
      secretOrKey: process.env.JWT_SECRET!,
      passReqToCallback: true,
    },
    async (req: Request, payload: any, done) => {
      try {
        // Find user by ID from JWT payload
        const user = await prisma.user.findUnique({
          where: { id: payload.userId },
          include: {
            systemAdmin: true,
            allianceManagers: {
              include: {
                alliance: true,
              },
            },
          },
        });

        if (!user || !user.isActive) {
          return done(null, false, { message: 'User not found or inactive' });
        }

        // Check if session is still valid
        const session = await prisma.userSession.findFirst({
          where: {
            userId: user.id,
            sessionToken: payload.sessionId,
            isActive: true,
            expiresAt: {
              gt: new Date(),
            },
          },
        });

        if (!session) {
          return done(null, false, { message: 'Session expired or invalid' });
        }

        // Attach user data to request
        return done(null, {
          id: user.id,
          discordId: user.discordId,
          discordUsername: user.discordUsername,
          pnwNationId: user.pnwNationId,
          pnwNationName: user.pnwNationName,
          isSystemAdmin: !!user.systemAdmin,
          systemAdminLevel: user.systemAdmin?.level,
          systemAdminPermissions: user.systemAdmin?.permissions,
          allianceManagers: user.allianceManagers.map(manager => ({
            id: manager.id,
            allianceId: manager.allianceId,
            allianceName: manager.alliance.allianceName,
            allianceSlug: manager.alliance.routeSlug,
            role: manager.role,
            permissions: manager.permissions,
            isActive: manager.isActive,
          })),
          sessionId: payload.sessionId,
        });
      } catch (error) {
        console.error('JWT Strategy error:', error);
        return done(error, false);
      }
    }
  )
);

// Discord OAuth Strategy
passport.use(
  new DiscordStrategy(
    {
      clientID: process.env.DISCORD_CLIENT_ID!,
      clientSecret: process.env.DISCORD_CLIENT_SECRET!,
      callbackURL: process.env.DISCORD_REDIRECT_URI!,
      scope: ['identify', 'guilds'],
    },
    async (accessToken: string, refreshToken: string, profile: any, done) => {
      try {
        console.log('Discord OAuth callback received for user:', profile.username);

        // Check if user already exists
        let user = await prisma.user.findUnique({
          where: { discordId: profile.id },
        });

        if (user) {
          // Update existing user with latest Discord info
          user = await prisma.user.update({
            where: { discordId: profile.id },
            data: {
              discordUsername: profile.username,
              discordTag: `${profile.username}#${profile.discriminator}`,
              discordAvatar: profile.avatar,
              lastLogin: new Date(),
            },
          });

          console.log('Updated existing user:', user.discordUsername);
        } else {
          // Check if registration is enabled
          const registrationEnabled = await prisma.appConfig.findUnique({
            where: { key: 'registration_enabled' },
          });

          if (registrationEnabled?.value !== 'true') {
            return done(null, false, { message: 'Registration is currently disabled' });
          }

          // Create new user
          user = await prisma.user.create({
            data: {
              discordId: profile.id,
              discordUsername: profile.username,
              discordTag: `${profile.username}#${profile.discriminator}`,
              discordAvatar: profile.avatar,
              lastLogin: new Date(),
              language: 'en',
              timezone: 'UTC',
            },
          });

          console.log('Created new user:', user.discordUsername);

          // Check if this user should be made a system admin
          const adminDiscordIds = process.env.ADMIN_DISCORD_IDS?.split(',') || [];
          if (adminDiscordIds.includes(profile.id)) {
            await prisma.systemAdmin.create({
              data: {
                userId: user.id,
                level: 'super_admin',
                permissions: {
                  canManageUsers: true,
                  canManageAlliances: true,
                  canViewAuditLogs: true,
                  canManageSystem: true,
                  canManageAdmins: true,
                },
              },
            });

            console.log('Granted system admin privileges to:', user.discordUsername);
          }

          // Log user registration
          await prisma.auditLog.create({
            data: {
              userId: user.id,
              action: 'user_registered',
              resource: 'user',
              resourceId: user.id,
              newValues: {
                discordId: user.discordId,
                discordUsername: user.discordUsername,
              },
            },
          });
        }

        // Log successful login
        await prisma.auditLog.create({
          data: {
            userId: user.id,
            action: 'user_login',
            resource: 'user',
            resourceId: user.id,
            metadata: {
              method: 'discord_oauth',
            },
          },
        });

        return done(null, user);
      } catch (error) {
        console.error('Discord OAuth error:', error);
        return done(error, false);
      }
    }
  )
);

// Serialize/deserialize user for session storage (not used with JWT, but required by Passport)
passport.serializeUser((user: any, done) => {
  done(null, user.id);
});

passport.deserializeUser(async (id: string, done) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id },
    });
    done(null, user);
  } catch (error) {
    done(error, null);
  }
});

export default passport;