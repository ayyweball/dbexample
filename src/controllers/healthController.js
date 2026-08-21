const { testConnection } = require('../config/db');

/**
 * Health check endpoint
 * Verifies server is active and tests database connectivity
 */
async function getHealth(req, res) {
  const dbStatus = await testConnection();

  const responsePayload = {
    status: dbStatus.connected ? 'healthy' : 'degraded',
    timestamp: new Date().toISOString(),
    uptime_seconds: process.uptime(),
    database: {
      connected: dbStatus.connected,
      ...(dbStatus.message && { error: dbStatus.message }),
    },
    environment: process.env.NODE_ENV || 'development',
  };

  const statusCode = dbStatus.connected ? 200 : 503;
  return res.status(statusCode).json(responsePayload);
}

module.exports = {
  getHealth,
};
