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
      const unverified = jwt.decode(token);
      if (unverified && unverified.sessionId) {
        const user = await dbStore.users.findBySessionId(unverified.sessionId, { lean: true });
        const session = user?.sessions?.find(s => s.sessionId === unverified.sessionId);
        if (session && !session.revoked && new Date(session.expiresAt) > new Date()) {
          return res.status(401).json({
            success: false,
            message: 'Access token expired. Refresh required.',
            tokenExpired: true,
            sessionId: unverified.sessionId,
            accessCodeEnabled: Boolean(user.accessCodeEnabled),
          });
        }
      }
      return res.status(401).json({
        success: false,
        message: 'Session expired due to 24 hours of inactivity. Please log in again.',
        sessionExpired: true,
      });
    }

    return res.status(401).json({
      success: false,
      message: 'Not authorized, token invalid or malformed',
    });
  }

  try {
    // 1. Validate primary 24-hour session from database
    const user = await dbStore.users.findBySessionId(decoded.sessionId, { lean: true });
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Not authorized, session not found',
        sessionRevoked: true,
      });
    }

    const session = user.sessions?.find(s => s.sessionId === decoded.sessionId);
    if (!session || session.revoked) {
      return res.status(401).json({
        success: false,
        message: 'Session has been revoked or terminated. Please log in again.',
        sessionRevoked: true,
      });
    }

    // Validate 24-hour inactivity expiration
    const now = new Date();
    if (new Date(session.expiresAt) <= now) {
      dbStore.users.revokeSession(user.username, decoded.sessionId).catch(() => {});
      return res.status(401).json({
        success: false,
        message: 'Session expired due to 24 hours of inactivity. Please log in again.',
        sessionExpired: true,
      });
    }

    // 2. Sliding 24-Hour Session Expiration: Reset 24-hour inactivity countdown
    const touchPromise = dbStore.users.touchSessionActivity(user.username, decoded.sessionId);
    touchPromise.then(({ expiresAt, lastActivityAt }) => {
      session.lastActivityAt = lastActivityAt;
      session.expiresAt = expiresAt;
    }).catch(() => {});

    // Synchronize token expiration: If token age > 15 minutes, issue fresh 24h token in response header
    const tokenAgeSec = Math.floor(now.getTime() / 1000) - (decoded.iat || 0);
    if (tokenAgeSec > 15 * 60) {
      try {
        const refreshedToken = jwt.sign(
          {
            id: user._id || user.username,
            username: user.username,
            role: user.role || 'Member',
            sessionId: decoded.sessionId,
            type: 'access',
          },
          config.jwtSecret,
          { expiresIn: '24h', algorithm: 'HS256' }
        );
        res.setHeader('Authorization', `Bearer ${refreshedToken}`);
      } catch {
        // Fallback silently if header cannot be set
      }
    }

    // 3. Secondary Security: Access Code 1-Hour Application Lock Check
    const isAccessCodeEnabled = Boolean(user.accessCodeEnabled);
    const isAccessCodeUnlocked =
      session.accessCodeUnlockedUntil && new Date(session.accessCodeUnlockedUntil) > now;
    const isAccessCodeLocked = isAccessCodeEnabled && !isAccessCodeUnlocked;

    session.isAccessCodeLocked = isAccessCodeLocked;

    // Attach safe user and session to request
    const safeUser = { ...user };
    delete safeUser.password;
    delete safeUser.accessCodeHash;

    req.user = safeUser;
    req.session = session;

    // If application is locked by access code, allow only access code resolution & profile check routes
    if (isAccessCodeLocked) {
      const allowedPaths = [
        '/api/auth/me',
        '/api/auth/session-info',
        '/api/auth/verify-access-code',
        '/api/auth/logout',
        '/api/health',
      ];
      const isAllowed = allowedPaths.some(p => req.originalUrl?.startsWith(p) || req.path?.startsWith(p));
      if (!isAllowed) {
        return res.status(423).json({
          success: false,
          requiresAccessCode: true,
          accessCodeLocked: true,
          sessionId: session.sessionId,
          message: 'Access code verification required. Application is locked.',
        });
      }
    }

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
