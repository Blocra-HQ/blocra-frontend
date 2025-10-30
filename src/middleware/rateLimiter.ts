interface RateLimitStore {
  [key: string]: { count: number; resetTime: number };
}

export class RateLimiter {
  private store: RateLimitStore = {};
  private windowMs: number;
  private maxRequests: number;

  constructor(windowMs: number, maxRequests: number) {
    this.windowMs = windowMs;
    this.maxRequests = maxRequests;
    setInterval(() => this.cleanup(), 60000);
  }

  isAllowed(identifier: string): { allowed: boolean; remaining: number } {
    const now = Date.now();
    
    if (!this.store[identifier] || now > this.store[identifier].resetTime) {
      this.store[identifier] = { count: 1, resetTime: now + this.windowMs };
      return { allowed: true, remaining: this.maxRequests - 1 };
    }

    if (this.store[identifier].count >= this.maxRequests) {
      return { allowed: false, remaining: 0 };
    }

    this.store[identifier].count++;
    return { allowed: true, remaining: this.maxRequests - this.store[identifier].count };
  }

  private cleanup() {
    const now = Date.now();
    Object.keys(this.store).forEach(key => {
      if (now > this.store[key].resetTime) delete this.store[key];
    });
  }
}

export const rateLimiters = {
  api: new RateLimiter(15 * 60 * 1000, 100),
  auth: new RateLimiter(15 * 60 * 1000, 5),
  query: new RateLimiter(60 * 1000, 10),
  bounty: new RateLimiter(60 * 60 * 1000, 5)
};