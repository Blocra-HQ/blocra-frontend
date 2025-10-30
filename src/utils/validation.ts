export const validateEmail = (email: string): boolean => {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
};

export const validatePassword = (password: string): {
  message: string; isValid: boolean; errors: string[] 
} => {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateWalletAddress = (address: string): boolean => {
  // Starknet addresses are 64 characters long and start with 0x
  const starknetRegex = /^0x[0-9a-fA-F]{63,64}$/;
  return starknetRegex.test(address);
};

export const validateBountyAmount = (amount: number): boolean => {
  return amount > 0 && amount <= 1000000; // Max 1M tokens
};

export const validateDeadline = (deadline: string): boolean => {
  const deadlineDate = new Date(deadline);
  if (isNaN(deadlineDate.getTime())) {
    return false;
  }
  const now = new Date();
  const maxDate = new Date();
  maxDate.setFullYear(maxDate.getFullYear() + 1); // Max 1 year from now
  
  return deadlineDate > now && deadlineDate <= maxDate;
};

export const sanitizeInput = (input: string): string => {
  return input
    .trim()
    .replace(/[<>"'&]/g, '')
    .replace(/javascript:/gi, '')
    .replace(/on\w+=/gi, '');
};

export const validateQueryText = (query: string): { isValid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!query.trim()) {
    errors.push('Query cannot be empty');
  }
  
  if (query.length > 10000) {
    errors.push('Query is too long (max 10,000 characters)');
  }
  
  // Basic SQL injection prevention
  const dangerousPatterns = [
    /drop\s+table/i,
    /delete\s+from/i,
    /truncate/i,
    /alter\s+table/i,
    /create\s+table/i,
    /insert\s+into/i,
    /update\s+.*set/i
  ];
  
  for (const pattern of dangerousPatterns) {
    if (pattern.test(query)) {
      errors.push('Query contains potentially dangerous operations');
      break;
    }
  }
  
  return {
    isValid: errors.length === 0,
    errors
  };
};