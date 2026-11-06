import mongoose from 'mongoose';
import { config } from './index.js';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { BudgetCategory } from '../models/BudgetCategory.js';
import { Setting } from '../models/Setting.js';
import { INITIAL_DATA } from '../data/initialData.js';

export const seedDatabase = async () => {
  try {
    const userCount = await User.countDocuments();
    if (userCount === 0) {
      console.log('🌱 Seeding initial users into MongoDB...');
      await User.insertMany(INITIAL_DATA.users);
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
    console.error('⚠️ Seeding error:', err.message);
  }
};

export const connectDB = async () => {
  try {
    const conn = await mongoose.connect(config.mongoUri, {
      serverSelectionTimeoutMS: 5000,
    });
    console.log(`🍃 Connected to MongoDB: ${conn.connection.host}/${conn.connection.name}`);
    await seedDatabase();
    return true;
  } catch (error) {
    console.warn(`⚠️ Warning: Could not connect to MongoDB at ${config.mongoUri}`);
    console.warn(`   Reason: ${error.message}`);
    console.warn(`   Ensure local MongoDB (mongod) is running: 'net start MongoDB' or 'mongod'`);
    return false;
  }
};

