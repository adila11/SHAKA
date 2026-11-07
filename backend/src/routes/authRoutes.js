import { Router } from 'express';
import {
  login,
  signup,
  refresh,
  verifyAccessCode,
  enableAccessCode,
  changeAccessCode,
  disableAccessCode,
  resetAccessCode,
  getSessionInfo,
  logout,
  getMe,
  updateProfile,
  changePassword,
} from '../controllers/authController.js';
import { createPasswordResetRequest } from '../controllers/adminController.js';
import { protect } from '../middleware/authMiddleware.js';

const router = Router();

// Public authentication & reauthentication
router.post('/login', login);
router.post('/signup', signup);
router.post('/register', signup);
router.post('/refresh', refresh);
router.post('/verify-access-code', verifyAccessCode);
router.post('/logout', logout);
router.post('/forgot-password', createPasswordResetRequest);

// Protected session & access code management
router.get('/me', protect, getMe);
router.put('/profile', protect, updateProfile);
router.get('/session-info', protect, getSessionInfo);
router.post('/access-code/enable', protect, enableAccessCode);
router.post('/access-code/change', protect, changeAccessCode);
router.post('/access-code/disable', protect, disableAccessCode);
router.post('/access-code/reset', protect, resetAccessCode);
router.post('/change-password', protect, changePassword);

export default router;

