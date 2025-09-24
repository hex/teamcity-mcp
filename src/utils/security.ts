/**
 * Simplified error handling for TeamCity MCP
 */

import { z } from 'zod';

export interface ErrorContext {
  readonly operation: string;
  readonly userInput?: unknown;
}

export const ErrorCodes = {
  VALIDATION_ERROR: 'VALIDATION_ERROR',
  RESOURCE_NOT_FOUND: 'RESOURCE_NOT_FOUND',
  AUTHENTICATION_FAILED: 'AUTHENTICATION_FAILED',
  EXTERNAL_SERVICE_ERROR: 'EXTERNAL_SERVICE_ERROR',
  INTERNAL_ERROR: 'INTERNAL_ERROR',
  CONFIGURATION_ERROR: 'CONFIGURATION_ERROR'
} as const;

export type ErrorCode = typeof ErrorCodes[keyof typeof ErrorCodes];

export function createSafeError(
  error: unknown,
  context: ErrorContext,
  code: ErrorCode = ErrorCodes.INTERNAL_ERROR
): { code: string; message: string; requestId?: string } {
  let message = 'An error occurred';
  
  if (error instanceof z.ZodError) {
    message = `Validation failed: ${error.issues.map(i => i.message).join(', ')}`;
    code = ErrorCodes.VALIDATION_ERROR;
  } else if (error instanceof Error) {
    message = error.message;
  }

  return {
    code,
    message,
    requestId: `${context.operation}_${Date.now()}`
  };
}

export function isValidationError(error: unknown): error is z.ZodError {
  return error instanceof z.ZodError;
}

export function handleHttpError(
  error: unknown,
  context: ErrorContext
): { code: string; message: string; requestId?: string } {
  if (error && typeof error === 'object' && 'response' in error) {
    const axiosError = error as any;
    const status = axiosError.response?.status;
    
    if (status === 401) {
      return createSafeError(error, context, ErrorCodes.AUTHENTICATION_FAILED);
    }
    if (status === 404) {
      return createSafeError(error, context, ErrorCodes.RESOURCE_NOT_FOUND);
    }
    if (status >= 500) {
      return createSafeError(error, context, ErrorCodes.EXTERNAL_SERVICE_ERROR);
    }
  }

  return createSafeError(error, context, ErrorCodes.EXTERNAL_SERVICE_ERROR);
}