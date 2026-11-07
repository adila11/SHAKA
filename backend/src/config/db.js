import mongoose from 'mongoose';
import { config } from './index.js';

// Prevent Mongoose from buffering queries when disconnected
mongoose.set('bufferCommands', false);

/**
 * Connect to MongoDB database
 * Strictly connects to the database without inserting, modifying, or deleting any records.
 */
export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`🍃 Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    return true;
  } catch (error) {
    console.warn(`⚠️ Note: MongoDB not reachable at ${config.mongoUri} (${error.message})`);
    console.warn(`   Server will use fast in-memory active store until MongoDB service starts.`);
    return false;
  }
};
