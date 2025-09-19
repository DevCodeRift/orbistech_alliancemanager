import { NextApiRequest, NextApiResponse } from 'next';
import { requireAuth } from '../../../lib/auth';
import { prisma } from '../../../lib/prisma';

export default requireAuth(async (req: NextApiRequest, res: NextApiResponse, user) => {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    // Invalidate current session
    await prisma.userSession.updateMany({
      where: {
        userId: user.id,
        sessionToken: user.sessionId,
        isActive: true,
      },
      data: {
        isActive: false,
      },
    });

    // Log logout action
    await prisma.auditLog.create({
      data: {
        userId: user.id,
        action: 'user_logout',
        resource: 'user',
        resourceId: user.id,
        ipAddress: req.headers['x-forwarded-for']?.toString() || null,
        userAgent: req.headers['user-agent'] || null,
      },
    });

    res.json({ success: true, message: 'Logged out successfully' });
  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({ error: 'Internal server error' });
  }
});