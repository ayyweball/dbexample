/**
 * Centralized Error Handling Middleware
 */
function errorHandler(err, req, res, next) {
  let statusCode = err.statusCode || 500;
  let message = err.message || 'Internal Server Error';
  let details = err.details || null;

  // MySQL specific error codes
  if (err.code) {
    switch (err.code) {
      case 'ER_DUP_ENTRY':
        statusCode = 409;
        message = 'A record with this unique value already exists.';
        details = err.sqlMessage;
        break;

      case 'ER_NO_REFERENCED_ROW':
      case 'ER_NO_REFERENCED_ROW_2':
        statusCode = 400;
        message = 'Foreign key constraint failed: Referenced record does not exist.';
        details = err.sqlMessage;
        break;

      case 'ER_ROW_IS_REFERENCED':
      case 'ER_ROW_IS_REFERENCED_2':
        statusCode = 409;
        message = 'Cannot delete or update record because it is referenced by other records.';
        details = err.sqlMessage;
        break;

      case 'ER_CHECK_CONSTRAINT_VIOLATED':
        statusCode = 400;
        message = 'Check constraint violation: Provided data fails validation rules.';
        details = err.sqlMessage;
        break;

      case 'ER_DATA_TOO_LONG':
        statusCode = 400;
        message = 'Data too long for column.';
        details = err.sqlMessage;
        break;

      case 'ER_BAD_FIELD_ERROR':
        statusCode = 400;
        message = 'Invalid field specified in query.';
        details = err.sqlMessage;
        break;

      case 'ECONNREFUSED':
        statusCode = 503;
        message = 'Unable to connect to database. Please ensure MySQL server is running.';
        break;

      default:
        if (err.code.startsWith('ER_')) {
          statusCode = 400;
          message = 'Database operation error.';
          details = err.sqlMessage;
        }
    }
  }

  // Log server errors for debugging
  if (statusCode >= 500) {
    console.error('[Error] Server Error:', err);
  }

  res.status(statusCode).json({
    success: false,
    error: message,
    ...(details && { details }),
    ...(process.env.NODE_ENV === 'development' && statusCode >= 500 && { stack: err.stack }),
  });
}

class AppError extends Error {
  constructor(message, statusCode = 400, details = null) {
    super(message);
    this.statusCode = statusCode;
    this.details = details;
    Error.captureStackTrace(this, this.constructor);
  }
}

module.exports = {
  errorHandler,
  AppError,
};
