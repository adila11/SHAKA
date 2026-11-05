import { Router } from 'express';
import {
  login,
  getMe,
  forgotPassword,
  changePassword,
} from '../controllers/authController.js';

const router = Router();

router.post('/login', login);
router.get('/me', getMe);
router.post('/forgot-password', forgotPassword);
router.post('/change-password', changePassword);

export default router;

