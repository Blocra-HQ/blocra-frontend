export interface AppError {
  code: string;
  message: string;
  details?: any;
}

export const createError = (code: string, message: string, details?: any): AppError => ({
  code,
  message,
  details
});

export const handleSupabaseError = (error: any): AppError => {
  if (error?.code === '23505') {
    return createError('DUPLICATE_ENTRY', 'This record already exists');
  }
  
  if (error?.code === '23503') {
    return createError('FOREIGN_KEY_VIOLATION', 'Referenced record does not exist');
  }
  
  if (error?.code === 'PGRST116') {
    return createError('NOT_FOUND', 'Record not found');
  }
  
  if (error?.message?.includes('JWT')) {
    return createError('AUTH_ERROR', 'Authentication required');
  }
  
  return createError('DATABASE_ERROR', error?.message || 'Database operation failed');
};

export const handleRpcError = (error: any): AppError => {
  if (error?.message?.includes('timeout')) {
    return createError('RPC_TIMEOUT', 'Network request timed out');
  }
  
  if (error?.message?.includes('network')) {
    return createError('NETWORK_ERROR', 'Network connection failed');
  }
  
  return createError('RPC_ERROR', error?.message || 'RPC call failed');
};

export const getUserFriendlyMessage = (error: AppError): string => {
  switch (error.code) {
    case 'DUPLICATE_ENTRY':
      return 'This item already exists. Please try a different name.';
    case 'NOT_FOUND':
      return 'The requested item could not be found.';
    case 'AUTH_ERROR':
      return 'Please sign in to continue.';
    case 'RPC_TIMEOUT':
      return 'Request timed out. Please try again.';
    case 'NETWORK_ERROR':
      return 'Network connection failed. Please check your internet connection.';
    case 'VALIDATION_ERROR':
      return 'Please check your input and try again.';
    default:
      return error.message || 'An unexpected error occurred.';
  }
};