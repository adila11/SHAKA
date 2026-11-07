import mongoose from 'mongoose';
import { config } from './index.js';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { BudgetCategory } from '../models/BudgetCategory.js';
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
    } else {
      // Ensure both configured accounts have Admin role
      await User.updateMany(
        { username: { $in: ['abdulshamil', 'adilaka'] } },
        { $set: { role: 'Admin' } }
      );
    }

    const txCount = await Transaction.countDocuments();
    if (txCount === 0) {
      console.log('🌱 Seeding initial transactions into MongoDB...');
      await Transaction.insertMany(INITIAL_DATA.transactions);
    } else {
      // Migration: Ensure all existing transactions have type ('expense' default)
      await Transaction.updateMany(
        { type: { $exists: false } },
        { $set: { type: 'expense' } }
      );

      // Migration: Remove user-related fields from all transactions
      await Transaction.updateMany(
        {},
        {
          $unset: {
            user: '',
            userRole: '',
            userId: '',
            createdBy: '',
            updatedBy: '',
          },
        }
      );

      try {
        await Transaction.collection.dropIndex('user_1');
      } catch {
        // Index may not exist or already dropped
      }
    }

    const catCount = await BudgetCategory.countDocuments();
    if (catCount === 0) {
      console.log('🌱 Seeding initial budget categories into MongoDB...');
      await BudgetCategory.insertMany(INITIAL_DATA.budgetCategories);
    } else {
      // Migration: Unset obsolete stored spent, status, statusColor from BudgetCategory
      await BudgetCategory.updateMany(
        {},
        { $unset: { spent: '', status: '', statusColor: '' } }
      );
    }

    // Migration: Link categoryId on existing transactions
    const existingCats = await BudgetCategory.find().lean();
    for (const cat of existingCats) {
      await Transaction.updateMany(
        { category: new RegExp(`^${cat.category}$`, 'i'), categoryId: { $exists: false } },
        { $set: { categoryId: cat._id } }
      );
    }

    // Drop obsolete settings collection if present
    try {
      if (mongoose.connection?.db) {
        await mongoose.connection.db.dropCollection('settings');
        console.log('🧹 Obsolete settings collection dropped');
      }
    } catch {
      // Collection may not exist, safe to ignore
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
