import { Request, Response, NextFunction } from 'express';
import { ZodError } from 'zod';

// Custom error class for API errors
export class ApiError extends Error {
  status: number;

  constructor(message: string, status: number = 500) {
    super(message);
    this.status = status;
    this.name = 'ApiError';
  }
}

// Error handler middleware
export function errorHandler(
  err: Error,
  req: Request,
  res: Response,
  next: NextFunction
) {
  console.error('Error:', err);

  // Handle Zod validation errors
  if (err instanceof ZodError) {
    return res.status(400).json({
      message: 'Validation error',
      errors: err.errors,
      status: 400,
    });
  }

  // Handle custom API errors
  if (err instanceof ApiError) {
    return res.status(err.status).json({
      message: err.message,
      status: err.status,
    });
  }

  // Handle other errors
  return res.status(500).json({
    message: 'Internal server error',
    status: 500,
  });
}
