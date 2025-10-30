// SQL Sanitization and Validation Utilities
export const sanitizeSQL = (sql: string): string => {
  if (!sql || typeof sql !== 'string') return '';
  
  return sql
    // Remove dangerous characters
    .replace(/[<>&"'`]/g, (match) => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;',
        '`': '&#x60;'
      };
      return escapeMap[match];
    })
    // Remove SQL comments
    .replace(/--.*$/gm, '')
    .replace(/\/\*[\s\S]*?\*\//g, '')
    // Remove multiple spaces
    .replace(/\s+/g, ' ')
    .trim();
};

export const validateSQL = (sql: string): { isValid: boolean; error?: string } => {
  if (!sql || typeof sql !== 'string') {
    return { isValid: false, error: 'Query cannot be empty' };
  }

  const trimmedSQL = sql.trim().toLowerCase();
  
  // Check for dangerous operations
  const dangerousKeywords = [
    'drop', 'delete', 'update', 'insert', 'alter', 'create', 
    'truncate', 'exec', 'execute', 'sp_', 'xp_'
  ];
  
  for (const keyword of dangerousKeywords) {
    if (trimmedSQL.includes(keyword)) {
      return { 
        isValid: false, 
        error: `Dangerous operation '${keyword.toUpperCase()}' is not allowed. Only SELECT queries are permitted.` 
      };
    }
  }
  
  // Must start with SELECT
  if (!trimmedSQL.startsWith('select')) {
    return { 
      isValid: false, 
      error: 'Only SELECT queries are allowed. Query must start with SELECT.' 
    };
  }
  
  // Must have FROM clause
  if (!trimmedSQL.includes('from')) {
    return { 
      isValid: false, 
      error: 'Invalid SQL: Missing FROM clause.' 
    };
  }
  
  // Check for balanced parentheses
  let openParens = 0;
  for (const char of sql) {
    if (char === '(') openParens++;
    if (char === ')') openParens--;
    if (openParens < 0) {
      return { 
        isValid: false, 
        error: 'Invalid SQL: Unmatched closing parenthesis.' 
      };
    }
  }
  if (openParens > 0) {
    return { 
      isValid: false, 
      error: 'Invalid SQL: Unmatched opening parenthesis.' 
    };
  }
  
  // Check query length
  if (sql.length > 5000) {
    return { 
      isValid: false, 
      error: 'Query too long. Maximum 5000 characters allowed.' 
    };
  }
  
  return { isValid: true };
};

// Sanitize display data to prevent XSS
export const sanitizeDisplayData = (data: any): any => {
  if (typeof data === 'string') {
    return data.replace(/[<>&"']/g, (match) => {
      const escapeMap: { [key: string]: string } = {
        '<': '&lt;',
        '>': '&gt;',
        '&': '&amp;',
        '"': '&quot;',
        "'": '&#x27;'
      };
      return escapeMap[match];
    });
  }
  
  if (Array.isArray(data)) {
    return data.map(sanitizeDisplayData);
  }
  
  if (data && typeof data === 'object') {
    const sanitized: any = {};
    for (const [key, value] of Object.entries(data)) {
      sanitized[key] = sanitizeDisplayData(value);
    }
    return sanitized;
  }
  
  return data;
};