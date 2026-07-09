// Central error handler - keeps error formatting consistent across the API.
// Any error thrown (or passed to next(err)) in a route ends up here.

// 404 handler for unknown routes
function notFound(req, res, next) {
  const error = new Error(`Route not found - ${req.originalUrl}`);
  res.status(404);
  next(error);
}

// General error handler (must have 4 args for Express to recognize it)
function errorHandler(err, req, res, next) {
  let statusCode = res.statusCode && res.statusCode !== 200 ? res.statusCode : 500;
  let message = err.message || 'Internal Server Error';

  // MySQL duplicate entry (e.g. unique email)
  if (err.code === 'ER_DUP_ENTRY') {
    statusCode = 409;
    message = 'A record with that value already exists';
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    statusCode = 401;
    message = 'Invalid authentication token';
  }
  if (err.name === 'TokenExpiredError') {
    statusCode = 401;
    message = 'Authentication token expired, please log in again';
  }

  res.status(statusCode).json({
    success: false,
    message,
    stack: process.env.NODE_ENV === 'production' ? undefined : err.stack
  });
}

module.exports = { notFound, errorHandler };
