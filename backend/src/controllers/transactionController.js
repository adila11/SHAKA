import { dbStore } from '../data/dbStore.js';

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

    const filter = {
      category,
      search,
      user,
      isSplit: isSplit !== undefined ? isSplit === 'true' : undefined,
    };

    const list = await dbStore.transactions.find(filter);
    const totalCount = list.length;

    const skip = parseInt(offset) || 0;
    const end = limit ? skip + parseInt(limit) : undefined;
    const paginated = end ? list.slice(skip, end) : list;

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
    const item = await dbStore.transactions.findById(req.params.id);
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
      user = 'abdulshamil',
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

    await dbStore.transactions.create(newTx);
    await dbStore.budget.updateSpent(category, numAmount);

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
    const updated = await dbStore.transactions.update(id, req.body);

    if (!updated) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

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
    const success = await dbStore.transactions.delete(id);

    if (!success) {
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
