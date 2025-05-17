import { RateLimiterMemory } from 'rate-limiter-flexible';
import logger from './logger';

// Rate limiting configuration
interface RateLimiterOptions {
  points: number;
  duration: number;
  keyPrefix?: string;
}

const defaultOptions: RateLimiterOptions = {
  points: 100, // 100 requests
  duration: 60, // per 60 seconds by IP
  keyPrefix: 'rl_global',
};

class RateLimiter {
  private limiter: RateLimiterMemory;
  private options: RateLimiterOptions;

  constructor(options: Partial<RateLimiterOptions> = {}) {
    this.options = { ...defaultOptions, ...options };
    this.limiter = new RateLimiterMemory({
      points: this.options.points,
      duration: this.options.duration,
      keyPrefix: this.options.keyPrefix,
    });
  }

  async consume(ip: string): Promise<RateLimitResult> {
    try {
      await this.limiter.consume(ip);
      return { success: true };
    } catch (error) {
      const errorMessage = `Rate limit (${this.options.points}/${this.options.duration}s) exceeded for IP: ${ip}`;
      logger.warn(errorMessage);
      return {
        success: false,
        error: 'Too many requests',
        status: 429,
      };
    }
  }

  async middleware(ip: string): Promise<RateLimitResult> {
    return this.consume(ip);
  }
}

// Global rate limiter
export const globalRateLimiter = new RateLimiter();

// Rate limiter for sensitive endpoints
export const sensitiveRateLimiter = new RateLimiter({
  points: 10, // More restrictive for sensitive endpoints
  duration: 60,
  keyPrefix: 'rl_sensitive',
});

// Rate limiter for auth endpoints
export const authRateLimiter = new RateLimiter({
  points: 5,
  duration: 60,
  keyPrefix: 'rl_auth',
});

// Helper function to get client IP from request
export function getClientIp(req: { headers: { [key: string]: string | string[] | undefined } }): string {
  // Check for forwarded-for header first
  const forwardedFor = req.headers['x-forwarded-for'];
  if (forwardedFor) {
    if (Array.isArray(forwardedFor)) {
      return forwardedFor[0].split(',')[0].trim();
    }
    return forwardedFor.split(',')[0].trim();
  }

  // Fallback to other headers
  const headersToCheck = [
    'x-real-ip',
    'x-client-ip',
    'cf-connecting-ip',
    'fastly-client-ip',
    'true-client-ip',
    'x-forwarded',
    'forwarded-for',
    'x-cluster-client-ip',
  ];

  for (const header of headersToCheck) {
    const value = req.headers[header];
    if (value) {
      if (Array.isArray(value)) {
        return value[0].split(',')[0].trim();
      }
      return value.split(',')[0].trim();
    }
  }

  // Default to a generic IP if none found
  return 'unknown-ip';
}

// Middleware for Next.js API routes
export function withRateLimit(
  handler: Function,
  limiter: RateLimiter = globalRateLimiter
) {
  return async (req: any, res: any) => {
    const ip = getClientIp(req);
    const result = await limiter.middleware(ip);

    if (!result.success) {
      return res.status(result.status || 429).json({
        success: false,
        error: result.error || 'Rate limit exceeded',
      });
    }

    return handler(req, res);
  };
}

interface RateLimitResult {
  success: boolean;
  error?: string;
  status?: number;
}
