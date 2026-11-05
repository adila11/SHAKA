import mongoose from 'mongoose';
import { BudgetCategory } from '../models/BudgetCategory.js';
import { Transaction } from '../models/Transaction.js';
import { Setting } from '../models/Setting.js';
import { store } from '../data/store.js';

export const getBudgetCategories = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const categories = await BudgetCategory.find().lean();
      const sanitized = categories.map(({ _id, __v, ...item }) => item);
      return res.status(200).json({
        success: true,
        count: sanitized.length,
        data: sanitized,
      });
    }

    const categories = store.get('budgetCategories') || [];
    res.status(200).json({
      success: true,
      count: categories.length,
      data: categories,
    });
  } catch (error) {
    next(error);
  }
};

export const addBudgetCategory = async (req, res, next) => {
  try {
    const { name, limit, color } = req.body;
    const trimmedName = (name || '').trim();

    if (!trimmedName) {
      return res.status(400).json({
        success: false,
        message: 'Category name is required',
      });
    }

    const limitVal = Number(limit) || 5000;
    const catColor = color || '#c9b27c';
    const newId = `cat-${Date.now()}`;
    const isMongoConnected = mongoose.connection.readyState === 1;

    let existingSpent = 0;
    if (isMongoConnected) {
      const txs = await Transaction.find({ category: new RegExp(`^${trimmedName}$`, 'i') });
      existingSpent = txs.reduce((sum, t) => sum + Number(t.amount), 0);
    } else {
      const transactions = store.get('transactions') || [];
      existingSpent = transactions
        .filter(t => t.category.toLowerCase() === trimmedName.toLowerCase())
        .reduce((sum, t) => sum + Number(t.amount), 0);
    }

    const status =
      existingSpent > limitVal ? 'Limit reached' : existingSpent >= limitVal * 0.85 ? 'Near limit' : 'Healthy';
    const statusColor =
      status === 'Limit reached' ? '#d97070' : status === 'Near limit' ? '#d4a359' : '#8fb39a';

    const newCategory = {
      id: newId,
      name: trimmedName,
      category: trimmedName,
      spent: existingSpent,
      limit: limitVal,
      color: catColor,
      status,
      statusColor,
    };

    if (isMongoConnected) {
      await BudgetCategory.create(newCategory);
      await Setting.findOneAndUpdate(
        { key: 'global' },
        { $addToSet: { availableCategories: { name: trimmedName, color: catColor } } }
      );
    }

    store.update('budgetCategories', prev => [...(prev || []), newCategory]);
    store.update('availableCategories', prev => {
      const list = prev || [];
      if (list.some(c => c.name.toLowerCase() === trimmedName.toLowerCase())) {
        return list;
      }
      return [...list, { name: trimmedName, color: catColor }];
    });

    res.status(201).json({
      success: true,
      message: 'Budget category created successfully',
      data: newCategory,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBudgetCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, limit, color } = req.body;
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const existing = await BudgetCategory.findOne({ id });
      if (!existing) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }

      const updatedName = name !== undefined && name.trim() ? name.trim() : existing.name;
      const limitVal =
        limit !== undefined && !isNaN(limit) && Number(limit) > 0 ? Number(limit) : existing.limit;
      const catColor = color || existing.color;

      const status =
        existing.spent > limitVal ? 'Limit reached' : existing.spent >= limitVal * 0.85 ? 'Near limit' : 'Healthy';
      const statusColor =
        status === 'Limit reached' ? '#d97070' : status === 'Near limit' ? '#d4a359' : '#8fb39a';

      existing.name = updatedName;
      existing.category = updatedName;
      existing.limit = limitVal;
      existing.color = catColor;
      existing.status = status;
      existing.statusColor = statusColor;
      await existing.save();

      const sanitized = existing.toObject();
      delete sanitized._id;
      delete sanitized.__v;

      return res.status(200).json({
        success: true,
        message: 'Category updated successfully',
        data: sanitized,
      });
    }

    const categories = store.get('budgetCategories') || [];
    const index = categories.findIndex(c => c.id === id);

    if (index === -1) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const existing = categories[index];
    const updatedName = name !== undefined && name.trim() ? name.trim() : existing.name;
    const limitVal =
      limit !== undefined && !isNaN(limit) && Number(limit) > 0 ? Number(limit) : existing.limit;
    const catColor = color || existing.color;

    const status =
      existing.spent > limitVal ? 'Limit reached' : existing.spent >= limitVal * 0.85 ? 'Near limit' : 'Healthy';
    const statusColor =
      status === 'Limit reached' ? '#d97070' : status === 'Near limit' ? '#d4a359' : '#8fb39a';

    const updated = {
      ...existing,
      name: updatedName,
      category: updatedName,
      limit: limitVal,
      color: catColor,
      status,
      statusColor,
    };

    categories[index] = updated;
    store.set('budgetCategories', categories);

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBudgetCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const isMongoConnected = mongoose.connection.readyState === 1;

    if (isMongoConnected) {
      const deleted = await BudgetCategory.findOneAndDelete({ id });
      if (!deleted) {
        return res.status(404).json({ success: false, message: 'Category not found' });
      }
    }

    const categories = store.get('budgetCategories') || [];
    store.set('budgetCategories', categories.filter(c => c.id !== id));

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyLimit = async (req, res, next) => {
  try {
    const isMongoConnected = mongoose.connection.readyState === 1;
    if (isMongoConnected) {
      const setting = await Setting.findOne({ key: 'global' });
      if (setting && setting.monthlyLimit) {
        return res.status(200).json({ success: true, monthlyLimit: setting.monthlyLimit });
      }
    }

    const limit = store.get('monthlyLimit') || 30000;
    res.status(200).json({ success: true, monthlyLimit: limit });
  } catch (error) {
    next(error);
  }
};

export const updateMonthlyLimit = async (req, res, next) => {
  try {
    const { monthlyLimit } = req.body;
    const num = Number(monthlyLimit);

    if (isNaN(num) || num <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid positive monthly limit is required',
      });
    }

    if (mongoose.connection.readyState === 1) {
      await Setting.findOneAndUpdate(
        { key: 'global' },
        { monthlyLimit: num },
        { upsert: true }
      );
    }

    store.set('monthlyLimit', num);
    res.status(200).json({
      success: true,
      message: 'Monthly limit updated successfully',
      monthlyLimit: num,
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailableCategories = async (req, res, next) => {
  try {
    if (mongoose.connection.readyState === 1) {
      const setting = await Setting.findOne({ key: 'global' }).lean();
      if (setting && setting.availableCategories && setting.availableCategories.length) {
        return res.status(200).json({ success: true, data: setting.availableCategories });
      }
    }

    const list = store.get('availableCategories') || [];
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};
