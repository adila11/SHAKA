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

const router = Router();

router.get('/categories', getBudgetCategories);
router.post('/categories', addBudgetCategory);
router.put('/categories/:id', updateBudgetCategory);
router.delete('/categories/:id', deleteBudgetCategory);

router.get('/monthly-limit', getMonthlyLimit);
router.put('/monthly-limit', updateMonthlyLimit);

router.get('/available-categories', getAvailableCategories);

export default router;

