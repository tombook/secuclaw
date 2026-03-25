/**
 * API Types
 * Common types for REST API
 */

export class ApiError extends Error {
  constructor(
    public code: string,
    message: string,
    public statusCode: number = 500,
    public details?: any
  ) {
    super(message);
    this.name = 'ApiError';
    Error.captureStackTrace(this, this.constructor);
  }
}

// Error codes
export const ErrorCodes = {
  // 4xx Client Errors
  BAD_REQUEST: 'BAD_REQUEST',
  UNAUTHORIZED: 'UNAUTHORIZED',
  FORBIDDEN: 'FORBIDDEN',
  NOT_FOUND: 'NOT_FOUND',
  CONFLICT: 'CONFLICT',
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  
  // 5xx Server Errors
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  NOT_IMPLEMENTED: 'NOT_IMPLEMENTED',
  SERVICE_UNAVAILABLE: 'SERVICE_UNAVAILABLE',
  
  // Business Errors
  ASSET_NOT_FOUND: 'ASSET_NOT_FOUND',
  ASSET_ALREADY_EXISTS: 'ASSET_ALREADY_EXISTS',
  ROLE_NOT_FOUND: 'ROLE_NOT_FOUND',
  ROLE_ALREADY_EXISTS: 'ROLE_ALREADY_EXISTS',
  PERMISSION_DENIED: 'PERMISSION_DENIED',
  
  // Vulnerability Errors
  VULNERABILITY_NOT_FOUND: 'VULNERABILITY_NOT_FOUND',
  VULNERABILITY_ALREADY_EXISTS: 'VULNERABILITY_ALREADY_EXISTS',
  
  // Incident Errors
  INCIDENT_NOT_FOUND: 'INCIDENT_NOT_FOUND',
  INVALID_STATUS_TRANSITION: 'INVALID_STATUS_TRANSITION',
  
  // Task Errors
  TASK_NOT_FOUND: 'TASK_NOT_FOUND',
  TASK_REQUIRES_APPROVAL: 'TASK_REQUIRES_APPROVAL',
} as const;

// Pagination
export interface PaginatedResponse<T> {
  data: T[];
  pagination: {
    page: number;
    pageSize: number;
    total: number;
    totalPages: number;
  };
}

// Standard response wrapper
export interface ApiResponse<T = any> {
  success: boolean;
  data?: T;
  error?: {
    code: string;
    message: string;
    details?: any;
  };
  requestId?: string;
}

// Create success response
export function successResponse<T>(data: T, requestId?: string): ApiResponse<T> {
  return {
    success: true,
    data,
    requestId,
  };
}

// Create error response
export function errorResponse(code: string, message: string, details?: any, requestId?: string): ApiResponse {
  return {
    success: false,
    error: { code, message, details },
    requestId,
  };
}
