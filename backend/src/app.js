import express from 'express';
import cors from 'cors';
import helmet from 'helmet';
import morgan from 'morgan';
import cookieParser from 'cookie-parser';
import rateLimit from 'express-rate-limit';

import authRoutes from './routes/authRoutes.js';
import transactionRoutes from './routes/transactionRoutes.js';
import budgetRoutes from './routes/budgetRoutes.js';
import analyticsRoutes from './routes/analyticsRoutes.js';
import householdRoutes from './routes/householdRoutes.js';
import adminRoutes from './routes/adminRoutes.js';
import { notFoundHandler, errorHandler } from './middleware/errorHandler.js';
import { isDbConnected } from './data/dbStore.js';

const app = express();

// Security headers
app.use(helmet());

// CORS — restrict to known origins
const allowedOrigins = [
  process.env.CLIENT_ORIGIN || 'http://localhost:5173',
  'https://shaka-finance.vercel.app',
  'http://localhost:5173',
  'http://localhost:4173',
];

app.use(
  cors({
    origin: (origin, callback) => {
      // Allow requests with no origin (mobile apps, server-to-server, curl)
      if (!origin) return callback(null, true);
      if (allowedOrigins.includes(origin) || process.env.NODE_ENV !== 'production') {
        return callback(null, true);
      }
      callback(new Error(`CORS: Origin ${origin} not allowed`));
    },
    credentials: true,
    methods: ['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'OPTIONS'],
    allowedHeaders: ['Content-Type', 'Authorization', 'X-Requested-With', 'Accept', 'X-Session-Id'],
    exposedHeaders: ['Authorization', 'X-Session-Id'],
  })
);

app.options('*', cors());

// Cookie parser (needed for HttpOnly refresh token cookie)
app.use(cookieParser());

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

if (process.env.NODE_ENV !== 'test') {
  app.use(morgan('dev'));
}

// Rate limiting for auth endpoints (strict)
const authLimiter = rateLimit({
  windowMs: 15 * 60 * 1000, // 15 minutes
  max: 20,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many requests from this IP. Please try again after 15 minutes.',
  },
  skip: (req) => process.env.NODE_ENV === 'development',
});

// Even stricter limiter for login/refresh specifically
const loginLimiter = rateLimit({
  windowMs: 15 * 60 * 1000,
  max: 10,
  standardHeaders: true,
  legacyHeaders: false,
  message: {
    success: false,
    message: 'Too many login attempts. Please wait 15 minutes before trying again.',
  },
  skip: (req) => process.env.NODE_ENV === 'development',
});

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

// Apply rate limiters before auth routes
app.use('/api/auth/login', loginLimiter);
app.use('/api/auth/refresh', loginLimiter);
app.use('/api/auth/signup', authLimiter);
app.use('/api/auth/verify-access-code', authLimiter);
app.use('/api/auth/access-code', authLimiter);
app.use('/api/admin/forgot-password', authLimiter);

// API Routes
app.use('/api/auth', authRoutes);
app.use('/api/admin', adminRoutes);
app.use('/api/transactions', transactionRoutes);
app.use('/api/budget', budgetRoutes);
app.use('/api/budget-categories', budgetRoutes);
app.use('/api/analytics', analyticsRoutes);
app.use('/api/household', householdRoutes);

// Error Handling
app.use(notFoundHandler);
app.use(errorHandler);

export default app;
