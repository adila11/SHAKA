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
    decoded = jwt.verify(token, config.jwtSecret, { algorithms: ['HS256'] });
  } catch (err) {
    if (err.name === 'TokenExpiredError') {
      // Decode without verification to inspect sessionId — one DB read to check session validity
      const unverified = jwt.decode(token);
      if (unverified && unverified.sessionId) {
        const user = await dbStore.users.findBySessionId(unverified.sessionId, { lean: true });
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
    // Single DB read: look up by sessionId (indexed) instead of username
    const user = await dbStore.users.findBySessionId(decoded.sessionId, { lean: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, session not found',
        sessionRevoked: true,
      });
    }

    // Validate session
    const session = user.sessions?.find(s => s.sessionId === decoded.sessionId);

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
      // Fire and forget revocation — don't block the response
      dbStore.users.revokeSession(user.username, decoded.sessionId).catch(() => {});
      return res.status(401).json({
        success: false,
        message: 'Session expired. Please log in again.',
        sessionExpired: true,
      });
    }

    // Sliding Session Expiration: fire-and-forget (non-blocking)
    // Don't await — the response is not blocked by the session touch
    const touchPromise = dbStore.users.touchSessionActivity(user.username, decoded.sessionId);
    touchPromise.then(({ expiresAt, lastActivityAt }) => {
      session.lastActivityAt = lastActivityAt;
      session.expiresAt = expiresAt;
    }).catch(() => {}); // Silently ignore touch failures

    // Attach safe user and session to request
    const safeUser = { ...user };
    delete safeUser.password;
    delete safeUser.accessCodeHash;

    req.user = safeUser;
    req.session = session;
    next();
  } catch (error) {
    next(error);
  }
};

export const requireAdmin = (req, res, next) => {
  if (!req.user || req.user.role !== 'Admin') {
    return res.status(403).json({
      success: false,
      message: 'Access denied: Admin privileges required for this action.',
      errorCode: 'FORBIDDEN',
    });
  }
  next();
};
