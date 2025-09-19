import { NextApiRequest, NextApiResponse } from 'next';
import Joi from 'joi';
import { requireAuth } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';
import { encryptApiKey, generateSalt, decryptApiKey } from '../../../lib/encryption';
import { validatePnWApiKey } from '../../../lib/pnwApi';

const linkApiKeySchema = Joi.object({
  apiKey: Joi.string().required().min(20).max(200),
  keyType: Joi.string().valid('personal', 'alliance').default('personal'),
  allianceSlug: Joi.string().when('keyType', {
    is: 'alliance',
    then: Joi.required(),
    otherwise: Joi.forbidden(),
  }),
});

export default requireAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
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

      await prisma.user.update({
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
          ipAddress: req.headers['x-forwarded-for']?.toString() || null,
          userAgent: req.headers['user-agent'] || null,
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
          ipAddress: req.headers['x-forwarded-for']?.toString() || null,
          userAgent: req.headers['user-agent'] || null,
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