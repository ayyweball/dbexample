const path = require('path');
const dotenv = require('dotenv');

// Ensure environment variables are loaded if app is required directly
dotenv.config({ path: path.resolve(__dirname, '../.env') });

const express = require('express');
const cors = require('cors');
const morgan = require('morgan');
const apiRoutes = require('./routes');
const { errorHandler } = require('./middleware/errorHandler');
const notFound = require('./middleware/notFound');

const app = express();

// Configure CORS
const allowedOrigins = process.env.CORS_ORIGIN
  ? process.env.CORS_ORIGIN.split(',').map((origin) => origin.trim())
  : ['http://localhost:3000', 'http://localhost:5173', 'http://localhost:5174', 'http://127.0.0.1:5173'];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (such as mobile apps, curl, Postman)
      if (!origin) return callback(null, true);
      if (allowedOrigins.indexOf(origin) !== -1 || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      return callback(new Error('Blocked by CORS policy'));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization'],
  })
);

// Body Parsers
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Request Logging
if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Welcome / Root Endpoint
app.get('/', (req, res) => {
  res.json({
    message: 'Welcome to the Student Learning & Misconception Tracking API',
    status: 'online',
    documentation: {
      health: 'GET /api/health',
      students: 'GET /api/students',
      questions: 'GET /api/questions',
      attempts: 'GET /api/attempts',
      misconceptions: 'GET /api/misconceptions',
      followup_questions: 'GET /api/followup-questions',
      followup_attempts: 'GET /api/followup-attempts',
      stats: 'GET /api/stats/overview',
    },
  });
});

// API Routes
app.use('/api', apiRoutes);

// 404 Handler for undefined routes
app.use(notFound);

// Centralized Error Handler
app.use(errorHandler);

module.exports = app;
