import { Router } from 'express';
import {
  getMembers,
  getBalances,
  settleBalances,
} from '../controllers/householdController.js';

const router = Router();

router.get('/members', getMembers);
router.get('/balances', getBalances);
router.post('/settle', settleBalances);

export default router;

