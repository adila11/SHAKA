import mongoose from 'mongoose';
import { Transaction } from '../models/Transaction.js';
import { BudgetCategory } from '../models/BudgetCategory.js';
import { store } from '../data/store.js';

const getCategoryColor = (category) => {
  const cat = (category || '').toLowerCase();
  if (cat.includes('food')) return '#c9b27c';
  if (cat.includes('rent')) return '#8fb39a';
  if (cat.includes('bill')) return '#d4a359';
  if (cat.includes('travel')) return '#c9b27c';
  if (cat.includes('health')) return '#8fb39a';
  return '#8a8a93';
};

export const getTransactions = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    const { category, search, user, isSplit, limit, offset } = req.query;

    if (isMongoConnected) {
      const filter = {};
      if (category && category !== 'All') {
        filter.category = new RegExp(`^${category}$`, 'i');
      }
      if (user) {
        filter.user = new RegExp(`^${user}$`, 'i');
      }
      if (isSplit !== undefined) {
        filter.isSplit = isSplit === 'true';
      }
      if (search) {
        filter.$or = [
          { description: { $regex: search, $options: 'i' } },
          { category: { $regex: search, $options: 'i' } },
          { user: { $regex: search, $options: 'i' } },
        ];
      }

      const totalCount = await Transaction.countDocuments(filter);
      let query = Transaction.find(filter).sort({ createdAt: -1 });

      const skip = parseInt(offset) || 0;
      if (skip) query = query.skip(skip);
      if (limit) query = query.limit(parseInt(limit));

      const list = await query.lean();
      const sanitized = list.map(({ _id, __v, ...item }) => item);

      return res.status(200).json({
        success: true,
        count: sanitized.length,
        total: totalCount,
        data: sanitized,
      });
    }

    // Fallback store
    let list = store.get('transactions') || [];
    if (category && category !== 'All') {
      list = list.filter(t => t.category.toLowerCase() === category.toLowerCase());
    }
    if (user) {
      list = list.filter(t => t.user.toLowerCase() === user.toLowerCase());
    }
    if (isSplit !== undefined) {
      const splitBool = isSplit === 'true';
      list = list.filter(t => t.isSplit === splitBool);
    }
    if (search) {
      const queryStr = search.toLowerCase();
      list = list.filter(
        t =>
          t.description.toLowerCase().includes(queryStr) ||
          t.category.toLowerCase().includes(queryStr) ||
          t.user.toLowerCase().includes(queryStr) ||
          String(t.amount).includes(queryStr)
      );
    }

    const totalCount = list.length;
    const start = parseInt(offset) || 0;
    const end = limit ? start + parseInt(limit) : undefined;
    const paginated = end ? list.slice(start, end) : list;

    res.status(200).json({
      success: true,
      count: paginated.length,
      total: totalCount,
      data: paginated,
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    let item = null;

    if (isMongoConnected) {
      item = await Transaction.findOne({ id: req.params.id }).lean();
      if (item) {
        delete item._id;
        delete item.__v;
      }
    } else {
      const list = store.get('transactions') || [];
      item = list.find(t => t.id === req.params.id);
    }

    if (!item) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const createTransaction = async (req, res, next) => {
  try {
    const {
      amount,
      category = 'Food',
      description = 'New expense',
      date = 'Nov 22',
      time = 'Just now',
      user = 'Alex',
      userRole = 'Admin',
      isSplit = true,
    } = req.body;

    const numAmount = Number(amount);
    if (isNaN(numAmount) || numAmount <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid positive amount is required',
      });
    }

    const newTx = {
      id: `tx-${Date.now()}`,
      date,
      fullDate: `${date}, 2026`,
      time,
      category,
      categoryColor: getCategoryColor(category),
      description,
      amount: numAmount,
      user,
      userRole,
      isSplit: Boolean(isSplit),
    };

    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      await Transaction.create(newTx);

      // Update corresponding budget category spent in Mongo
      const cat = await BudgetCategory.findOne({ category: new RegExp(`^${category}$`, 'i') });
      if (cat) {
        cat.spent += numAmount;
        cat.status =
          cat.spent > cat.limit
            ? 'Limit reached'
            : cat.spent >= cat.limit * 0.85
            ? 'Near limit'
            : 'Healthy';
        cat.statusColor =
          cat.status === 'Limit reached' ? '#d97070' : cat.status === 'Near limit' ? '#d4a359' : '#8fb39a';
        await cat.save();
      }
    }

    // Also update local store
    store.update('transactions', prev => [newTx, ...(prev || [])]);
    store.update('budgetCategories', categories => {
      return (categories || []).map(cat => {
        if (cat.category.toLowerCase() === category.toLowerCase()) {
          const updatedSpent = cat.spent + numAmount;
          const status =
            updatedSpent > cat.limit
              ? 'Limit reached'
              : updatedSpent >= cat.limit * 0.85
              ? 'Near limit'
              : 'Healthy';
          const statusColor =
            status === 'Limit reached' ? '#d97070' : status === 'Near limit' ? '#d4a359' : '#8fb39a';
          return { ...cat, spent: updatedSpent, status, statusColor };
        }
        return cat;
      });
    });

    res.status(201).json({
      success: true,
      message: 'Expense added successfully',
      data: newTx,
    });
  } catch (error) {
    next(error);
  }
};

export const updateTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const updated = await Transaction.findOneAndUpdate(
        { id },
        { ...req.body },
        { new: true }
      ).lean();

      if (!updated) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }

      delete updated._id;
      delete updated.__v;
      return res.status(200).json({
        success: true,
        message: 'Transaction updated successfully',
        data: updated,
      });
    }

    const list = store.get('transactions') || [];
    const index = list.findIndex(t => t.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    const existing = list[index];
    const updated = {
      ...existing,
      ...req.body,
      id: existing.id,
      amount: req.body.amount !== undefined ? Number(req.body.amount) : existing.amount,
    };

    list[index] = updated;
    store.set('transactions', list);

    res.status(200).json({
      success: true,
      message: 'Transaction updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteTransaction = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const deleted = await Transaction.findOneAndDelete({ id });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Transaction not found' });
      }
    }

    const list = store.get('transactions') || [];
    store.set('transactions', list.filter(t => t.id !== id));

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
