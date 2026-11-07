import { Router } from 'express';
import {
  getBudgetCategories,
  addBudgetCategory,
  updateBudgetCategory,
  deleteBudgetCategory,
  getMonthlyLimit,
  updateMonthlyLimit,
  getAvailableCategories,
} from '../controllers/budgetController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Enforce authentication on all budget endpoints
router.use(protect);

// Supports both /api/budget/categories and /api/budget-categories
router.route(['/categories', '/'])
  .get(getBudgetCategories)
  .post(requireAdmin, addBudgetCategory);

router.route(['/categories/:id', '/:id'])
  .put(requireAdmin, updateBudgetCategory)
  .delete(requireAdmin, deleteBudgetCategory);

router.get('/monthly-limit', getMonthlyLimit);
router.put('/monthly-limit', requireAdmin, updateMonthlyLimit);

router.get('/available-categories', getAvailableCategories);

export default router;

