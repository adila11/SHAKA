export const notFoundHandler = (req, res, next) => {
  const error = new Error(`Resource not found - ${req.method} ${req.originalUrl}`);
  error.status = 404;
  error.errorCode = 'NOT_FOUND';
  next(error);
};

export const errorHandler = (err, req, res, next) => {
  let statusCode = err.status || err.statusCode || (res.statusCode && res.statusCode !== 200 ? res.statusCode : 500);
  let errorCode = err.errorCode || 'INTERNAL_SERVER_ERROR';
  let message = err.message || 'An unexpected internal server error occurred';

  // Handle Mongoose validation errors
  if (err.name === 'ValidationError') {
    statusCode = 400;
    errorCode = 'VALIDATION_ERROR';
    const messages = Object.values(err.errors || {}).map((e) => e.message);
    message = messages.length > 0 ? messages.join(', ') : 'Database validation failed';
  } else if (err.code === 11000) {
    statusCode = 409;
    errorCode = 'DUPLICATE_RESOURCE';
    const field = Object.keys(err.keyValue || {})[0] || 'Field';
    message = `${field} already exists. Duplicate entries are not allowed.`;
  } else if (err.name === 'CastError') {
    statusCode = 400;
    errorCode = 'INVALID_RESOURCE_IDENTIFIER';
    message = `Malformed resource identifier for ${err.path}`;
  } else if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    errorCode = 'INVALID_TOKEN';
    message = 'Authentication token is invalid or malformed';
  } else if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    errorCode = 'TOKEN_EXPIRED';
    message = 'Authentication token has expired';
  }

  // Meaningful server-side logging for non-404 errors
  if (statusCode >= 500) {
    console.error(`[SERVER ERROR ${statusCode}] [${req.method} ${req.originalUrl}]:`, err);
  }

  res.status(statusCode).json({
    success: false,
    message,
    errorCode,
    code: errorCode,
    status: statusCode,
    errors: err.errors || null,
    timestamp: new Date().toISOString(),
    ...(process.env.NODE_ENV === 'production' ? {} : { stack: err.stack }),
  });
};

