import { Router } from 'express';
import { requireAuth, requireAllianceManager } from '../middleware/auth';
import { PrismaClient } from '@prisma/client';
import { encryptApiKey, decryptApiKey, maskSensitiveData, generateSalt } from '../utils/encryption';
import { validatePnWApiKey, getApiKeyPermissionSummary, checkApiKeyRateLimit } from '../utils/pnwApi';
import Joi from 'joi';

const router = Router();
const prisma = new PrismaClient();

// Validation schemas
const linkApiKeySchema = Joi.object({
  apiKey: Joi.string().required().min(20).max(200),
  keyType: Joi.string().valid('personal', 'alliance').default('personal'),
  allianceSlug: Joi.string().when('keyType', {
    is: 'alliance',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
});

/**
 * @route   POST /api/api-keys/link
 * @desc    Link a Politics and War API key to user account
 * @access  Private
 */
router.post('/link', requireAuth, async (req, res) => {
  try {
    const user = req.user!;
    const { error, value } = linkApiKeySchema.validate(req.body);

    if (error) {
      return res.status(400).json({
        error: 'Validation error',
        details: error.details[0].message,
      });
    }

    const { apiKey, keyType, allianceSlug } = value;

    // Validate the API key with PnW API
    console.log(`Validating API key for user ${user.discordUsername}...`);
    const validation = await validatePnWApiKey(apiKey);

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid API key',
        details: validation.error,
      });
    }

    // Check if this API key is already linked to another user
    const existingApiKeyUser = await prisma.user.findFirst({
      where: {
        pnwApiKey: {
          not: null,
        },
      },
    });

    // We can't directly check encrypted API keys, so we'll need to decrypt and compare
    // This is expensive but necessary for security
    if (existingApiKeyUser?.pnwApiKey) {
      try {
        const existingKey = decryptApiKey(existingApiKeyUser.pnwApiKey);
        if (existingKey === apiKey) {
          return res.status(409).json({
            error: 'API key already linked to another account',
          });
        }
      } catch (error) {
        // Ignore decryption errors for old/invalid keys
        console.warn('Failed to decrypt existing API key for comparison');
      }
    }

    if (keyType === 'personal') {
      // Link as personal API key
      const userSalt = generateSalt();
      const encryptedApiKey = encryptApiKey(apiKey, userSalt);

      const updatedUser = await prisma.user.update({
        where: { id: user.id },
        data: {
          pnwApiKey: encryptedApiKey,
          pnwNationId: validation.nationId,
          pnwNationName: validation.nationName,
        },
      });

      // Log the API key linking
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          action: 'api_key_linked',
          resource: 'user',
          resourceId: user.id,
          newValues: {
            nationId: validation.nationId,
            nationName: validation.nationName,
            allianceId: validation.allianceId,
            allianceName: validation.allianceName,
            permissions: validation.permissions,
          },
          ipAddress: req.ip || null,
          userAgent: req.get('User-Agent') || null,
        },
      });

      res.json({
        success: true,
        message: 'Personal API key linked successfully',
        nation: {
          id: validation.nationId,
          name: validation.nationName,
          allianceId: validation.allianceId,
          allianceName: validation.allianceName,
        },
        permissions: validation.permissions,
        apiUsage: {
          used: validation.requestsUsed,
          max: validation.maxRequests,
        },
      });
    } else if (keyType === 'alliance') {
      // Link as alliance manager API key
      const alliance = await prisma.alliance.findUnique({
        where: { routeSlug: allianceSlug },
      });

      if (!alliance) {
        return res.status(404).json({ error: 'Alliance not found' });
      }

      // Check if user is a manager for this alliance
      const allianceManager = await prisma.allianceManager.findFirst({
        where: {
          userId: user.id,
          allianceId: alliance.id,
          isActive: true,
        },
      });

      if (!allianceManager && !user.isSystemAdmin) {
        return res.status(403).json({
          error: 'You must be an alliance manager to link an alliance API key',
        });
      }

      // Encrypt and store alliance API key
      const userSalt = generateSalt();
      const encryptedApiKey = encryptApiKey(apiKey, userSalt);

      if (allianceManager) {
        await prisma.allianceManager.update({
          where: { id: allianceManager.id },
          data: {
            managerApiKey: encryptedApiKey,
          },
        });
      }

      // Log the alliance API key linking
      await prisma.auditLog.create({
        data: {
          userId: user.id,
          allianceId: alliance.id,
          action: 'alliance_api_key_linked',
          resource: 'alliance_manager',
          resourceId: allianceManager?.id,
          newValues: {
            allianceSlug: allianceSlug,
            nationId: validation.nationId,
            nationName: validation.nationName,
          },
          ipAddress: req.ip || null,
          userAgent: req.get('User-Agent') || null,
        },
      });

      res.json({
        success: true,
        message: 'Alliance API key linked successfully',
        alliance: {
          name: alliance.allianceName,
          slug: alliance.routeSlug,
        },
        nation: {
          id: validation.nationId,
          name: validation.nationName,
        },
        permissions: validation.permissions,
      });
    }
  } catch (error) {
    console.error('Link API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   GET /api/api-keys/status
 * @desc    Get API key status and information
 * @access  Private
 */
router.get('/status', requireAuth, async (req, res) => {
  try {
    const user = req.user!;

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

/**
 * @route   DELETE /api/api-keys/personal
 * @desc    Remove personal API key
 * @access  Private
 */
router.delete('/personal', requireAuth, async (req, res) => {
  try {
    const user = req.user!;

    await prisma.user.update({
      where: { id: user.id },
      data: {
        pnwApiKey: null,
        pnwNationId: null,
        pnwNationName: null,
      },
    });

    // Log API key removal
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'api_key_removed',
        resource: 'user',
        resourceId: user.id,
        oldValues: {
          hadApiKey: true,
        },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      },
    });

    res.json({
      success: true,
      message: 'Personal API key removed successfully',
    });
  } catch (error) {
    console.error('Remove personal API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   DELETE /api/api-keys/alliance/:slug
 * @desc    Remove alliance API key
 * @access  Private
 */
router.delete('/alliance/:slug', requireAllianceManager, async (req, res) => {
  try {
    const user = req.user!;
    const { slug } = req.params;

    const alliance = await prisma.alliance.findUnique({
      where: { routeSlug: slug },
    });

    if (!alliance) {
      return res.status(404).json({ error: 'Alliance not found' });
    }

    const allianceManager = await prisma.allianceManager.findFirst({
      where: {
        userId: user.id,
        allianceId: alliance.id,
        isActive: true,
      },
    });

    if (!allianceManager && !user.isSystemAdmin) {
      return res.status(403).json({ error: 'Access denied' });
    }

    if (allianceManager) {
      await prisma.allianceManager.update({
        where: { id: allianceManager.id },
        data: {
          managerApiKey: null,
        },
      });
    }

    // Log alliance API key removal
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        allianceId: alliance.id,
        action: 'alliance_api_key_removed',
        resource: 'alliance_manager',
        resourceId: allianceManager?.id,
        oldValues: {
          allianceSlug: slug,
          hadApiKey: true,
        },
        ipAddress: req.ip || null,
        userAgent: req.get('User-Agent') || null,
      },
    });

    res.json({
      success: true,
      message: 'Alliance API key removed successfully',
    });
  } catch (error) {
    console.error('Remove alliance API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

/**
 * @route   POST /api/api-keys/validate
 * @desc    Validate an API key without linking it
 * @access  Private
 */
router.post('/validate', requireAuth, async (req, res) => {
  try {
    const { apiKey } = req.body;

    if (!apiKey) {
      return res.status(400).json({ error: 'API key is required' });
    }

    const validation = await validatePnWApiKey(apiKey);

    if (!validation.isValid) {
      return res.status(400).json({
        error: 'Invalid API key',
        details: validation.error,
      });
    }

    // Get permission summary
    const permissions = await getApiKeyPermissionSummary(apiKey);

    res.json({
      success: true,
      validation: {
        isValid: true,
        nation: {
          id: validation.nationId,
          name: validation.nationName,
          allianceId: validation.allianceId,
          allianceName: validation.allianceName,
        },
        permissions,
        usage: {
          used: validation.requestsUsed,
          max: validation.maxRequests,
        },
      },
    });
  } catch (error) {
    console.error('Validate API key error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});

export default router;