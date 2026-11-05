import { store } from '../data/store.js';

export const getBudgetCategories = (req, res, next) => {
  try {
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

export const addBudgetCategory = (req, res, next) => {
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

    const transactions = store.get('transactions') || [];
    const existingSpent = transactions
      .filter(t => t.category.toLowerCase() === trimmedName.toLowerCase())
      .reduce((sum, t) => sum + Number(t.amount), 0);

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

    store.update('budgetCategories', prev => [...(prev || []), newCategory]);

    // Also add to availableCategories if missing
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

export const updateBudgetCategory = (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, limit, color } = req.body;

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

    if (name !== undefined && name.trim()) {
      store.update('availableCategories', prev =>
        (prev || []).map(c =>
          c.name.toLowerCase() === existing.name.toLowerCase()
            ? { ...c, name: updatedName, color: catColor }
            : c
        )
      );
    }

    res.status(200).json({
      success: true,
      message: 'Category updated successfully',
      data: updated,
    });
  } catch (error) {
    next(error);
  }
};

export const deleteBudgetCategory = (req, res, next) => {
  try {
    const { id } = req.params;
    const categories = store.get('budgetCategories') || [];
    const catToDelete = categories.find(c => c.id === id);

    if (!catToDelete) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    store.set('budgetCategories', categories.filter(c => c.id !== id));
    store.update('availableCategories', prev =>
      (prev || []).filter(c => c.name.toLowerCase() !== catToDelete.name.toLowerCase())
    );

    res.status(200).json({
      success: true,
      message: 'Category deleted successfully',
    });
  } catch (error) {
    next(error);
  }
};

export const getMonthlyLimit = (req, res, next) => {
  try {
    const limit = store.get('monthlyLimit') || 30000;
    res.status(200).json({ success: true, monthlyLimit: limit });
  } catch (error) {
    next(error);
  }
};

export const updateMonthlyLimit = (req, res, next) => {
  try {
    const { monthlyLimit } = req.body;
    const num = Number(monthlyLimit);

    if (isNaN(num) || num <= 0) {
      return res.status(400).json({
        success: false,
        message: 'Valid positive monthly limit is required',
      });
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

export const getAvailableCategories = (req, res, next) => {
  try {
    const list = store.get('availableCategories') || [];
    res.status(200).json({ success: true, data: list });
  } catch (error) {
    next(error);
  }
};

