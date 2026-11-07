/**
 * SHAKA Centralized Frontend Error Parser
 * Translates HTTP, Network, Timeout, and Validation errors into clean, user-facing feedback.
 */

export function parseApiError(error, fallbackMessage = 'Something unexpected happened. Please try again.') {
  if (!error) {
    return {
      message: fallbackMessage,
      code: 'UNKNOWN_ERROR',
      status: 0,
    };
  }

  // 1. Request Timeout Error
  if (error.isTimeout || error.errorCode === 'REQUEST_TIMEOUT' || error.status === 408) {
    return {
      message: 'The request took too long. Please check your connection and try again.',
      code: 'REQUEST_TIMEOUT',
      status: 408,
    };
  }

  // 2. Network Errors (offline, DNS failure, connection refused, server unreachable)
  if (
    error.isNetworkError ||
    error.message === 'Failed to fetch' ||
    error.code === 'ECONNREFUSED' ||
    error.message?.includes('NetworkError') ||
    error.message?.includes('Network request failed') ||
    (typeof navigator !== 'undefined' && !navigator.onLine)
  ) {
    return {
      message: 'Network error. Please check your internet connection and try again.',
      code: 'NETWORK_ERROR',
      status: 0,
    };
  }

  const status = error.status || error.data?.status || (error.response ? error.response.status : 0);
  const data = error.data || error.response?.data || {};
  const serverMsg = data.message || error.message;

  // 3. HTTP Status Codes Specific Handling
  switch (status) {
    case 400: // Bad Request / Validation
      return {
        message: sanitizeMessage(serverMsg) || 'Invalid information. Please check your input.',
        code: data.errorCode || 'BAD_REQUEST',
        status: 400,
        errors: data.errors || null,
      };

    case 401: // Unauthorized / Session Expired
      return {
        message: sanitizeMessage(serverMsg) || 'Your session has expired. Please log in again.',
        code: data.errorCode || 'UNAUTHORIZED',
        status: 401,
      };

    case 403: // Forbidden / Insufficient permissions
      return {
        message: sanitizeMessage(serverMsg) || 'You do not have permission to perform this action.',
        code: data.errorCode || 'FORBIDDEN',
        status: 403,
      };

    case 404: // Resource Not Found
      return {
        message: sanitizeMessage(serverMsg) || 'This resource could not be found. Please refresh and try again.',
        code: data.errorCode || 'NOT_FOUND',
        status: 404,
      };

    case 409: // Conflict / Duplicate entry
      return {
        message: sanitizeMessage(serverMsg) || 'An item with this name already exists.',
        code: data.errorCode || 'CONFLICT',
        status: 409,
      };

    case 422: // Unprocessable Entity / Validation Failure
      return {
        message: sanitizeMessage(serverMsg) || 'Validation failed. Please verify your inputs.',
        code: data.errorCode || 'VALIDATION_ERROR',
        status: 422,
        errors: data.errors || null,
      };

    case 429: // Rate Limited
      return {
        message: 'Too many requests. Please wait a moment before trying again.',
        code: 'TOO_MANY_REQUESTS',
        status: 429,
      };

    case 500:
    case 502:
    case 503:
    case 504:
      return {
        message: 'Something went wrong on our server. Please try again later.',
        code: 'SERVER_ERROR',
        status,
      };

    default:
      if (serverMsg && typeof serverMsg === 'string' && isSafeUserMessage(serverMsg)) {
        return {
          message: serverMsg,
          code: data.errorCode || 'API_ERROR',
          status,
        };
      }
      return {
        message: fallbackMessage,
        code: 'UNKNOWN_ERROR',
        status,
      };
  }
}

/**
 * Filter out raw MongoDB / Mongoose internals or stack paths from user display
 */
function sanitizeMessage(msg) {
  if (!msg || typeof msg !== 'string') return null;
  if (
    msg.includes('E11000') ||
    msg.includes('MongoError') ||
    msg.includes('CastError') ||
    msg.includes('ValidationError:') ||
    msg.includes('node_modules') ||
    msg.includes('at ')
  ) {
    if (msg.includes('E11000') || msg.includes('duplicate')) {
      return 'An item with this name or identifier already exists.';
    }
    return 'Invalid data format. Please check your submission.';
  }
  return msg;
}

function isSafeUserMessage(msg) {
  const lower = msg.toLowerCase();
  return !lower.includes('mongo') && !lower.includes('stack') && !lower.includes('syntaxerror') && !lower.includes('trace');
}

