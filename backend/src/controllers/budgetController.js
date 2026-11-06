import { BudgetCategory } from '../models/BudgetCategory.js';
import { Transaction } from '../models/Transaction.js';
import { Setting } from '../models/Setting.js';

export const getBudgetCategories = async (req, res, next) => {
  try {
    const categories = await BudgetCategory.find().lean();
    const sanitized = categories.map(({ _id, __v, ...item }) => item);
    res.status(200).json({
      success: true,
      count: sanitized.length,
      data: sanitized,
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

    const txs = await Transaction.find({ category: new RegExp(`^${trimmedName}$`, 'i') });
    const existingSpent = txs.reduce((sum, t) => sum + Number(t.amount), 0);

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

    await BudgetCategory.create(newCategory);
    await Setting.findOneAndUpdate(
      { key: 'global' },
      { $addToSet: { availableCategories: { name: trimmedName, color: catColor } } }
    );

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

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: sanitized,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBudgetCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const deleted = await BudgetCategory.findOneAndDelete({ id });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

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
    const setting = await Setting.findOne({ key: 'global' });
    const limit = setting?.monthlyLimit || 30000;
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

    await Setting.findOneAndUpdate(
      { key: 'global' },
      { monthlyLimit: num },
      { upsert: true }
    );

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
    const setting = await Setting.findOne({ key: 'global' }).lean();
    const categories = setting?.availableCategories || [];
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};
