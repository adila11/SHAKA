import { dbStore } from '../data/dbStore.js';

export const getBudgetCategories = async (req, res, next) => {
  try {
    const list = await dbStore.budget.getCategories();
    res.status(200).json({
      success: true,
      count: list.length,
      data: list,
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

    const newCategory = {
      id: newId,
      name: trimmedName,
      category: trimmedName,
      limit: limitVal,
      color: catColor,
    };

    const created = await dbStore.budget.addCategory(newCategory);
    await dbStore.budget.addAvailableCategory({ name: trimmedName, color: catColor });

    res.status(201).json({
      success: true,
      message: 'Budget category created successfully',
      data: created,
    });
  } catch (error) {
    next(error);
  }
};

export const updateBudgetCategory = async (req, res, next) => {
  try {
    const { id } = req.params;
    const { name, limit, color } = req.body;

    const list = await dbStore.budget.getCategories();
    const existing = list.find(c => c.id === id);

    if (!existing) {
      return res.status(404).json({ success: false, message: 'Category not found' });
    }

    const updatedName = name !== undefined && name.trim() ? name.trim() : existing.name;
    const limitVal =
      limit !== undefined && !isNaN(limit) && Number(limit) > 0 ? Number(limit) : existing.limit;
    const catColor = color || existing.color;

    const updates = {
      name: updatedName,
      category: updatedName,
      limit: limitVal,
      color: catColor,
    };

    const updated = await dbStore.budget.updateCategory(id, updates);

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
    const success = await dbStore.budget.deleteCategory(id);

    if (!success) {
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
    const limit = await dbStore.budget.getMonthlyLimit();
    res.status(200).json({ success: true, monthlyLimit: limit });
  } catch (error) {
    next(error);
  }
};

export const updateMonthlyLimit = async (req, res, next) => {
  try {
    const totalLimit = await dbStore.budget.getMonthlyLimit();
    res.status(200).json({
      success: true,
      message: 'Monthly limit is dynamically derived from all category limits combined',
      monthlyLimit: totalLimit,
    });
  } catch (error) {
    next(error);
  }
};

export const getAvailableCategories = async (req, res, next) => {
  try {
    const categories = await dbStore.budget.getAvailableCategories();
    res.status(200).json({ success: true, data: categories });
  } catch (error) {
    next(error);
  }
};
