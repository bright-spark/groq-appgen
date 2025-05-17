import { NextResponse } from 'next/server';
import { ZodError } from 'zod';
import logger from './logger';

export class AppError extends Error {
  statusCode: number;
  isOperational: boolean;

  constructor(message: string, statusCode: number, isOperational = true) {
    super(message);
    this.statusCode = statusCode;
    this.isOperational = isOperational;
    Error.captureStackTrace(this, this.constructor);
  }
}

export const errorHandler = (error: unknown) => {
  // Handle Zod validation errors
  if (error instanceof ZodError) {
    const formattedErrors = error.errors.map(err => ({
      field: err.path.join('.'),
      message: err.message,
    }));
    
    return NextResponse.json(
      { 
        success: false, 
        error: 'Validation Error',
        details: formattedErrors 
      },
      { status: 400 }
    );
  }

  // Handle custom AppError
  if (error instanceof AppError) {
    if (error.isOperational) {
      logger.warn(`Operational Error: ${error.message}`, { error });
      return NextResponse.json(
        { success: false, error: error.message },
        { status: error.statusCode }
      );
    }
  }

  // Handle other unexpected errors
  const errorMessage = error instanceof Error 
    ? error.message 
    : 'An unknown error occurred';
    
  return NextResponse.json(
    { 
      success: false, 
      error: 'Internal Server Error',
      message: process.env.NODE_ENV === 'development' ? errorMessage : undefined
    },
    { status: 500 }
  );
};

export const notFoundHandler = (message = 'Resource not found') => {
  return new AppError(message, 404);
};

export const validationError = (message = 'Validation failed') => {
  return new AppError(message, 400);
};

export const unauthorizedError = (message = 'Not authorized') => {
  return new AppError(message, 401);
};

export const forbiddenError = (message = 'Forbidden') => {
  return new AppError(message, 403);
};
