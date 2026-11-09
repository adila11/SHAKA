import crypto from 'crypto';
import bcrypt from 'bcryptjs';
import { dbStore } from '../data/dbStore.js';

// In-memory rate limiting map for password reset requests (max 5 per 15 min per IP/email)
const requestRateLimitMap = new Map();

const isRateLimited = (key) => {
  const now = Date.now();
  const windowMs = 15 * 60 * 1000;
  const maxAttempts = 5;

  const record = requestRateLimitMap.get(key) || { count: 0, resetAt: now + windowMs };
  if (now > record.resetAt) {
    record.count = 1;
    record.resetAt = now + windowMs;
    requestRateLimitMap.set(key, record);
    return false;
  }

  record.count += 1;
  requestRateLimitMap.set(key, record);
  return record.count > maxAttempts;
};

/**
 * 1. POST /api/admin/forgot-password
 * Initiates an Admin-to-Admin password recovery request
 */
export const createPasswordResetRequest = async (req, res, next) => {
  try {
    const { email } = req.body;
    const clientIp = req.ip || req.headers['x-forwarded-for'] || 'unknown';

    if (!email || !String(email).trim()) {
      return res.status(400).json({
        success: false,
        message: 'Registered admin email address is mandatory.',
      });
    }

    const trimmedEmail = String(email).trim().toLowerCase();
    const emailRegex = /^[^\s@]+@[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      return res.status(400).json({
        success: false,
        message: 'Please provide a valid email address.',
      });
    }

    // Rate limiting check
    if (isRateLimited(`req-${clientIp}-${trimmedEmail}`)) {
      return res.status(429).json({
        success: false,
        message: 'Too many recovery requests. Please wait 15 minutes before trying again.',
      });
    }

    // Lookup user by registered email (with fallback for @shaka, @shaka.local, or username)
    let user = await dbStore.users.findByEmail(trimmedEmail);
    if (!user) {
      if (trimmedEmail.endsWith('@shaka')) {
        user = await dbStore.users.findByEmail(`${trimmedEmail}.local`);
      } else if (trimmedEmail.endsWith('@shaka.local')) {
        user = await dbStore.users.findByEmail(trimmedEmail.replace(/\.local$/, ''));
      }
      if (!user) {
        const usernamePart = trimmedEmail.split('@')[0];
        user = await dbStore.users.findByUsername(usernamePart);
      }
    }

    // Security check: Must exist AND must be an Admin
    if (!user || user.role !== 'Admin') {
      return res.status(404).json({
        success: false,
        message: 'No administrator account found with this registered email address.',
      });
    }

    // Check for existing active pending request
    const existingPending = await dbStore.adminPasswordResetRequests.findActivePendingByRequester(
      user.username,
      user.email
    );

    if (existingPending) {
      return res.status(409).json({
        success: false,
        message: 'A password reset request is already pending approval from the other administrator.',
        requestId: existingPending._id || existingPending.id,
      });
    }

    // Generate secure lookup token for the unauthenticated requester
    const lookupToken = crypto.randomBytes(32).toString('hex');
    const lookupTokenHash = crypto.createHash('sha256').update(lookupToken).digest('hex');

    // 24-hour expiration for pending approval
    const expiresAt = new Date(Date.now() + 24 * 60 * 60 * 1000);

    const newRequest = await dbStore.adminPasswordResetRequests.create({
      requestingAdminId: user._id || user.id || user.username,
      requestingAdminUsername: user.username,
      requestingAdminEmail: user.email,
      status: 'pending',
      lookupTokenHash,
      expiresAt,
    });

    const requestId = newRequest._id || newRequest.id;

    res.status(201).json({
      success: true,
      message:
        'Your password reset request has been sent to the other administrator. You will be able to reset your password once the request is approved.',
      requestId,
      lookupToken,
      status: 'pending',
      request: {
        id: requestId,
        requestingAdminUsername: user.username,
        requestingAdminEmail: user.email,
        createdAt: newRequest.createdAt,
        status: 'pending',
      },
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 2. GET /api/admin/password-reset-requests
 * Authenticated reviewing admin inspects pending requests from the other admin
 */
export const getPendingRequests = async (req, res, next) => {
  try {
    const reviewer = req.user;
    if (!reviewer || reviewer.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin privileges required.',
      });
    }

    const pendingRequests = await dbStore.adminPasswordResetRequests.findPendingForReviewer(
      reviewer.username
    );

    const allHistory = await dbStore.adminPasswordResetRequests.getAllForReviewer(
      reviewer.username
    );

    res.status(200).json({
      success: true,
      pendingCount: pendingRequests.length,
      requests: pendingRequests.map(r => ({
        id: r._id || r.id,
        requestingAdminUsername: r.requestingAdminUsername,
        requestingAdminEmail: r.requestingAdminEmail,
        createdAt: r.createdAt,
        status: r.status,
        expiresAt: r.expiresAt,
      })),
      history: allHistory.map(r => ({
        id: r._id || r.id,
        requestingAdminUsername: r.requestingAdminUsername,
        requestingAdminEmail: r.requestingAdminEmail,
        approvingAdminUsername: r.approvingAdminUsername,
        createdAt: r.createdAt,
        approvedAt: r.approvedAt,
        rejectedAt: r.rejectedAt,
        completedAt: r.completedAt,
        status: r.status,
      })),
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 3. PATCH /api/admin/password-reset-requests/:requestId/approve
 * Reviewing admin approves a pending request and issues a short-lived reset authorization
 */
export const approvePasswordResetRequest = async (req, res, next) => {
  try {
    const reviewer = req.user;
    const { requestId } = req.params;

    if (!reviewer || reviewer.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin privileges required.',
      });
    }

    const request = await dbStore.adminPasswordResetRequests.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Password reset request not found.',
      });
    }

    // Verify reviewing admin is not the requesting admin
    if (request.requestingAdminUsername.toLowerCase() === reviewer.username.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot approve your own password reset request.',
      });
    }

    // Verify request is still pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request cannot be approved because its current status is "${request.status}".`,
      });
    }

    // Check expiration
    if (request.expiresAt && new Date(request.expiresAt) <= new Date()) {
      await dbStore.adminPasswordResetRequests.update(requestId, { status: 'expired' });
      return res.status(400).json({
        success: false,
        message: 'This request has expired and can no longer be approved.',
      });
    }

    // Generate single-use secure reset authorization token (15-minute window)
    const resetToken = crypto.randomBytes(32).toString('hex');
    const resetExpiresAt = new Date(Date.now() + 15 * 60 * 1000);

    await dbStore.adminPasswordResetRequests.update(requestId, {
      status: 'approved',
      approvingAdminId: reviewer._id || reviewer.id || reviewer.username,
      approvingAdminUsername: reviewer.username,
      approvedAt: new Date(),
      resetToken,
      resetExpiresAt,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset request approved successfully.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 4. PATCH /api/admin/password-reset-requests/:requestId/reject
 * Reviewing admin declines a pending request
 */
export const rejectPasswordResetRequest = async (req, res, next) => {
  try {
    const reviewer = req.user;
    const { requestId } = req.params;

    if (!reviewer || reviewer.role !== 'Admin') {
      return res.status(403).json({
        success: false,
        message: 'Access denied: Admin privileges required.',
      });
    }

    const request = await dbStore.adminPasswordResetRequests.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Password reset request not found.',
      });
    }

    // Verify reviewing admin is not the requesting admin
    if (request.requestingAdminUsername.toLowerCase() === reviewer.username.toLowerCase()) {
      return res.status(403).json({
        success: false,
        message: 'Access denied: You cannot reject your own password reset request.',
      });
    }

    // Verify request is still pending
    if (request.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `Request cannot be rejected because its current status is "${request.status}".`,
      });
    }

    await dbStore.adminPasswordResetRequests.update(requestId, {
      status: 'rejected',
      approvingAdminId: reviewer._id || reviewer.id || reviewer.username,
      approvingAdminUsername: reviewer.username,
      rejectedAt: new Date(),
      resetToken: null,
      resetExpiresAt: null,
    });

    res.status(200).json({
      success: true,
      message: 'Password reset request rejected.',
    });
  } catch (error) {
    next(error);
  }
};

/**
 * 5. GET /api/admin/password-reset-status
 * Requesting admin polls/checks the status of their submitted recovery request
 */
export const checkPasswordResetStatus = async (req, res, next) => {
  try {
    const requestId = req.query.requestId || req.headers['x-request-id'];
    const lookupToken = req.query.lookupToken || req.headers['x-lookup-token'];

    if (!requestId || !lookupToken) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and security lookup token are required.',
      });
    }

    const request = await dbStore.adminPasswordResetRequests.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Password reset request not found.',
      });
    }

    // Validate lookup token hash
    const computedHash = crypto.createHash('sha256').update(String(lookupToken)).digest('hex');
    if (request.lookupTokenHash !== computedHash) {
      return res.status(401).json({
        success: false,
        message: 'Invalid security lookup token for this request.',
      });
    }

    const now = new Date();

    // Check expiration for pending requests
    if (request.status === 'pending' && request.expiresAt && new Date(request.expiresAt) <= now) {
      await dbStore.adminPasswordResetRequests.update(requestId, { status: 'expired' });
      return res.status(200).json({
        success: true,
        status: 'expired',
        message: 'Your password reset request has expired. Please submit a new request.',
      });
    }

    // Check expiration for approved reset token
    if (request.status === 'approved' && request.resetExpiresAt && new Date(request.resetExpiresAt) <= now) {
      await dbStore.adminPasswordResetRequests.update(requestId, {
        status: 'expired',
        resetToken: null,
      });
      return res.status(200).json({
        success: true,
        status: 'expired',
        message: 'Your password reset authorization has expired. Please submit a new request.',
      });
    }

    switch (request.status) {
      case 'pending':
        return res.status(200).json({
          success: true,
          status: 'pending',
          message:
            'Your password reset request has been sent to the other administrator. You will be able to reset your password once the request is approved.',
          requestingAdminUsername: request.requestingAdminUsername,
          createdAt: request.createdAt,
        });

      case 'approved':
        return res.status(200).json({
          success: true,
          status: 'approved',
          message:
            'Your password reset request has been approved. You can now create a new password.',
          resetToken: request.resetToken,
          requestingAdminUsername: request.requestingAdminUsername,
          approvedAt: request.approvedAt,
        });

      case 'rejected':
        return res.status(200).json({
          success: true,
          status: 'rejected',
          message:
            'Your password change request has been declined by the other administrator.',
          rejectedAt: request.rejectedAt,
        });

      case 'completed':
        return res.status(200).json({
          success: true,
          status: 'completed',
          message:
            'Your password has been changed successfully. Please log in using your new password.',
          completedAt: request.completedAt,
        });

      case 'expired':
      default:
        return res.status(200).json({
          success: true,
          status: 'expired',
          message:
            'Your password reset request has expired. Please submit a new request.',
        });
    }
  } catch (error) {
    next(error);
  }
};

/**
 * 6. POST /api/admin/reset-password
 * Completes password reset with the approved single-use authorization token
 */
export const completePasswordReset = async (req, res, next) => {
  try {
    const { requestId, resetToken, newPassword, confirmPassword } = req.body;

    if (!requestId || !resetToken) {
      return res.status(400).json({
        success: false,
        message: 'Request ID and reset authorization token are required.',
      });
    }

    if (!newPassword || newPassword.length < 8) {
      return res.status(400).json({
        success: false,
        message: 'New password must be at least 8 characters long.',
      });
    }

    if (!/[A-Z]/.test(newPassword) || !/[0-9]/.test(newPassword)) {
      return res.status(400).json({
        success: false,
        message: 'New password must contain at least one uppercase letter and one number.',
      });
    }

    if (newPassword !== confirmPassword) {
      return res.status(400).json({
        success: false,
        message: 'New password and confirmation do not match.',
      });
    }

    const request = await dbStore.adminPasswordResetRequests.findById(requestId);
    if (!request) {
      return res.status(404).json({
        success: false,
        message: 'Password reset request not found.',
      });
    }

    if (request.status !== 'approved') {
      return res.status(400).json({
        success: false,
        message: `Password reset is not authorized because this request is ${request.status}.`,
      });
    }

    // Verify single-use reset authorization token
    if (!request.resetToken || request.resetToken !== resetToken) {
      return res.status(401).json({
        success: false,
        message: 'Invalid or expired single-use password reset authorization.',
      });
    }

    // Verify token expiration
    if (!request.resetExpiresAt || new Date(request.resetExpiresAt) <= new Date()) {
      await dbStore.adminPasswordResetRequests.update(requestId, {
        status: 'expired',
        resetToken: null,
      });
      return res.status(400).json({
        success: false,
        message: 'Password reset authorization has expired. Please submit a new request.',
      });
    }

    // Hash the new password securely using bcrypt
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(newPassword, salt);

    // Update password in the database
    await dbStore.users.updatePassword(request.requestingAdminUsername, hashedPassword);

    // Invalidate all existing sessions for the requesting admin
    await dbStore.users.revokeAllSessions(request.requestingAdminUsername);

    // Invalidate the reset authorization and mark request completed
    await dbStore.adminPasswordResetRequests.update(requestId, {
      status: 'completed',
      completedAt: new Date(),
      resetToken: null,
      resetExpiresAt: null,
    });

    res.status(200).json({
      success: true,
      message: 'Your password has been changed successfully. Please log in using your new password.',
    });
  } catch (error) {
    next(error);
  }
};

