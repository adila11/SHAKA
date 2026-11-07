import { Router } from 'express';
import {
  getMembers,
  getBalances,
  settleBalances,
} from '../controllers/householdController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Enforce authentication on all household endpoints
router.use(protect);

router.get('/members', getMembers);
router.get('/balances', getBalances);
router.post('/settle', requireAdmin, settleBalances);

export default router;

