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

export const getTransactions = (req, res, next) => {
  try {
    let list = store.get('transactions') || [];
    const { category, search, user, isSplit, limit, offset } = req.query;

    if (category && category !== 'All') {
      list = list.filter(
        t => t.category.toLowerCase() === category.toLowerCase()
      );
    }

    if (user) {
      list = list.filter(
        t => t.user.toLowerCase() === user.toLowerCase()
      );
    }

    if (isSplit !== undefined) {
      const splitBool = isSplit === 'true';
      list = list.filter(t => t.isSplit === splitBool);
    }

    if (search) {
      const query = search.toLowerCase();
      list = list.filter(
        t =>
          t.description.toLowerCase().includes(query) ||
          t.category.toLowerCase().includes(query) ||
          t.user.toLowerCase().includes(query) ||
          String(t.amount).includes(query)
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

export const getTransactionById = (req, res, next) => {
  try {
    const list = store.get('transactions') || [];
    const item = list.find(t => t.id === req.params.id);
    if (!item) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }
    res.status(200).json({ success: true, data: item });
  } catch (error) {
    next(error);
  }
};

export const createTransaction = (req, res, next) => {
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

    // Prepend new transaction to store
    store.update('transactions', prev => [newTx, ...(prev || [])]);

    // Recalculate and update budget category spent
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
            status === 'Limit reached'
              ? '#d97070'
              : status === 'Near limit'
              ? '#d4a359'
              : '#8fb39a';
          return {
            ...cat,
            spent: updatedSpent,
            status,
            statusColor,
          };
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

export const updateTransaction = (req, res, next) => {
  try {
    const { id } = req.params;
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

export const deleteTransaction = (req, res, next) => {
  try {
    const { id } = req.params;
    const list = store.get('transactions') || [];
    const filtered = list.filter(t => t.id !== id);

    if (filtered.length === list.length) {
      return res.status(404).json({ success: false, message: 'Transaction not found' });
    }

    store.set('transactions', filtered);
    res.status(200).json({
      success: true,
      message: 'Transaction deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

