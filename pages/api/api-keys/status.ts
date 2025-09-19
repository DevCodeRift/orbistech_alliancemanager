import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { decryptApiKey, maskSensitiveData } from '../../../lib/encryption';
import { checkApiKeyRateLimit } from '../../../lib/pnwApi';

export default requireAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'GET') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const userData = await prisma.user.findUnique({
      where: { id: user.id },
      select: {
        pnwApiKey: true,
        pnwNationId: true,
        pnwNationName: true,
        allianceManagers: {
          where: { isActive: true },
          select: {
            id: true,
            managerApiKey: true,
            alliance: {
              select: {
                allianceName: true,
                routeSlug: true,
              },
            },
          },
        },
      },
    });

    if (!userData) {
      return res.status(404).json({ error: 'User not found' });
    }

    const response: any = {
      success: true,
      personalApiKey: null,
      allianceApiKeys: [],
    };

    // Check personal API key
    if (userData.pnwApiKey) {
      try {
        const decryptedKey = decryptApiKey(userData.pnwApiKey);
        const rateLimit = await checkApiKeyRateLimit(decryptedKey);

        response.personalApiKey = {
          isLinked: true,
          nationId: userData.pnwNationId,
          nationName: userData.pnwNationName,
          maskedKey: maskSensitiveData(decryptedKey),
          usage: {
            used: rateLimit.requestsUsed,
            max: rateLimit.maxRequests,
            percentage: rateLimit.percentageUsed,
            isNearLimit: rateLimit.isNearLimit,
          },
        };
      } catch (error) {
        console.error('Error checking personal API key:', error);
        response.personalApiKey = {
          isLinked: true,
          error: 'Unable to verify API key status',
        };
      }
    } else {
      response.personalApiKey = { isLinked: false };
    }

    // Check alliance API keys
    for (const manager of userData.allianceManagers) {
      if (manager.managerApiKey) {
        try {
          const decryptedKey = decryptApiKey(manager.managerApiKey);
          const rateLimit = await checkApiKeyRateLimit(decryptedKey);

          response.allianceApiKeys.push({
            allianceName: manager.alliance.allianceName,
            allianceSlug: manager.alliance.routeSlug,
            isLinked: true,
            maskedKey: maskSensitiveData(decryptedKey),
            usage: {
              used: rateLimit.requestsUsed,
              max: rateLimit.maxRequests,
              percentage: rateLimit.percentageUsed,
              isNearLimit: rateLimit.isNearLimit,
            },
          });
        } catch (error) {
          console.error(`Error checking alliance API key for ${manager.alliance.routeSlug}:`, error);
          response.allianceApiKeys.push({
            allianceName: manager.alliance.allianceName,
            allianceSlug: manager.alliance.routeSlug,
            isLinked: true,
            error: 'Unable to verify API key status',
          });
        }
      } else {
        response.allianceApiKeys.push({
          allianceName: manager.alliance.allianceName,
          allianceSlug: manager.alliance.routeSlug,
          isLinked: false,
        });
      }
    }

    res.json(response);
  } catch (error) {
    console.error('Get API key status error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});