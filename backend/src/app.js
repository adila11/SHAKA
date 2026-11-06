import express from 'express';
import cors from 'cors';
import morgan from 'morgan';

import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import householdRoutes from './routes/householdRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { isDbConnected } from './data/dbStore.js';

const app = express();

// Comprehensive CORS setup
app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (e.g. mobile apps, curl, server-to-server) or any dev origin
      callback(null, true);
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Session-Id'],
    exposedHeaders: ['Authorization', 'X-Session-Id'],
  })
);

app.options('*', cors());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Health check endpoint with genuine database connectivity reporting
app.get('/api/health', (req, res) => {
  const dbConnected = isDbConnected();
  res.status(200).json({
    success: true,
    status: dbConnected ? 'healthy' : 'degraded',
    database: dbConnected ? 'connected' : 'disconnected',
    timestamp: new Date().toISOString(),
    service: 'SHAKA Express Backend API',
    version: '1.0.0',
    cors: 'enabled',
  });
});

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/household', householdRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
