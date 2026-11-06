import mongoose from 'mongoose';
import { config } from './index.js';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { BudgetCategory } from '../models/BudgetCategory.js';
import { Setting } from '../models/Setting.js';
import { INITIAL_DATA } from '../data/initialData.js';

// Prevent Mongoose from buffering queries when disconnected
mongoose.set('bufferCommands', false);

export const seedDatabase = async () => {
  try {
    const exactUsers = await User.find({ username: { $in: ['abdulshamil', 'adilaka'] } });
    const totalUsers = await User.countDocuments();
    if (exactUsers.length < 2 || totalUsers !== 2) {
      console.log('🌱 Refreshing users in MongoDB to abdulshamil and adilaka...');
      await User.deleteMany({});
      await User.insertMany(INITIAL_DATA.users);
      console.log('✅ Users configured: abdulshamil, adilaka');
    }

    const txCount = await Transaction.countDocuments();
    if (txCount === 0) {
      console.log('🌱 Seeding initial transactions into MongoDB...');
      await Transaction.insertMany(INITIAL_DATA.transactions);
    }

    const catCount = await BudgetCategory.countDocuments();
    if (catCount === 0) {
      console.log('🌱 Seeding initial budget categories into MongoDB...');
      await BudgetCategory.insertMany(INITIAL_DATA.budgetCategories);
    }

    const setting = await Setting.findOne({ key: 'global' });
    if (!setting) {
      console.log('🌱 Seeding initial settings into MongoDB...');
      await Setting.create({
        key: 'global',
        monthlyLimit: INITIAL_DATA.monthlyLimit,
        availableCategories: INITIAL_DATA.availableCategories,
      });
    }

    console.log('✅ MongoDB database seeded and ready');
  } catch (err) {
    console.warn('⚠️ Seeding note:', err.message);
  }
};

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 2000,
    });
    console.log(`🍃 Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    await seedDatabase();
    return true;
  } catch (error) {
    console.warn(`⚠️ Note: MongoDB not reachable at ${config.mongoUri} (${error.message})`);
    console.warn(`   Server will use fast in-memory active store until MongoDB service starts.`);
    return false;
  }
};
