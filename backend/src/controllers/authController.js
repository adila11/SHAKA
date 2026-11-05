import jwt from 'jsonwebtoken';
import bcrypt from 'bcryptjs';
import { config } from '../config/index.js';
import { store } from '../data/store.js';

export const login = async (req, res, next) => {
  try {
    const { username, password } = req.body;

    if (!username || !password) {
      return res.status(400).json({
        success: false,
        message: 'Username and password are required',
      });
    }

    const users = store.get('users') || [];
    let user = users.find(
      u => u.username.toLowerCase() === username.toLowerCase() || u.email.toLowerCase() === username.toLowerCase()
    );

    // If user not found but default demo user requested or testing:
    if (!user && (username.toLowerCase() === 'alex_rivera' || username.toLowerCase() === 'alex')) {
      user = users[0];
    }

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    // Check password if hash exists, or permit standard demo password 'password123'
    let isMatch = true;
    if (user.passwordHash && password !== 'password123') {
      isMatch = await bcrypt.compare(password, user.passwordHash).catch(() => false);
    }

    if (!isMatch && password !== 'password123') {
      return res.status(401).json({
        success: false,
        message: 'Invalid username or password',
      });
    }

    const token = jwt.sign(
      { id: user.id, username: user.username, role: user.role },
      config.jwtSecret,
      { expiresIn: '7d' }
    );

    const { passwordHash, ...safeUser } = user;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      token,
      user: safeUser,
    });
  } catch (error) {
    next(error);
  }
};

export const getMe = (req, res) => {
  const users = store.get('users') || [];
  const user = req.user || users[0];
  const { passwordHash, ...safeUser } = user;
  res.status(200).json({
    success: true,
    user: safeUser,
  });
};

export const forgotPassword = (req, res) => {
  const { email } = req.body;
  if (!email) {
    return res.status(400).json({ success: false, message: 'Email is required' });
  }

  // Simulate password reset link generation
  res.status(200).json({
    success: true,
    message: `A password reset link has been dispatched to ${email}`,
  });
};

export const changePassword = async (req, res, next) => {
  try {
    const { currentPassword, newPassword } = req.body;
    if (!newPassword || newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 6 characters',
      });
    }

    const salt = await bcrypt.genSalt(10);
    const hashed = await bcrypt.hash(newPassword, salt);

    // Update in store
    store.update('users', users =>
      users.map((u, i) => (i === 0 ? { ...u, passwordHash: hashed } : u))
    );

    res.status(200).json({
      success: true,
      message: 'Password successfully updated',
    });
  } catch (error) {
    next(error);
  }
};

