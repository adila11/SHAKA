import { Router } from 'express';
import { getDashboardSummary } from '../controllers/analyticsController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

router.use(protect);

router.get('/summary', getDashboardSummary);

export default router;

