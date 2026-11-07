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

router.get('/categories', getBudgetCategories);
router.post('/categories', requireAdmin, addBudgetCategory);
router.put('/categories/:id', requireAdmin, updateBudgetCategory);
router.delete('/categories/:id', requireAdmin, deleteBudgetCategory);

router.get('/monthly-limit', getMonthlyLimit);
router.put('/monthly-limit', requireAdmin, updateMonthlyLimit);

router.get('/available-categories', getAvailableCategories);

export default router;

