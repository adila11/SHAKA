import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { BudgetCategory } from '../models/BudgetCategory.js';
import { Setting } from '../models/Setting.js';
import { INITIAL_DATA } from './initialData.js';

// In-memory memory mirror initialized with exact requested users and initial data
const memState = {
  users: JSON.parse(JSON.stringify(INITIAL_DATA.users)).map(u => ({
    ...u,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
  })),
  transactions: JSON.parse(JSON.stringify(INITIAL_DATA.transactions)),
  budgetCategories: JSON.parse(JSON.stringify(INITIAL_DATA.budgetCategories)),
  setting: {
    key: 'global',
    monthlyLimit: INITIAL_DATA.monthlyLimit,
    availableCategories: INITIAL_DATA.availableCategories,
  },
};

export const isDbConnected = () => mongoose.connection.readyState === 1;

export const dbStore = {
  // USERS
  users: {
    find: async () => {
      if (isDbConnected()) {
        return User.find().select('username avatar accessCodeEnabled createdAt updatedAt').lean();
      }
      return memState.users.map(({ password, accessCodeHash, sessions, ...u }) => u);
    },
    findByUsername: async (username) => {
      const reg = new RegExp(`^${username.trim()}$`, 'i');
      if (isDbConnected()) {
        return User.findOne({ username: reg });
      }
      const match = memState.users.find(u => reg.test(u.username));
      return match ? { ...match, toObject: () => ({ ...match }) } : null;
    },
    findBySessionId: async (sessionId) => {
      if (isDbConnected()) {
        return User.findOne({ 'sessions.sessionId': sessionId });
      }
      const match = memState.users.find(u => u.sessions?.some(s => s.sessionId === sessionId));
      return match ? { ...match, toObject: () => ({ ...match }) } : null;
    },
    updateProfile: async (currentUsername, { newUsername, avatar }) => {
      const updates = {};
      if (newUsername) updates.username = newUsername;
      if (avatar !== undefined) updates.avatar = avatar;
      updates.updatedAt = new Date().toISOString();

      if (isDbConnected()) {
        const updated = await User.findOneAndUpdate(
          { username: currentUsername },
          { $set: updates },
          { new: true }
        ).lean();

        if (newUsername && newUsername.toLowerCase() !== currentUsername.toLowerCase()) {
          await Transaction.updateMany({ user: currentUsername }, { $set: { user: newUsername } });
        }
        return updated;
      }

      const memUser = memState.users.find(u => u.username.toLowerCase() === currentUsername.toLowerCase());
      if (memUser) {
        if (newUsername) memUser.username = newUsername;
        if (avatar !== undefined) memUser.avatar = avatar;
        memUser.updatedAt = updates.updatedAt;
      }

      if (newUsername && newUsername.toLowerCase() !== currentUsername.toLowerCase()) {
        memState.transactions.forEach(t => {
          if (t.user.toLowerCase() === currentUsername.toLowerCase()) {
            t.user = newUsername;
          }
        });
      }

      return memUser || { username: newUsername || currentUsername, avatar };
    },
    updatePassword: async (username, newHash) => {
      if (isDbConnected()) {
        await User.findOneAndUpdate({ username }, { password: newHash });
      }
      const user = memState.users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (user) {
        user.password = newHash;
        user.updatedAt = new Date().toISOString();
      }
    },
    addSession: async (username, sessionData) => {
      if (isDbConnected()) {
        await User.findOneAndUpdate(
          { username },
          { $push: { sessions: sessionData } }
        );
      }
      const user = memState.users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (user) {
        if (!user.sessions) user.sessions = [];
        user.sessions.push(sessionData);
      }
    },
    updateSession: async (username, sessionId, updates) => {
      if (isDbConnected()) {
        const setQuery = {};
        Object.entries(updates).forEach(([key, val]) => {
          setQuery[`sessions.$.${key}`] = val;
        });
        await User.updateOne(
          { username, 'sessions.sessionId': sessionId },
          { $set: setQuery }
        );
      }
      const user = memState.users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (user && user.sessions) {
        const sess = user.sessions.find(s => s.sessionId === sessionId);
        if (sess) {
          Object.assign(sess, updates);
        }
      }
    },
    touchSessionActivity: async (username, sessionId) => {
      const now = new Date();
      const expiresAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000); // 3-day sliding window
      if (isDbConnected()) {
        await User.updateOne(
          { username, 'sessions.sessionId': sessionId },
          {
            $set: {
              'sessions.$.lastActivityAt': now,
              'sessions.$.expiresAt': expiresAt,
            },
          }
        );
      }
      const user = memState.users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (user && user.sessions) {
        const sess = user.sessions.find(s => s.sessionId === sessionId);
        if (sess) {
          sess.lastActivityAt = now;
          sess.expiresAt = expiresAt;
        }
      }
      return { lastActivityAt: now, expiresAt };
    },
    revokeSession: async (username, sessionId) => {
      if (isDbConnected()) {
        await User.updateOne(
          { username, 'sessions.sessionId': sessionId },
          { $set: { 'sessions.$.revoked': true } }
        );
      }
      const user = memState.users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (user && user.sessions) {
        const sess = user.sessions.find(s => s.sessionId === sessionId);
        if (sess) {
          sess.revoked = true;
        }
      }
    },
    updateAccessCode: async (username, { accessCodeEnabled, accessCodeHash }) => {
      const updates = {
        accessCodeEnabled,
        accessCodeHash,
        failedAccessCodeAttempts: 0,
        accessCodeLockoutUntil: null,
      };
      if (isDbConnected()) {
        await User.findOneAndUpdate({ username }, { $set: updates });
      }
      const user = memState.users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (user) {
        Object.assign(user, updates);
      }
    },
    recordFailedAccessCodeAttempt: async (username) => {
      const user = await dbStore.users.findByUsername(username);
      const currentAttempts = (user?.failedAccessCodeAttempts || 0) + 1;
      const lockoutUntil = currentAttempts >= 5 ? new Date(Date.now() + 15 * 60 * 1000) : null;

      if (isDbConnected()) {
        await User.findOneAndUpdate(
          { username },
          {
            $set: {
              failedAccessCodeAttempts: currentAttempts,
              accessCodeLockoutUntil: lockoutUntil,
            },
          }
        );
      }
      const memUser = memState.users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (memUser) {
        memUser.failedAccessCodeAttempts = currentAttempts;
        memUser.accessCodeLockoutUntil = lockoutUntil;
      }
      return { attempts: currentAttempts, lockoutUntil };
    },
    resetFailedAccessCodeAttempts: async (username) => {
      if (isDbConnected()) {
        await User.findOneAndUpdate(
          { username },
          {
            $set: {
              failedAccessCodeAttempts: 0,
              accessCodeLockoutUntil: null,
            },
          }
        );
      }
      const memUser = memState.users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (memUser) {
        memUser.failedAccessCodeAttempts = 0;
        memUser.accessCodeLockoutUntil = null;
      }
    },
  },

  // TRANSACTIONS
  transactions: {
    find: async (filter = {}) => {
      if (isDbConnected()) {
        const query = {};
        if (filter.category && filter.category !== 'All') {
          query.category = new RegExp(`^${filter.category}$`, 'i');
        }
        if (filter.user) {
          query.user = new RegExp(`^${filter.user}$`, 'i');
        }
        if (filter.isSplit !== undefined) {
          query.isSplit = filter.isSplit;
        }
        if (filter.search) {
          query.$or = [
            { description: { $regex: filter.search, $options: 'i' } },
            { category: { $regex: filter.search, $options: 'i' } },
            { user: { $regex: filter.search, $options: 'i' } },
          ];
        }
        const list = await Transaction.find(query).sort({ createdAt: -1 }).lean();
        return list.map(({ _id, __v, ...t }) => t);
      }

      let list = [...memState.transactions];
      if (filter.category && filter.category !== 'All') {
        list = list.filter(t => t.category.toLowerCase() === filter.category.toLowerCase());
      }
      if (filter.user) {
        list = list.filter(t => t.user.toLowerCase() === filter.user.toLowerCase());
      }
      if (filter.isSplit !== undefined) {
        list = list.filter(t => t.isSplit === filter.isSplit);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter(
          t =>
            t.description.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q) ||
            t.user.toLowerCase().includes(q)
        );
      }
      return list;
    },
    findById: async (id) => {
      if (isDbConnected()) {
        const item = await Transaction.findOne({ id }).lean();
        if (item) {
          delete item._id;
          delete item.__v;
        }
        return item;
      }
      return memState.transactions.find(t => t.id === id) || null;
    },
    create: async (txData) => {
      if (isDbConnected()) {
        await Transaction.create(txData);
      }
      memState.transactions.unshift(txData);
      return txData;
    },
    update: async (id, updates) => {
      if (isDbConnected()) {
        const updated = await Transaction.findOneAndUpdate({ id }, updates, { new: true }).lean();
        if (updated) {
          delete updated._id;
          delete updated.__v;
          return updated;
        }
      }
      const idx = memState.transactions.findIndex(t => t.id === id);
      if (idx !== -1) {
        memState.transactions[idx] = { ...memState.transactions[idx], ...updates };
        return memState.transactions[idx];
      }
      return null;
    },
    delete: async (id) => {
      if (isDbConnected()) {
        await Transaction.findOneAndDelete({ id });
      }
      const idx = memState.transactions.findIndex(t => t.id === id);
      if (idx !== -1) {
        memState.transactions.splice(idx, 1);
        return true;
      }
      return false;
    },
  },

  // BUDGET CATEGORIES
  budget: {
    getCategories: async () => {
      if (isDbConnected()) {
        const list = await BudgetCategory.find().lean();
        return list.map(({ _id, __v, ...c }) => c);
      }
      return memState.budgetCategories;
    },
    addCategory: async (categoryData) => {
      if (isDbConnected()) {
        await BudgetCategory.create(categoryData);
      }
      memState.budgetCategories.push(categoryData);
      return categoryData;
    },
    updateCategory: async (id, updates) => {
      if (isDbConnected()) {
        const updated = await BudgetCategory.findOneAndUpdate({ id }, updates, { new: true }).lean();
        if (updated) {
          delete updated._id;
          delete updated.__v;
          return updated;
        }
      }
      const idx = memState.budgetCategories.findIndex(c => c.id === id);
      if (idx !== -1) {
        memState.budgetCategories[idx] = { ...memState.budgetCategories[idx], ...updates };
        return memState.budgetCategories[idx];
      }
      return null;
    },
    deleteCategory: async (id) => {
      if (isDbConnected()) {
        await BudgetCategory.findOneAndDelete({ id });
      }
      const idx = memState.budgetCategories.findIndex(c => c.id === id);
      if (idx !== -1) {
        memState.budgetCategories.splice(idx, 1);
        return true;
      }
      return false;
    },
    getMonthlyLimit: async () => {
      if (isDbConnected()) {
        const setting = await Setting.findOne({ key: 'global' });
        return setting?.monthlyLimit || 30000;
      }
      return memState.setting.monthlyLimit;
    },
    updateMonthlyLimit: async (limit) => {
      if (isDbConnected()) {
        await Setting.findOneAndUpdate({ key: 'global' }, { monthlyLimit: limit }, { upsert: true });
      }
      memState.setting.monthlyLimit = limit;
      return limit;
    },
    getAvailableCategories: async () => {
      if (isDbConnected()) {
        const setting = await Setting.findOne({ key: 'global' }).lean();
        return setting?.availableCategories || INITIAL_DATA.availableCategories;
      }
      return memState.setting.availableCategories;
    },
    addAvailableCategory: async (cat) => {
      if (isDbConnected()) {
        await Setting.findOneAndUpdate(
          { key: 'global' },
          { $addToSet: { availableCategories: cat } }
        );
      }
      if (!memState.setting.availableCategories.some(c => c.name.toLowerCase() === cat.name.toLowerCase())) {
        memState.setting.availableCategories.push(cat);
      }
    },
    updateSpent: async (categoryName, numAmount) => {
      if (isDbConnected()) {
        const cat = await BudgetCategory.findOne({ category: new RegExp(`^${categoryName}$`, 'i') });
        if (cat) {
          cat.spent += numAmount;
          cat.status =
            cat.spent > cat.limit ? 'Limit reached' : cat.spent >= cat.limit * 0.85 ? 'Near limit' : 'Healthy';
          cat.statusColor =
            cat.status === 'Limit reached' ? '#d97070' : cat.status === 'Near limit' ? '#d4a359' : '#8fb39a';
          await cat.save();
        }
      }
      const memCat = memState.budgetCategories.find(
        c => c.category.toLowerCase() === categoryName.toLowerCase()
      );
      if (memCat) {
        memCat.spent += numAmount;
        memCat.status =
          memCat.spent > memCat.limit
            ? 'Limit reached'
            : memCat.spent >= memCat.limit * 0.85
            ? 'Near limit'
            : 'Healthy';
        memCat.statusColor =
          memCat.status === 'Limit reached' ? '#d97070' : memCat.status === 'Near limit' ? '#d4a359' : '#8fb39a';
      }
    },
  },
};

