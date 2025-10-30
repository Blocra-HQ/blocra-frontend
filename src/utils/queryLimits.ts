// Query execution limits and rate limiting
export const QUERY_LIMITS = {
  MAX_RESULTS: 10000,
  MAX_QUERY_LENGTH: 5000,
  RATE_LIMIT_REQUESTS: 10, // per minute
  RATE_LIMIT_WINDOW: 60000, // 1 minute in ms
  ALLOWED_TABLES: ['blocks', 'transactions', 'bounties', 'contracts']
};

class QueryRateLimiter {
  private requests: number[] = [];
  
  canExecute(): boolean {
    const now = Date.now();
    // Remove old requests outside the window
    this.requests = this.requests.filter(time => now - time < QUERY_LIMITS.RATE_LIMIT_WINDOW);
    
    if (this.requests.length >= QUERY_LIMITS.RATE_LIMIT_REQUESTS) {
      return false;
    }
    
    this.requests.push(now);
    return true;
  }
  
  getTimeUntilReset(): number {
    if (this.requests.length === 0) return 0;
    const oldestRequest = Math.min(...this.requests);
    return Math.max(0, QUERY_LIMITS.RATE_LIMIT_WINDOW - (Date.now() - oldestRequest));
  }
}

export const queryRateLimiter = new QueryRateLimiter();