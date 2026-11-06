import { Transaction } from '../models/Transaction.js';
import { BudgetCategory } from '../models/BudgetCategory.js';

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
    const { category, search, user, isSplit, limit, offset } = req.query;

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

    res.status(200).json({
      success: true,
      count: sanitized.length,
      total: totalCount,
      data: sanitized,
    });
  } catch (error) {
    next(error);
  }
};

export const getTransactionById = async (req, res, next) => {
  try {
    const item = await Transaction.findOne({ id: req.params.id }).lean();
    if (!item) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    delete item._id;
    delete item.__v;

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

    await Transaction.create(newTx);

    // Update corresponding budget category spent in MongoDB
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
    const deleted = await Transaction.findOneAndDelete({ id });

    if (!deleted) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};
