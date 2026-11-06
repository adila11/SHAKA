import app from './app.js';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';

const PORT = config.port;

const startServer = () => {
  const server = app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`⚡ SHAKA Backend Server running on port ${PORT}`);
    console.log(`🍃 Database: MongoDB (${config.mongoUri})`);
    console.log(`🌐 Base API URL: http://localhost:${PORT}/api`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });

  // Connect to MongoDB asynchronously without blocking server startup
  connectDB().catch(err => {
    console.warn('⚠️ MongoDB connection attempt failed:', err.message);
  });

  return server;
};

startServer();
