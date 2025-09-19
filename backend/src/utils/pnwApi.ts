import axios from 'axios';

const PNW_API_BASE_URL = process.env.PNW_API_BASE_URL || 'https://api.politicsandwar.com/graphql';

/**
 * Interface for PnW API key validation response
 */
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

/**
 * Test query to validate API key and get basic nation info
 */
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

/**
 * Validate a Politics and War API key
 * @param apiKey - The API key to validate
 * @returns Validation result with nation/alliance info
 */
export async function validatePnWApiKey(apiKey: string): Promise<ApiKeyValidationResult> {
  try {
    // Basic format validation
    if (!apiKey || typeof apiKey !== 'string' || apiKey.length < 20) {
      return {
        isValid: false,
        error: 'Invalid API key format',
      };
    }

    // Make request to PnW API
    const response = await axios.post(
      `${PNW_API_BASE_URL}?api_key=${encodeURIComponent(apiKey)}`,
      {
        query: VALIDATION_QUERY,
      },
      {
        timeout: 10000, // 10 second timeout
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PnW-Alliance-Manager/1.0',
        },
      }
    );

    // Check for GraphQL errors
    if (response.data.errors && response.data.errors.length > 0) {
      const error = response.data.errors[0];

      // Check for common error types
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

    // Extract data from response
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

    // Handle specific axios errors
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

/**
 * Make a GraphQL query to the Politics and War API
 * @param query - GraphQL query string
 * @param variables - Query variables
 * @param apiKey - API key to use
 * @returns Query result
 */
export async function makePnWQuery(
  query: string,
  variables: any = {},
  apiKey: string
): Promise<any> {
  try {
    const response = await axios.post(
      `${PNW_API_BASE_URL}?api_key=${encodeURIComponent(apiKey)}`,
      {
        query,
        variables,
      },
      {
        timeout: 30000, // 30 second timeout for data queries
        headers: {
          'Content-Type': 'application/json',
          'User-Agent': 'PnW-Alliance-Manager/1.0',
        },
      }
    );

    if (response.data.errors && response.data.errors.length > 0) {
      throw new Error(`GraphQL Error: ${response.data.errors[0].message}`);
    }

    return response.data.data;
  } catch (error: any) {
    console.error('PnW API query error:', error);
    throw error;
  }
}

/**
 * Check API key rate limit status
 * @param apiKey - API key to check
 * @returns Rate limit information
 */
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
    const isNearLimit = percentageUsed > 80; // Consider 80%+ as "near limit"

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

/**
 * Generate a cache key for PnW API queries
 * @param query - GraphQL query
 * @param variables - Query variables
 * @returns Cache key string
 */
export function generateCacheKey(query: string, variables: any = {}): string {
  const crypto = require('crypto');
  const content = JSON.stringify({ query: query.trim(), variables });
  return crypto.createHash('md5').update(content).digest('hex');
}

/**
 * Estimate the complexity/cost of a GraphQL query
 * @param query - GraphQL query string
 * @returns Estimated complexity score
 */
export function estimateQueryComplexity(query: string): number {
  // Simple complexity estimation based on query structure
  let complexity = 1;

  // Count nested fields
  const nestedFields = (query.match(/{[^}]*{/g) || []).length;
  complexity += nestedFields * 2;

  // Count array queries (pagination)
  const arrayQueries = (query.match(/\(.*first:\s*\d+/g) || []).length;
  complexity += arrayQueries * 3;

  // Check for expensive operations
  if (query.includes('wars')) complexity += 5;
  if (query.includes('bankrecs')) complexity += 3;
  if (query.includes('trades')) complexity += 3;
  if (query.includes('warattacks')) complexity += 8;

  return Math.min(complexity, 100); // Cap at 100
}

/**
 * Get API key permission summary for display
 * @param apiKey - API key to analyze
 * @returns Permission summary
 */
export async function getApiKeyPermissionSummary(apiKey: string): Promise<{
  canViewNationData: boolean;
  canViewNationResources: boolean;
  canViewAllianceData: boolean;
  canViewAllianceBank: boolean;
  canManageAllianceBank: boolean;
  dailyRequests: number;
  isVip: boolean;
}> {
  const validation = await validatePnWApiKey(apiKey);

  if (!validation.isValid) {
    throw new Error(validation.error || 'Invalid API key');
  }

  return {
    canViewNationData: true, // All API keys can view basic nation data
    canViewNationResources: validation.permissions?.canViewNationResources || false,
    canViewAllianceData: true, // All API keys can view basic alliance data
    canViewAllianceBank: validation.permissions?.canViewAllianceBank || false,
    canManageAllianceBank: validation.permissions?.canManageAllianceBank || false,
    dailyRequests: validation.maxRequests || 2000,
    isVip: (validation.maxRequests || 2000) > 2000,
  };
}