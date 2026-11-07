import { Router } from 'express';
import {
  getTransactions,
  getTransactionById,
  createTransaction,
  updateTransaction,
  deleteTransaction,
  authorizeExpense,
} from '../controllers/transactionController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Enforce authentication on all transaction endpoints
router.use(protect);

router.post('/authorize', authorizeExpense);

router.route('/')
  .get(getTransactions)
  .post(createTransaction);

router.route('/:id')
  .get(getTransactionById)
  .put(updateTransaction)
  .delete(deleteTransaction);

export default router;

