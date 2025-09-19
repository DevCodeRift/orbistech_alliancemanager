import axios from 'axios';

const PNW_API_BASE_URL = process.env.PNW_API_BASE_URL || 'https://api.politicsandwar.com/graphql';

interface ApiKeyValidationResult {
  isValid: boolean;
  nationId?: number;
  nationName?: string;
  allianceId?: number;
  allianceName?: string;
  permissions?: {
    canViewNationResources: boolean;
    canViewAllianceBank: boolean;
    canManageAllianceBank: boolean;
  };
  requestsUsed?: number;
  maxRequests?: number;
  error?: string;
}

const VALIDATION_QUERY = `
  query {
    me {
      requests
      max_requests
      key
      permissions {
        nation_view_resources
        alliance_view_bank
        alliance_withdraw_bank
      }
    }
    nations(id: [self], first: 1) {
      data {
        id
        nation_name
        alliance_id
        alliance {
          id
          name
        }
      }
    }
  }
`;

export async function validatePnWApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  try {
    if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 20) {
      return {
        isValid: false,
        error: 'Invalid API key format',
      };
    }

    const response = await axios.post(
      `${PNW_API_BASE_URL}?api_key=${encodeURIComponent(apiKey)}`,
      { query: VALIDATION_QUERY },
      {
        timeout: 10000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PnW-Alliance-Manager/1.0',
        },
      }
    );

    if (response.data.errors && response.data.errors.length > 0) {
      const error = response.data.errors[0];

      if (error.message.includes('Invalid API key') || error.message.includes('Unauthorized')) {
        return {
          isValid: false,
          error: 'Invalid or expired API key',
        };
      }

      if (error.message.includes('Rate limit exceeded')) {
        return {
          isValid: false,
          error: 'API rate limit exceeded, please try again later',
        };
      }

      return {
        isValid: false,
        error: `API error: ${error.message}`,
      };
    }

    const { me, nations } = response.data.data;

    if (!me || !nations || !nations.data || nations.data.length === 0) {
      return {
        isValid: false,
        error: 'Unable to retrieve nation data',
      };
    }

    const nation = nations.data[0];

    return {
      isValid: true,
      nationId: nation.id,
      nationName: nation.nation_name,
      allianceId: nation.alliance_id,
      allianceName: nation.alliance?.name,
      permissions: {
        canViewNationResources: me.permissions?.nation_view_resources || false,
        canViewAllianceBank: me.permissions?.alliance_view_bank || false,
        canManageAllianceBank: me.permissions?.alliance_withdraw_bank || false,
      },
      requestsUsed: me.requests,
      maxRequests: me.max_requests,
    };
  } catch (error: any) {
    console.error('PnW API validation error:', error);

    if (error.code === 'ENOTFOUND' || error.code === 'ECONNREFUSED') {
      return {
        isValid: false,
        error: 'Unable to connect to Politics and War API',
      };
    }

    if (error.code === 'TIMEOUT' || error.code === 'ECONNABORTED') {
      return {
        isValid: false,
        error: 'Request timeout - Politics and War API is slow to respond',
      };
    }

    if (error.response?.status === 429) {
      return {
        isValid: false,
        error: 'Rate limit exceeded, please try again later',
      };
    }

    if (error.response?.status >= 500) {
      return {
        isValid: false,
        error: 'Politics and War API is currently unavailable',
      };
    }

    return {
      isValid: false,
      error: 'Failed to validate API key',
    };
  }
}

export async function checkApiKeyRateLimit(apiKey: string): Promise<{
  requestsUsed: number;
  maxRequests: number;
  percentageUsed: number;
  isNearLimit: boolean;
}> {
  const meQuery = `
    query {
      me {
        requests
        max_requests
      }
    }
  `;

  try {
    const response = await axios.post(
      `${PNW_API_BASE_URL}?api_key=${encodeURIComponent(apiKey)}`,
      { query: meQuery },
      {
        timeout: 5000,
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PnW-Alliance-Manager/1.0',
        },
      }
    );

    const { me } = response.data.data;
    const requestsUsed = me.requests || 0;
    const maxRequests = me.max_requests || 2000;
    const percentageUsed = (requestsUsed / maxRequests) * 100;
    const isNearLimit = percentageUsed > 80;

    return {
      requestsUsed,
      maxRequests,
      percentageUsed,
      isNearLimit,
    };
  } catch (error) {
    throw new Error('Failed to check rate limit');
  }
}