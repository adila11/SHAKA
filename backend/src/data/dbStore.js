import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';
import { User } from '../models/User.js';
import { Transaction } from '../models/Transaction.js';
import { BudgetCategory } from '../models/BudgetCategory.js';
import { AdminPasswordResetRequest } from '../models/AdminPasswordResetRequest.js';
// In-memory active fallback store (used only if MongoDB is unreachable)
const memState = {
  users: [],
  transactions: [],
  budgetCategories: [],
  adminPasswordResetRequests: [],
};

export const isDbConnected = () => mongoose.connection.readyState === 1;

export const dbStore = {
  // USERS
  users: {
    find: async () => {
      if (isDbConnected()) {
        const users = await User.find().select('name username email role avatar profileImage accessCodeEnabled createdAt updatedAt').lean();
        return users.map(u => ({
          ...u,
          name: u.name || u.username,
          role: u.role || 'Member',
          avatar: u.profileImage || u.avatar || 'profile1',
          profileImage: u.profileImage || u.avatar || 'profile1',
        }));
      }
      return memState.users.map(({ password, accessCodeHash, sessions, ...u }) => ({
        ...u,
        name: u.name || u.username,
        role: u.role || 'Member',
        avatar: u.profileImage || u.avatar || 'profile1',
        profileImage: u.profileImage || u.avatar || 'profile1',
      }));
    },
    findByUsername: async (username) => {
      if (!username) return null;
      const reg = new RegExp(`^${username.trim()}$`, 'i');
      if (isDbConnected()) {
        return User.findOne({ username: reg });
      }
      const match = memState.users.find(u => reg.test(u.username));
      return match ? { ...match, toObject: () => ({ ...match }) } : null;
    },
    findByEmail: async (email) => {
      if (!email) return null;
      const reg = new RegExp(`^${email.trim()}$`, 'i');
      if (isDbConnected()) {
        return User.findOne({ email: reg });
      }
      const match = memState.users.find(u => u.email && reg.test(u.email));
      return match ? { ...match, toObject: () => ({ ...match }) } : null;
    },
    createUser: async (userData) => {
      const preparedData = {
        ...userData,
        name: userData.name || userData.username,
      };
      if (isDbConnected()) {
        const newUser = new User(preparedData);
        await newUser.save();
        return newUser.toObject();
      }
      const nowIso = new Date().toISOString();
      const memUser = {
        ...preparedData,
        _id: `user-${Date.now()}`,
        role: preparedData.role || 'Member',
        avatar: preparedData.avatar || 'profile1',
        profileImage: preparedData.profileImage || 'profile1',
        accessCodeEnabled: false,
        accessCodeHash: null,
        failedAccessCodeAttempts: 0,
        accessCodeLockoutUntil: null,
        sessions: [],
        createdAt: nowIso,
        updatedAt: nowIso,
      };
      memState.users.push(memUser);
      return { ...memUser, toObject: () => ({ ...memUser }) };
    },
    findBySessionId: async (sessionId, opts = {}) => {
      if (!sessionId) return null;
      if (isDbConnected()) {
        const query = User.findOne({ 'sessions.sessionId': sessionId });
        if (opts.lean) {
          query.lean().select('username name email role avatar profileImage accessCodeEnabled accessCodeHash sessions');
        }
        return query;
      }
      const match = memState.users.find(u => u.sessions?.some(s => s.sessionId === sessionId));
      return match ? { ...match } : null;
    },
    updateProfile: async (currentUsername, { name, newUsername, profileImage, avatar }) => {
      const updates = {};
      if (name !== undefined) updates.name = String(name).trim();
      if (newUsername) updates.username = newUsername;
      const img = profileImage !== undefined ? profileImage : avatar;
      if (img !== undefined) {
        updates.profileImage = img;
        updates.avatar = img;
      }
      updates.updatedAt = new Date().toISOString();

      if (isDbConnected()) {
        const updated = await User.findOneAndUpdate(
          { username: currentUsername },
          { $set: updates },
          { new: true }
        ).lean();

        return updated;
      }

      const memUser = memState.users.find(u => u.username.toLowerCase() === currentUsername.toLowerCase());
      if (memUser) {
        if (name !== undefined) memUser.name = String(name).trim();
        if (newUsername) memUser.username = newUsername;
        if (img !== undefined) {
          memUser.profileImage = img;
          memUser.avatar = img;
        }
        memUser.updatedAt = updates.updatedAt;
      }

      return memUser || { name: name || currentUsername, username: newUsername || currentUsername, profileImage: img || 'profile1', avatar: img || 'profile1' };
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
    revokeAllSessions: async (username) => {
      if (isDbConnected()) {
        await User.updateOne(
          { username },
          { $set: { 'sessions.$[].revoked': true } }
        );
      }
      const user = memState.users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (user && user.sessions) {
        user.sessions.forEach(s => {
          s.revoked = true;
        });
      }
    },
    cleanupExpiredSessions: async (username) => {
      const now = new Date();
      if (isDbConnected()) {
        await User.updateOne(
          { username },
          {
            $pull: {
              sessions: {
                $or: [
                  { expiresAt: { $lt: now } },
                  { revoked: true },
                ],
              },
            },
          }
        ).catch(() => {});
      }
      const user = memState.users.find(u => u.username.toLowerCase() === username.toLowerCase());
      if (user && user.sessions) {
        user.sessions = user.sessions.filter(s => !s.revoked && new Date(s.expiresAt) > now);
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
        if (filter.type) {
          query.type = filter.type;
        }
        if (filter.isSplit !== undefined) {
          query.isSplit = filter.isSplit;
        }
        if (filter.search) {
          query.$or = [
            { description: { $regex: filter.search, $options: 'i' } },
            { category: { $regex: filter.search, $options: 'i' } },
          ];
        }
        const list = await Transaction.find(query).sort({ createdAt: -1 }).lean();
        return list.map(({ _id, __v, ...t }) => t);
      }

      let list = [...memState.transactions];
      if (filter.category && filter.category !== 'All') {
        list = list.filter(t => t.category.toLowerCase() === filter.category.toLowerCase());
      }
      if (filter.type) {
        list = list.filter(t => (t.type || 'expense') === filter.type);
      }
      if (filter.isSplit !== undefined) {
        list = list.filter(t => t.isSplit === filter.isSplit);
      }
      if (filter.search) {
        const q = filter.search.toLowerCase();
        list = list.filter(
          t =>
            t.description.toLowerCase().includes(q) ||
            t.category.toLowerCase().includes(q)
        );
      }

      // Ensure newest expenses always appear first
      list.sort((a, b) => {
        if (a.time === 'Just now' && b.time !== 'Just now') return -1;
        if (b.time === 'Just now' && a.time !== 'Just now') return 1;
        const timeA = a.createdAt ? new Date(a.createdAt).getTime() : 0;
        const timeB = b.createdAt ? new Date(b.createdAt).getTime() : 0;
        if (timeA && timeB && timeA !== timeB) return timeB - timeA;
        const dateA = new Date(a.fullDate || a.date).getTime();
        const dateB = new Date(b.fullDate || b.date).getTime();
        if (!isNaN(dateA) && !isNaN(dateB) && dateA !== dateB) return dateB - dateA;
        return 0;
      });

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
      const formatted = {
        ...txData,
        type: txData.type === 'income' ? 'income' : 'expense',
      };

      if (isDbConnected()) {
        // Link categoryId if matching BudgetCategory exists
        if (!formatted.categoryId && formatted.category) {
          const matchCat = await BudgetCategory.findOne({
            category: new RegExp(`^${formatted.category}$`, 'i'),
          }).lean();
          if (matchCat) {
            formatted.categoryId = matchCat._id;
          }
        }
        await Transaction.create(formatted);
      } else {
        if (!formatted.categoryId && formatted.category) {
          const matchCat = memState.budgetCategories.find(
            c => c.category.toLowerCase() === formatted.category.toLowerCase()
          );
          if (matchCat) {
            formatted.categoryId = matchCat.id;
          }
        }
      }

      memState.transactions.unshift(formatted);
      return formatted;
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

  // BUDGET CATEGORIES (DYNAMIC AGGREGATION FROM SHARED TRANSACTIONS)
  budget: {
    getCategories: async () => {
      if (isDbConnected()) {
        // Dynamic aggregation joining BudgetCategory with shared expense transactions
        const aggregated = await BudgetCategory.aggregate([
          {
            $lookup: {
              from: 'transactions',
              let: { catName: { $toLower: '$category' }, catId: '$_id' },
              pipeline: [
                {
                  $match: {
                    $expr: {
                      $and: [
                        { $ne: ['$type', 'income'] }, // expense transactions
                        {
                          $or: [
                            { $eq: [{ $toLower: '$category' }, '$$catName'] },
                            { $eq: ['$categoryId', '$$catId'] },
                          ],
                        },
                      ],
                    },
                  },
                },
                {
                  $group: {
                    _id: null,
                    totalSpent: { $sum: '$amount' },
                    transactionCount: { $sum: 1 },
                  },
                },
              ],
              as: 'spending',
            },
          },
          {
            $unwind: {
              path: '$spending',
              preserveNullAndEmptyArrays: true,
            },
          },
          {
            $project: {
              _id: 1,
              id: 1,
              name: 1,
              category: 1,
              limit: 1,
              color: 1,
              spent: { $ifNull: ['$spending.totalSpent', 0] },
              transactionCount: { $ifNull: ['$spending.transactionCount', 0] },
              createdAt: 1,
              updatedAt: 1,
            },
          },
          {
            $sort: { spent: -1 },
          },
        ]);

        return aggregated.map(cat => {
          const spent = Number(cat.spent || 0);
          const limit = Number(cat.limit || 0);
          const remaining = limit - spent;
          const percentage = limit > 0 ? Number(((spent / limit) * 100).toFixed(1)) : 0;
          let status = 'Healthy';
          let statusColor = '#8fb39a';
          if (percentage >= 100) {
            status = 'Exceeded';
            statusColor = '#d97070';
          } else if (percentage >= 80) {
            status = 'Warning';
            statusColor = '#d4a359';
          }
          return {
            id: cat.id,
            _id: cat._id,
            name: cat.name,
            category: cat.category,
            limit,
            spent,
            remaining,
            percentage,
            color: cat.color || '#c9b27c',
            status,
            statusColor,
            transactionCount: cat.transactionCount || 0,
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt,
          };
        });
      }

      // In-memory memory mirror dynamic calculation
      const categories = [...memState.budgetCategories];
      const expenseTxs = memState.transactions.filter(t => t.type !== 'income');

      return categories
        .map(cat => {
          const matchingTxs = expenseTxs.filter(
            t =>
              (t.category && t.category.toLowerCase() === cat.category.toLowerCase()) ||
              t.categoryId === cat.id
          );
          const spent = matchingTxs.reduce((sum, t) => sum + Number(t.amount || 0), 0);
          const limit = Number(cat.limit || 0);
          const remaining = limit - spent;
          const percentage = limit > 0 ? Number(((spent / limit) * 100).toFixed(1)) : 0;
          let status = 'Healthy';
          let statusColor = '#8fb39a';
          if (percentage >= 100) {
            status = 'Exceeded';
            statusColor = '#d97070';
          } else if (percentage >= 80) {
            status = 'Warning';
            statusColor = '#d4a359';
          }
          return {
            id: cat.id,
            name: cat.name,
            category: cat.category,
            limit,
            spent,
            remaining,
            percentage,
            color: cat.color || '#c9b27c',
            status,
            statusColor,
            transactionCount: matchingTxs.length,
            createdAt: cat.createdAt,
            updatedAt: cat.updatedAt,
          };
        })
        .sort((a, b) => b.spent - a.spent);
    },
    addCategory: async (categoryData) => {
      const cleanName = (categoryData.name || '').trim();
      const cleanCategory = (categoryData.category || cleanName).trim();

      // Enforce category uniqueness across the shared ledger
      if (isDbConnected()) {
        const existing = await BudgetCategory.findOne({
          $or: [
            { category: new RegExp(`^${cleanCategory}$`, 'i') },
            { name: new RegExp(`^${cleanName}$`, 'i') },
          ],
        });
        if (existing) {
          const err = new Error(`Category "${cleanCategory}" already exists in the shared ledger.`);
          err.status = 400;
          throw err;
        }

        const toSave = {
          id: categoryData.id,
          name: cleanName,
          category: cleanCategory,
          limit: Number(categoryData.limit) || 5000,
          color: categoryData.color || '#c9b27c',
        };
        const created = await BudgetCategory.create(toSave);
        return {
          ...toSave,
          _id: created._id,
          spent: 0,
          remaining: toSave.limit,
          percentage: 0,
          status: 'Healthy',
          statusColor: '#8fb39a',
          transactionCount: 0,
        };
      }

      const existingMem = memState.budgetCategories.find(
        c =>
          c.category.toLowerCase() === cleanCategory.toLowerCase() ||
          c.name.toLowerCase() === cleanName.toLowerCase()
      );
      if (existingMem) {
        const err = new Error(`Category "${cleanCategory}" already exists in the shared ledger.`);
        err.status = 400;
        throw err;
      }

      const toSave = {
        id: categoryData.id,
        name: cleanName,
        category: cleanCategory,
        limit: Number(categoryData.limit) || 5000,
        color: categoryData.color || '#c9b27c',
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString(),
      };
      memState.budgetCategories.push(toSave);
      return {
        ...toSave,
        spent: 0,
        remaining: toSave.limit,
        percentage: 0,
        status: 'Healthy',
        statusColor: '#8fb39a',
        transactionCount: 0,
      };
    },
    updateCategory: async (id, updates) => {
      const cleanName = updates.name !== undefined ? updates.name.trim() : undefined;
      const cleanCategory = updates.category !== undefined ? updates.category.trim() : cleanName;

      if (isDbConnected()) {
        const existing = await BudgetCategory.findOne({ id });
        if (!existing) return null;

        // Check if renaming to a category name that already exists
        if (cleanCategory && cleanCategory.toLowerCase() !== existing.category.toLowerCase()) {
          const duplicate = await BudgetCategory.findOne({
            id: { $ne: id },
            $or: [
              { category: new RegExp(`^${cleanCategory}$`, 'i') },
              { name: new RegExp(`^${cleanName || cleanCategory}$`, 'i') },
            ],
          });
          if (duplicate) {
            const err = new Error(`Category "${cleanCategory}" already exists.`);
            err.status = 400;
            throw err;
          }
        }

        const updateFields = {};
        if (cleanName) updateFields.name = cleanName;
        if (cleanCategory) updateFields.category = cleanCategory;
        if (updates.limit !== undefined) updateFields.limit = Number(updates.limit);
        if (updates.color) updateFields.color = updates.color;

        await BudgetCategory.findOneAndUpdate({ id }, { $set: updateFields }, { new: true });

        // If category was renamed, update all existing transactions in that category to keep history linked
        if (cleanCategory && cleanCategory.toLowerCase() !== existing.category.toLowerCase()) {
          await Transaction.updateMany(
            { category: new RegExp(`^${existing.category}$`, 'i') },
            { $set: { category: cleanCategory } }
          );
        }

        const list = await dbStore.budget.getCategories();
        return list.find(c => c.id === id) || null;
      }

      const existingMem = memState.budgetCategories.find(c => c.id === id);
      if (!existingMem) return null;

      if (cleanCategory && cleanCategory.toLowerCase() !== existingMem.category.toLowerCase()) {
        const duplicate = memState.budgetCategories.find(
          c =>
            c.id !== id &&
            (c.category.toLowerCase() === cleanCategory.toLowerCase() ||
              c.name.toLowerCase() === (cleanName || cleanCategory).toLowerCase())
        );
        if (duplicate) {
          const err = new Error(`Category "${cleanCategory}" already exists.`);
          err.status = 400;
          throw err;
        }
      }

      const oldCategory = existingMem.category;
      if (cleanName) existingMem.name = cleanName;
      if (cleanCategory) existingMem.category = cleanCategory;
      if (updates.limit !== undefined) existingMem.limit = Number(updates.limit);
      if (updates.color) existingMem.color = updates.color;
      existingMem.updatedAt = new Date().toISOString();

      // If renamed, update matching transactions in memory
      if (cleanCategory && cleanCategory.toLowerCase() !== oldCategory.toLowerCase()) {
        memState.transactions.forEach(t => {
          if (t.category && t.category.toLowerCase() === oldCategory.toLowerCase()) {
            t.category = cleanCategory;
          }
        });
      }

      const list = await dbStore.budget.getCategories();
      return list.find(c => c.id === id) || null;
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
        const categories = await BudgetCategory.find().lean();
        return categories.reduce((sum, c) => sum + Number(c.limit || 0), 0);
      }
      return memState.budgetCategories.reduce((sum, c) => sum + Number(c.limit || 0), 0);
    },
    updateMonthlyLimit: async () => {
      // Spend limit is derived directly from the combined total of all individual category spend limits
      return dbStore.budget.getMonthlyLimit();
    },
    getAvailableCategories: async () => {
      if (isDbConnected()) {
        const categories = await BudgetCategory.find().select('name category color').lean();
        if (categories && categories.length > 0) {
          return categories.map(c => ({
            name: c.name || c.category,
            color: c.color || '#c9b27c',
            icon: 'Tag',
          }));
        }
        return [];
      }
      if (memState.budgetCategories && memState.budgetCategories.length > 0) {
        return memState.budgetCategories.map(c => ({
          name: c.name || c.category,
          color: c.color || '#c9b27c',
          icon: 'Tag',
        }));
      }
      return [];
    },
    addAvailableCategory: async (cat) => {
      // Categories are dynamically stored in BudgetCategory; no separate settings collection needed
      return cat;
    },
  },
  // ADMIN PASSWORD RESET REQUESTS (TWO-ADMIN APPROVAL SYSTEM)
  adminPasswordResetRequests: {
    create: async (data) => {
      const now = new Date();
      if (isDbConnected()) {
        const doc = new AdminPasswordResetRequest({
          ...data,
          createdAt: now,
          updatedAt: now,
        });
        await doc.save();
        return doc.toObject();
      }

      const memDoc = {
        _id: `apr-${Date.now()}-${Math.random().toString(36).substring(2, 8)}`,
        id: undefined,
        ...data,
        createdAt: now,
        updatedAt: now,
      };
      memDoc.id = memDoc._id;
      memState.adminPasswordResetRequests.push(memDoc);
      return { ...memDoc, toObject: () => ({ ...memDoc }) };
    },
    findById: async (id) => {
      if (!id) return null;
      if (isDbConnected()) {
        return AdminPasswordResetRequest.findById(id);
      }
      const match = memState.adminPasswordResetRequests.find(r => r._id === id || r.id === id);
      return match ? { ...match, toObject: () => ({ ...match }) } : null;
    },
    findActivePendingByRequester: async (username, email) => {
      const now = new Date();
      const userLower = (username || '').toLowerCase();
      const emailLower = (email || '').toLowerCase();

      if (isDbConnected()) {
        return AdminPasswordResetRequest.findOne({
          status: 'pending',
          expiresAt: { $gt: now },
          $or: [
            { requestingAdminUsername: new RegExp(`^${userLower}$`, 'i') },
            { requestingAdminEmail: new RegExp(`^${emailLower}$`, 'i') },
          ],
        });
      }

      const match = memState.adminPasswordResetRequests.find(r => {
        if (r.status !== 'pending') return false;
        if (new Date(r.expiresAt) <= now) return false;
        return (
          r.requestingAdminUsername.toLowerCase() === userLower ||
          r.requestingAdminEmail.toLowerCase() === emailLower
        );
      });
      return match ? { ...match, toObject: () => ({ ...match }) } : null;
    },
    findPendingForReviewer: async (reviewerUsername) => {
      const now = new Date();
      const reviewerLower = (reviewerUsername || '').toLowerCase();

      if (isDbConnected()) {
        // Expire old pending requests
        await AdminPasswordResetRequest.updateMany(
          { status: 'pending', expiresAt: { $lte: now } },
          { $set: { status: 'expired' } }
        );

        return AdminPasswordResetRequest.find({
          status: 'pending',
          expiresAt: { $gt: now },
          requestingAdminUsername: { $ne: reviewerUsername },
        })
          .sort({ createdAt: -1 })
          .lean();
      }

      // In-memory: update expired
      memState.adminPasswordResetRequests.forEach(r => {
        if (r.status === 'pending' && new Date(r.expiresAt) <= now) {
          r.status = 'expired';
        }
      });

      return memState.adminPasswordResetRequests
        .filter(r => r.status === 'pending' && r.requestingAdminUsername.toLowerCase() !== reviewerLower)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));
    },
    getAllForReviewer: async (reviewerUsername) => {
      const reviewerLower = (reviewerUsername || '').toLowerCase();
      if (isDbConnected()) {
        return AdminPasswordResetRequest.find({
          $or: [
            { requestingAdminUsername: { $ne: reviewerUsername } },
            { approvingAdminUsername: reviewerUsername },
          ],
        })
          .sort({ createdAt: -1 })
          .limit(20)
          .lean();
      }
      return memState.adminPasswordResetRequests
        .filter(r => r.requestingAdminUsername.toLowerCase() !== reviewerLower || r.approvingAdminUsername?.toLowerCase() === reviewerLower)
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 20);
    },
    update: async (id, updates) => {
      const now = new Date();
      const finalUpdates = { ...updates, updatedAt: now };

      if (isDbConnected()) {
        return AdminPasswordResetRequest.findByIdAndUpdate(
          id,
          { $set: finalUpdates },
          { new: true }
        ).lean();
      }

      const match = memState.adminPasswordResetRequests.find(r => r._id === id || r.id === id);
      if (match) {
        Object.assign(match, finalUpdates);
        return { ...match, toObject: () => ({ ...match }) };
      }
      return null;
    },
  },
};

