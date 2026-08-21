const path = require('path');
const dotenv = require('dotenv');

// Load environment variables before importing app and db (resolving absolute path to root .env)
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const app = require('./app');
const { testConnection, pool } = require('./config/db');

const PORT = process.env.PORT || 5000;

const server = app.listen(PORT, async () => {
  console.log(`=================================================`);
  console.log(`  Backend Server is running on port ${PORT}`);
  console.log(`  Environment: ${process.env.NODE_ENV || 'development'}`);
  console.log(`  API Health: http://localhost:${PORT}/api/health`);
  console.log(`  Groq Model: ${process.env.GROQ_MODEL || 'openai/gpt-oss-20b'}`);
  console.log(`  Groq API Key: ${process.env.GROQ_API_KEY ? 'Configured [OK]' : 'NOT CONFIGURED (Add to .env)'}`);
  console.log(`=================================================`);

  // Non-blocking connectivity test on startup
  const dbStatus = await testConnection();
  if (dbStatus.connected) {
    console.log(`[Database] Successfully connected to MySQL database: '${process.env.DB_NAME || 'student'}'`);
  } else {
    console.warn(`[Database Warning] Unable to connect to MySQL database at startup:`);
    console.warn(`  ${dbStatus.message}`);
    console.warn(`  Ensure MySQL is running and your .env credentials match.`);
  }
});

// Graceful shutdown
async function gracefulShutdown(signal) {
  console.log(`\nReceived ${signal}. Shutting down gracefully...`);
  server.close(async () => {
    console.log('HTTP server closed.');
    try {
      await pool.end();
      console.log('Database pool closed.');
    } catch (err) {
      console.error('Error closing database pool:', err.message);
    }
    process.exit(0);
  });
}

process.on('SIGINT', () => gracefulShutdown('SIGINT'));
process.on('SIGTERM', () => gracefulShutdown('SIGTERM'));
