import jwt from 'jsonwebtoken';
import { config } from '../config/index.js';
import { dbStore } from '../data/dbStore.js';

export const protect = async (req, res, next) => {
  let token;
  const authHeader = req.headers.authorization;

  if (authHeader && authHeader.startsWith('Bearer ')) {
    token = authHeader.split(' ')[1];
  }

  if (!token) {
    return res.status(401).json({
      success: false,
      message: 'Not authorized, no token provided',
    });
  }

  let decoded;
  try {
    decoded = jwt.verify(token, config.jwtSecret);
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      // Decode without verification to inspect sessionId
      const unverified = jwt.decode(token);
      if (unverified && unverified.sessionId) {
        const user = await dbStore.users.findBySessionId(unverified.sessionId);
        const session = user?.sessions?.find(s => s.sessionId === unverified.sessionId);
        if (session && !session.revoked && new Date(session.expiresAt) > new Date()) {
          return res.status(401).json({
            success: false,
            message: 'Access token expired. Reauthentication or refresh required.',
            tokenExpired: true,
            sessionId: unverified.sessionId,
            accessCodeEnabled: Boolean(user.accessCodeEnabled),
          });
        }
      }
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
        sessionExpired: true,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid or malformed',
    });
  }

  try {
    const user = await dbStore.users.findByUsername(decoded.username);
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, user not found',
      });
    }

    // Validate session
    let session = user.sessions?.find(s => s.sessionId === decoded.sessionId);

    // If session not found or revoked
    if (!session || session.revoked) {
      return res.status(401).json({
        success: false,
        message: 'Session has been revoked or terminated. Please log in again.',
        sessionRevoked: true,
      });
    }

    // Validate 3-day inactivity expiration
    const now = new Date();
    if (new Date(session.expiresAt) <= now) {
      await dbStore.users.revokeSession(user.username, decoded.sessionId);
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
        sessionExpired: true,
      });
    }

    // Sliding Session Expiration: Valid authenticated activity resets the 3-day countdown
    const { expiresAt, lastActivityAt } = await dbStore.users.touchSessionActivity(
      user.username,
      decoded.sessionId
    );
    session.lastActivityAt = lastActivityAt;
    session.expiresAt = expiresAt;

    // Attach safe user and session to request
    const safeUser = user.toObject ? user.toObject() : { ...user };
    delete safeUser.password;
    delete safeUser.accessCodeHash;

    req.user = safeUser;
    req.session = session;
    next();
  } catch (error) {
    next(error);
  }
};
