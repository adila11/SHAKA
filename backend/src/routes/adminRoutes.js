import { Router } from 'express';
import {
  createPasswordResetRequest,
  getPendingRequests,
  approvePasswordResetRequest,
  rejectPasswordResetRequest,
  checkPasswordResetStatus,
  completePasswordReset,
} from '../controllers/adminController.js';
import { protect, requireAdmin } from '../middleware/authMiddleware.js';

const router = Router();

// Public forgot password request (Step 1 & 2)
router.post('/forgot-password', createPasswordResetRequest);

// Polling / status check for the unauthenticated requesting admin
router.get('/password-reset-status', checkPasswordResetStatus);

// Complete password reset with approved single-use authorization token
router.post('/reset-password', completePasswordReset);

// Reviewing Admin Protected Endpoints (Requires valid admin session)
router.get('/password-reset-requests', protect, requireAdmin, getPendingRequests);
router.patch('/password-reset-requests/:requestId/approve', protect, requireAdmin, approvePasswordResetRequest);
router.patch('/password-reset-requests/:requestId/reject', protect, requireAdmin, rejectPasswordResetRequest);

export default router;

