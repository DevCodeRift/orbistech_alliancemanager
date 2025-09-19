import { PrismaClient } from '@prisma/client';
import { hash } from 'bcryptjs';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Starting database seed...');

  // Create default app configuration
  console.log('📝 Creating default app configuration...');

  const configs = [
    {
      key: 'app_name',
      value: 'Politics and War Alliance Manager',
      description: 'Application name',
      category: 'general',
      isPublic: true,
    },
    {
      key: 'app_version',
      value: '1.0.0',
      description: 'Application version',
      category: 'general',
      isPublic: true,
    },
    {
      key: 'maintenance_mode',
      value: 'false',
      description: 'Enable maintenance mode',
      category: 'system',
      dataType: 'boolean',
    },
    {
      key: 'registration_enabled',
      value: 'true',
      description: 'Allow new user registrations',
      category: 'auth',
      dataType: 'boolean',
    },
    {
      key: 'default_rate_limit_requests',
      value: '100',
      description: 'Default rate limit requests per window',
      category: 'rate_limiting',
      dataType: 'number',
    },
    {
      key: 'default_rate_limit_window_ms',
      value: '900000',
      description: 'Default rate limit window in milliseconds (15 minutes)',
      category: 'rate_limiting',
      dataType: 'number',
    },
    {
      key: 'cache_default_ttl_seconds',
      value: '300',
      description: 'Default cache TTL in seconds (5 minutes)',
      category: 'caching',
      dataType: 'number',
    },
    {
      key: 'pnw_api_rate_limit_buffer',
      value: '0.8',
      description: 'Buffer ratio for PnW API rate limits (80%)',
      category: 'api',
      dataType: 'number',
    },
  ];

  for (const config of configs) {
    await prisma.appConfig.upsert({
      where: { key: config.key },
      update: config,
      create: config,
    });
  }

  // Create some sample alliances (you can remove these or replace with real data)
  console.log('🏛️ Creating sample alliances...');

  const sampleAlliances = [
    {
      pnwAllianceId: 7452, // Example alliance ID
      allianceName: 'The Knights Radiant',
      acronym: 'TKR',
      routeSlug: 'tkr',
      displayName: 'The Knights Radiant',
      description: 'Honor is dead, but I\'ll see what I can do.',
      color: 'aqua',
      isPublic: true,
      memberCount: 150,
      totalScore: 12500000.0,
      averageScore: 83333.33,
      rank: 1,
    },
    {
      pnwAllianceId: 7531, // Example alliance ID
      allianceName: 'Eclipse',
      acronym: 'Eclipse',
      routeSlug: 'eclipse',
      displayName: 'Eclipse',
      description: 'A sample alliance for testing purposes.',
      color: 'black',
      isPublic: true,
      memberCount: 100,
      totalScore: 8000000.0,
      averageScore: 80000.0,
      rank: 5,
    },
    {
      pnwAllianceId: 1234, // Example alliance ID
      allianceName: 'Test Alliance Please Ignore',
      acronym: 'TEST',
      routeSlug: 'test',
      displayName: 'Test Alliance',
      description: 'A test alliance for development and testing.',
      color: 'gray',
      isPublic: false,
      memberCount: 10,
      totalScore: 500000.0,
      averageScore: 50000.0,
      rank: 100,
    },
  ];

  for (const alliance of sampleAlliances) {
    await prisma.alliance.upsert({
      where: { pnwAllianceId: alliance.pnwAllianceId },
      update: alliance,
      create: alliance,
    });
  }

  // Create sample users if ADMIN_DISCORD_IDS is provided
  const adminDiscordIds = process.env.ADMIN_DISCORD_IDS?.split(',') || [];

  if (adminDiscordIds.length > 0 && adminDiscordIds[0]) {
    console.log('👤 Creating sample admin user...');

    const adminUser = await prisma.user.upsert({
      where: { discordId: adminDiscordIds[0] },
      update: {},
      create: {
        discordId: adminDiscordIds[0],
        discordUsername: 'admin',
        discordTag: 'admin#0001',
        pnwNationName: 'Admin Nation',
        isActive: true,
        language: 'en',
        timezone: 'UTC',
      },
    });

    // Make the first admin user a system admin
    await prisma.systemAdmin.upsert({
      where: { userId: adminUser.id },
      update: {},
      create: {
        userId: adminUser.id,
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

    // Create a sample alliance manager for testing
    const testAlliance = await prisma.alliance.findFirst({
      where: { routeSlug: 'test' },
    });

    if (testAlliance) {
      await prisma.allianceManager.upsert({
        where: {
          userId_allianceId: {
            userId: adminUser.id,
            allianceId: testAlliance.id,
          },
        },
        update: {},
        create: {
          userId: adminUser.id,
          allianceId: testAlliance.id,
          assignedBy: adminUser.id,
          role: 'admin',
          title: 'Test Manager',
          permissions: {
            canViewMembers: true,
            canManageMembers: true,
            canViewBank: true,
            canManageBank: true,
            canViewWars: true,
            canViewTrades: true,
            canManageSettings: true,
          },
        },
      });
    }

    console.log('✅ Created admin user and permissions');
  }

  console.log('✅ Database seed completed successfully!');
}

main()
  .catch((e) => {
    console.error('❌ Error during database seed:');
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });