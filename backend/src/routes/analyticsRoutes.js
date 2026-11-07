import { Router } from 'express';
import {
  getDashboardSummary,
  getCategorySpending,
  getMonthlyAnalytics,
  getReports,
} from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/dashboard', getDashboardSummary);
router.get('/summary', getDashboardSummary);
router.get('/category-spending', getCategorySpending);
router.get('/monthly', getMonthlyAnalytics);
router.get('/reports', getReports);

export default router;

