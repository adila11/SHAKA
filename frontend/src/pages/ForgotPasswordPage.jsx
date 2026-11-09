import { useState, useEffect, useRef, useCallback } from 'react';
import {
  ArrowLeft,
  Mail,
  ShieldAlert,
  ShieldCheck,
  CheckCircle2,
  AlertCircle,
  Loader2,
  Clock,
  Eye,
  EyeOff,
  RotateCw,
  XCircle,
} from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function ForgotPasswordPage() {
  const { setCurrentScreen } = useFinance();
  const { isDark } = useTheme();

  // Recovery flow stage: 'form' | 'pending' | 'approved' | 'rejected' | 'expired' | 'completed'
  const [stage, setStage] = useState('form');

  // Input fields
  const [email, setEmail] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  // Recovery session data
  const [activeRequest, setActiveRequest] = useState(null); // { requestId, lookupToken, requestingAdminUsername, requestingAdminEmail, createdAt }
  const [resetToken, setResetToken] = useState(null);

  // Status & feedback
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isCheckingStatus, setIsCheckingStatus] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const pollingTimerRef = useRef(null);

  // Validation rules for new password
  const hasLength = newPassword.length >= 8;
  const hasUpperNumber = /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  // Poll status while waiting for approval
  const checkStatus = useCallback(async (manual = false) => {
    if (!activeRequest?.requestId || !activeRequest?.lookupToken) return;

    if (manual) setIsCheckingStatus(true);
    try {
      const res = await api.admin.checkResetStatus({
        requestId: activeRequest.requestId,
        lookupToken: activeRequest.lookupToken,
      });

      if (res?.success) {
        if (res.status === 'approved') {
          setStage('approved');
          setResetToken(res.resetToken);
          setErrorMessage('');
          setSuccessMessage(
            'Your password reset request has been approved. You can now create a new password.'
          );
        } else if (res.status === 'rejected') {
          setStage('rejected');
          setErrorMessage(
            'Your password change request has been declined by the other administrator.'
          );
        } else if (res.status === 'expired') {
          setStage('expired');
          setErrorMessage(
            'Your password reset request has expired. Please submit a new request.'
          );
        } else if (res.status === 'completed') {
          setStage('completed');
          setSuccessMessage(
            'Your password has been changed successfully. Please log in using your new password.'
          );
        }
      }
    } catch {
      // Polling network error suppressed
    } finally {
      if (manual) setIsCheckingStatus(false);
    }
  }, [activeRequest]);

  // Set up polling when in 'pending' stage
  useEffect(() => {
    if (stage !== 'pending') {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
      return;
    }

    pollingTimerRef.current = setInterval(() => {
      checkStatus(false);
    }, 3500);

    return () => {
      if (pollingTimerRef.current) clearInterval(pollingTimerRef.current);
    };
  }, [stage, checkStatus]);

  // Step 1: Submit email to request reset approval
  const handleRequestSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    const trimmedEmail = email.trim().toLowerCase();
    if (!trimmedEmail) {
      setErrorMessage('Please enter your registered administrator email address.');
      return;
    }

    const emailRegex = /^[^\s@]+@[^\s@]+$/;
    if (!emailRegex.test(trimmedEmail)) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.admin.forgotPassword(trimmedEmail);

      if (res?.success) {
        setActiveRequest({
          requestId: res.requestId,
          lookupToken: res.lookupToken,
          requestingAdminUsername: res.request?.requestingAdminUsername || res.requestingAdmin?.username || 'Administrator',
          requestingAdminEmail: trimmedEmail,
          createdAt: res.request?.createdAt || new Date().toISOString(),
        });
        setStage('pending');
        setSuccessMessage(
          'Your password reset request has been sent to the other administrator. You will be able to reset your password once the request is approved.'
        );
      } else {
        setErrorMessage(res?.message || 'Admin account not found or recovery unavailable.');
      }
    } catch (err) {
      setErrorMessage(
        err.message || 'Unable to submit recovery request. Please ensure the backend is reachable.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  // Step 3: Complete password reset with approved single-use authorization
  const handleResetSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');

    if (!hasLength) {
      setErrorMessage('New password must be at least 8 characters long.');
      return;
    }

    if (!hasUpperNumber) {
      setErrorMessage('New password must include at least one uppercase letter and one number.');
      return;
    }

    if (!passwordsMatch) {
      setErrorMessage('New password and confirmation do not match.');
      return;
    }

    if (!activeRequest?.requestId || !resetToken) {
      setErrorMessage('Reset authorization token missing. Please submit a new request.');
      return;
    }

    setIsSubmitting(true);
    try {
      const res = await api.admin.completeResetPassword({
        requestId: activeRequest.requestId,
        resetToken,
        newPassword,
        confirmPassword,
      });

      if (res?.success) {
        setStage('completed');
        setSuccessMessage(
          'Your password has been changed successfully. Please log in using your new password.'
        );
        // Clear sensitive inputs
        setNewPassword('');
        setConfirmPassword('');
        setResetToken(null);
        setTimeout(() => {
          setCurrentScreen('login');
        }, 2200);
      } else {
        setErrorMessage(res?.message || 'Failed to update password.');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error updating password.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRestart = () => {
    setStage('form');
    setEmail('');
    setNewPassword('');
    setConfirmPassword('');
    setActiveRequest(null);
    setResetToken(null);
    setErrorMessage('');
    setSuccessMessage('');
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div
        className={`w-full max-w-md p-7 sm:p-8 rounded-3xl border shadow-2xl transition-colors min-w-0 max-w-full break-words ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        {/* Back navigation button */}
        <button
          type="button"
          onClick={() => setCurrentScreen('login')}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-6 transition-colors cursor-pointer ${
            isDark
              ? 'bg-[#0e0e10] border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea]'
              : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#71717a] hover:text-[#18181b]'
          }`}
          title="Return to login"
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        {/* Header Monogram & Title */}
        <div className="mb-6">
          <div className="flex items-center gap-2 mb-2">
            <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#c9b27c]/15 text-[#c9b27c] border border-[#c9b27c]/30 font-bold uppercase tracking-wider">
              Two-Admin Approval
            </span>
          </div>
          <h2 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            {stage === 'approved'
              ? 'Create New Password'
              : stage === 'pending'
              ? 'Approval Pending'
              : stage === 'completed'
              ? 'Password Changed'
              : 'Admin Password Recovery'}
          </h2>
          <p className={`text-xs mt-1.5 leading-relaxed ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            {stage === 'approved'
              ? 'Your password reset request has been approved by the other administrator. Set your new password below.'
              : stage === 'pending'
              ? 'Your request is waiting for review. The other administrator must approve this request before you can proceed.'
              : stage === 'completed'
              ? 'Your administrator credentials have been securely updated.'
              : 'If you forgot your administrator password, request approval from the second administrator to reset it.'}
          </p>
        </div>

        {/* Dynamic Alerts */}
        {errorMessage && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#d97070]/10 border border-[#d97070]/30 flex items-start gap-2.5 text-[#d97070] text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="min-w-0 flex-1 leading-relaxed">{errorMessage}</span>
          </div>
        )}

        {successMessage && stage !== 'rejected' && stage !== 'expired' && (
          <div className="mb-5 p-3.5 rounded-xl bg-[#8fb39a]/15 border border-[#8fb39a]/30 flex items-start gap-2.5 text-[#8fb39a] text-xs">
            <CheckCircle2 className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="min-w-0 flex-1 leading-relaxed">{successMessage}</span>
          </div>
        )}

        {/* STAGE 1: Request Email Form */}
        {stage === 'form' && (
          <form onSubmit={handleRequestSubmit} noValidate className="space-y-4">
            <div>
              <label
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'
                }`}
              >
                Registered Admin Email
              </label>
              <div className="relative">
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  placeholder="Enter the email"
                  autoComplete="email"
                  className={`w-full h-12 px-4 rounded-xl border text-sm outline-none focus:border-[#c9b27c] transition-colors font-mono ${
                    isDark
                      ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                      : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                  }`}
                />
                <div className="absolute right-3.5 top-3.5 text-[#8a8a93]">
                  <Mail className="w-4 h-4" />
                </div>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full h-12 mt-2 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 font-bold text-sm shadow-md shadow-[#c9b27c]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Submitting Request...</span>
                </>
              ) : (
                <>
                  <ShieldAlert className="w-4 h-4" />
                  <span>Send Reset Request</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STAGE 2: Pending Approval View */}
        {stage === 'pending' && (
          <div className="space-y-5">
            <div
              className={`p-4 rounded-2xl border space-y-3 ${
                isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
              }`}
            >
              <div className="flex items-center justify-between pb-2 border-b border-[#26262b]/30 text-xs">
                <span className={isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}>Admin Account</span>
                <span className={`font-mono font-bold ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                  {activeRequest?.requestingAdminUsername}
                </span>
              </div>
              <div className="flex items-center justify-between pb-2 border-b border-[#26262b]/30 text-xs">
                <span className={isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}>Registered Email</span>
                <span className={`font-mono ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                  {activeRequest?.requestingAdminEmail}
                </span>
              </div>
              <div className="flex items-center justify-between text-xs">
                <span className={isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}>Approval Status</span>
                <span className="flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#d4a359]/20 text-[#d4a359] border border-[#d4a359]/30">
                  <span className="w-2 h-2 rounded-full bg-[#d4a359] animate-ping" />
                  Pending Review
                </span>
              </div>
            </div>

            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => checkStatus(true)}
                disabled={isCheckingStatus}
                className="flex-1 h-11 rounded-xl border border-[#c9b27c]/40 bg-[#c9b27c]/10 hover:bg-[#c9b27c]/20 text-[#c9b27c] font-bold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
              >
                {isCheckingStatus ? (
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                ) : (
                  <RotateCw className="w-3.5 h-3.5" />
                )}
                <span>Check Status Now</span>
              </button>

              <button
                type="button"
                onClick={() => setCurrentScreen('login')}
                className={`h-11 px-4 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#26262b] bg-[#17171a] text-[#8a8a93] hover:text-[#e8e8ea]'
                    : 'border-[#e5e3dc] bg-white text-[#71717a] hover:text-[#18181b]'
                }`}
              >
                Back to Login
              </button>
            </div>
          </div>
        )}

        {/* STAGE 3: Approved -> Reset Password Form */}
        {stage === 'approved' && (
          <form onSubmit={handleResetSubmit} noValidate className="space-y-4">
            <div>
              <label
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'
                }`}
              >
                New Password
              </label>
              <div className="relative">
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={newPassword}
                  onChange={(e) => setNewPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Min. 8 chars, 1 uppercase, 1 number"
                  className={`w-full h-12 px-4 rounded-xl border text-sm outline-none focus:border-[#c9b27c] transition-colors ${
                    isDark
                      ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                      : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className={`absolute right-3.5 top-3.5 cursor-pointer ${
                    isDark ? 'text-[#8a8a93] hover:text-[#e8e8ea]' : 'text-[#71717a] hover:text-[#18181b]'
                  }`}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            <div>
              <label
                className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
                  isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'
                }`}
              >
                Confirm New Password
              </label>
              <div className="relative">
                <input
                  type={showConfirmPassword ? 'text' : 'password'}
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  autoComplete="new-password"
                  placeholder="Confirm new password"
                  className={`w-full h-12 px-4 rounded-xl border text-sm outline-none focus:border-[#c9b27c] transition-colors ${
                    isDark
                      ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                      : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                  }`}
                />
                <button
                  type="button"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                  className={`absolute right-3.5 top-3.5 cursor-pointer ${
                    isDark ? 'text-[#8a8a93] hover:text-[#e8e8ea]' : 'text-[#71717a] hover:text-[#18181b]'
                  }`}
                  aria-label={showConfirmPassword ? 'Hide password' : 'Show password'}
                >
                  {showConfirmPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                </button>
              </div>
            </div>

            {/* Validation checklist */}
            <div className="space-y-1.5 pt-1 text-xs">
              <div
                className={`flex items-center gap-2 ${
                  hasLength ? 'text-[#8fb39a]' : isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'
                }`}
              >
                <div className={`w-1.5 h-1.5 rounded-full ${hasLength ? 'bg-[#8fb39a]' : 'bg-[#8a8a93]'}`} />
                <span>At least 8 characters</span>
              </div>
              <div
                className={`flex items-center gap-2 ${
                  hasUpperNumber ? 'text-[#8fb39a]' : isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${hasUpperNumber ? 'bg-[#8fb39a]' : 'bg-[#8a8a93]'}`}
                />
                <span>Includes uppercase letter & number</span>
              </div>
              <div
                className={`flex items-center gap-2 ${
                  passwordsMatch ? 'text-[#8fb39a]' : isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'
                }`}
              >
                <div
                  className={`w-1.5 h-1.5 rounded-full ${passwordsMatch ? 'bg-[#8fb39a]' : 'bg-[#8a8a93]'}`}
                />
                <span>Passwords match</span>
              </div>
            </div>

            <button
              type="submit"
              disabled={isSubmitting || !hasLength || !hasUpperNumber || !passwordsMatch}
              className="w-full h-12 mt-4 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 font-bold text-sm shadow-md shadow-[#c9b27c]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  <span>Updating Password...</span>
                </>
              ) : (
                <>
                  <ShieldCheck className="w-4 h-4" />
                  <span>Update Password & Log In</span>
                </>
              )}
            </button>
          </form>
        )}

        {/* STAGE 4: Rejected / Declined */}
        {stage === 'rejected' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-[#d97070]/30 bg-[#d97070]/10 text-center space-y-2">
              <XCircle className="w-10 h-10 text-[#d97070] mx-auto opacity-80" />
              <p className="text-xs text-[#d97070] font-semibold">
                Your password change request has been declined by the other administrator.
              </p>
              <p className={`text-[11px] ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                For security reasons, password reset authorizations are strictly forbidden once declined.
              </p>
            </div>

            <div className="flex items-center gap-3 pt-2">
              <button
                type="button"
                onClick={handleRestart}
                className="flex-1 h-11 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
              >
                Submit New Request
              </button>
              <button
                type="button"
                onClick={() => setCurrentScreen('login')}
                className={`h-11 px-4 rounded-xl border text-xs font-semibold transition-colors cursor-pointer ${
                  isDark
                    ? 'border-[#26262b] bg-[#17171a] text-[#8a8a93] hover:text-[#e8e8ea]'
                    : 'border-[#e5e3dc] bg-white text-[#71717a] hover:text-[#18181b]'
                }`}
              >
                Back to Login
              </button>
            </div>
          </div>
        )}

        {/* STAGE 5: Expired */}
        {stage === 'expired' && (
          <div className="space-y-4">
            <div className="p-4 rounded-2xl border border-[#d4a359]/30 bg-[#d4a359]/10 text-center space-y-2">
              <Clock className="w-10 h-10 text-[#d4a359] mx-auto opacity-80" />
              <p className="text-xs text-[#d4a359] font-semibold">
                Your password reset request has expired.
              </p>
              <p className={`text-[11px] ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                Password reset approval windows are time-limited to protect administrator accounts.
              </p>
            </div>

            <button
              type="button"
              onClick={handleRestart}
              className="w-full h-11 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
            >
              Submit New Request
            </button>
          </div>
        )}

        {/* STAGE 6: Completed */}
        {stage === 'completed' && (
          <div className="space-y-4 text-center py-4">
            <CheckCircle2 className="w-12 h-12 text-[#8fb39a] mx-auto" />
            <p className={`text-sm font-bold ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
              Password Successfully Changed
            </p>
            <p className={`text-xs ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Redirecting you to the login screen...
            </p>
            <button
              type="button"
              onClick={() => setCurrentScreen('login')}
              className="w-full h-11 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 font-bold text-xs flex items-center justify-center transition-all cursor-pointer"
            >
              Log In Now
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
