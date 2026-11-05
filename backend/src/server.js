import app from './app.js';
import { config } from './config/index.js';
import { connectDB } from './config/db.js';

const PORT = config.port;

const startServer = async () => {
  // Connect to MongoDB (local)
  await connectDB();

  app.listen(PORT, () => {
    console.log(`===============================================`);
    console.log(`⚡ SHAKA Backend Server running on port ${PORT}`);
    console.log(`🍃 Database: MongoDB (${config.mongoUri})`);
    console.log(`🌐 Base API URL: http://localhost:${PORT}/api`);
    console.log(`🩺 Health check: http://localhost:${PORT}/api/health`);
    console.log(`===============================================`);
  });
};

startServer().catch(err => {
  console.error('Fatal server startup error:', err);
  process.exit(1);
});
