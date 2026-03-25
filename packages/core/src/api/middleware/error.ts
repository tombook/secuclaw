/**
 * Error Handling Middleware
 */

import { Request, Response, NextFunction } from 'express';
import { ApiError, errorResponse } from '../types.js';

const logger = {
  error: (...args: any[]) => console.error('[API:Error]', ...args),
  warn: (...args: any[]) => console.warn('[API:Error]', ...args),
};

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function errorHandler(err: Error, req: Request, res: Response, next: NextFunction): void {
  const requestId = (req as any).requestId;
  
  if (err instanceof ApiError) {
    logger.warn(`[${err.code}] ${err.message}`, err.details);
    res.status(err.statusCode).json(errorResponse(err.code, err.message, err.details, requestId));
    return;
  }

  // Unknown error
  logger.error('Unhandled error:', err);
  res.status(500).json(errorResponse('INTERNAL_ERROR', 'Internal server error', undefined, requestId));
}

// eslint-disable-next-line @typescript-eslint/no-unused-vars
export function notFoundHandler(req: Request, res: Response, next: NextFunction): void {
  const requestId = (req as any).requestId;
  res.status(404).json(errorResponse('NOT_FOUND', `Route ${req.method} ${req.path} not found`, undefined, requestId));
}
