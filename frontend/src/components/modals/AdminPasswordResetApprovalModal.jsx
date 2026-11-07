import { useState } from 'react';
import {
  ShieldAlert,
  UserCheck,
  UserX,
  X,
  Loader2,
  CheckCircle2,
  AlertCircle,
  Calendar,
  Mail,
  User,
  Clock,
} from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';

export default function AdminPasswordResetApprovalModal({
  isOpen,
  onClose,
  request: directRequest = null,
}) {
  const {
    pendingAdminRequests,
    selectedResetRequest,
    setSelectedResetRequest,
    approveAdminResetRequest,
    rejectAdminResetRequest,
  } = useFinance();
  const { isDark } = useTheme();

  const [isProcessing, setIsProcessing] = useState(false);
  const [feedback, setFeedback] = useState(null); // { type: 'success' | 'error', message: string }

  if (!isOpen) return null;

  // Determine active request to review
  const activeRequest = directRequest || selectedResetRequest || pendingAdminRequests[0] || null;

  const handleApprove = async () => {
    if (!activeRequest) return;
    setIsProcessing(true);
    setFeedback(null);

    const targetId = activeRequest.id || activeRequest._id;
    const res = await approveAdminResetRequest(targetId);
    setIsProcessing(false);

    if (res?.success) {
      setFeedback({
        type: 'success',
        message: 'Password reset request approved successfully.',
      });
      setTimeout(() => {
        setFeedback(null);
        setSelectedResetRequest(null);
        onClose();
      }, 1600);
    } else {
      setFeedback({
        type: 'error',
        message: res?.message || 'Failed to approve reset request.',
      });
    }
  };

  const handleReject = async () => {
    if (!activeRequest) return;
    setIsProcessing(true);
    setFeedback(null);

    const targetId = activeRequest.id || activeRequest._id;
    const res = await rejectAdminResetRequest(targetId);
    setIsProcessing(false);

    if (res?.success) {
      setFeedback({
        type: 'success',
        message: 'Password reset request rejected.',
      });
      setTimeout(() => {
        setFeedback(null);
        setSelectedResetRequest(null);
        onClose();
      }, 1600);
    } else {
      setFeedback({
        type: 'error',
        message: res?.message || 'Failed to reject reset request.',
      });
    }
  };

  const formattedDate = activeRequest?.createdAt
    ? new Date(activeRequest.createdAt).toLocaleString('en-US', {
        dateStyle: 'medium',
        timeStyle: 'short',
      })
    : 'Just now';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-200">
      <div
        className={`w-full max-w-lg rounded-3xl border shadow-2xl overflow-hidden transition-all duration-200 ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        {/* Header */}
        <div
          className={`px-6 py-5 border-b flex items-center justify-between ${
            isDark ? 'border-[#26262b] bg-[#1a1a1e]' : 'border-[#e5e3dc] bg-[#f9f8f5]'
          }`}
        >
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-[#c9b27c]/15 text-[#c9b27c] flex items-center justify-center">
              <ShieldAlert className="w-5 h-5" />
            </div>
            <div>
              <h3 className={`text-base font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                Password Reset Request
              </h3>
              <p className={`text-xs ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                Two-Admin Approval Authorization Vault
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className={`w-8 h-8 rounded-xl flex items-center justify-center transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#26262b] text-[#8a8a93]' : 'hover:bg-[#e5e3dc] text-[#71717a]'
            }`}
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Content Body */}
        <div className="p-6 space-y-5">
          {feedback && (
            <div
              className={`p-3.5 rounded-xl border flex items-center gap-2.5 text-xs ${
                feedback.type === 'success'
                  ? 'bg-[#8fb39a]/15 border-[#8fb39a]/30 text-[#8fb39a]'
                  : 'bg-[#d97070]/15 border-[#d97070]/30 text-[#d97070]'
              }`}
            >
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 shrink-0" />
              ) : (
                <AlertCircle className="w-4 h-4 shrink-0" />
              )}
              <span className="font-medium">{feedback.message}</span>
            </div>
          )}

          {!activeRequest ? (
            <div className="py-8 text-center space-y-2">
              <CheckCircle2 className="w-10 h-10 text-[#8fb39a] mx-auto opacity-70" />
              <p className={`text-sm font-semibold ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                No Pending Password Reset Requests
              </p>
              <p className={`text-xs ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                All administrator accounts are secure and synchronized.
              </p>
            </div>
          ) : (
            <>
              <p className={`text-xs leading-relaxed ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                Another administrator has requested permission to reset their account password.
                Please review their credentials and confirm or decline the authorization below.
              </p>

              {/* Information Display Card */}
              <div
                className={`p-4 rounded-2xl border space-y-3 ${
                  isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
                }`}
              >
                <div className="flex items-center justify-between pb-2.5 border-b border-[#26262b]/30">
                  <span className={`text-xs flex items-center gap-2 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                    <User className="w-3.5 h-3.5 text-[#c9b27c]" />
                    Requesting Admin Name
                  </span>
                  <span className={`text-xs font-bold font-mono ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                    {activeRequest.requestingAdminUsername}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2.5 border-b border-[#26262b]/30">
                  <span className={`text-xs flex items-center gap-2 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                    <Mail className="w-3.5 h-3.5 text-[#c9b27c]" />
                    Registered Email
                  </span>
                  <span className={`text-xs font-medium font-mono ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                    {activeRequest.requestingAdminEmail}
                  </span>
                </div>

                <div className="flex items-center justify-between pb-2.5 border-b border-[#26262b]/30">
                  <span className={`text-xs flex items-center gap-2 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                    <Calendar className="w-3.5 h-3.5 text-[#c9b27c]" />
                    Request Date & Time
                  </span>
                  <span className={`text-xs font-medium ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                    {formattedDate}
                  </span>
                </div>

                <div className="flex items-center justify-between pt-0.5">
                  <span className={`text-xs flex items-center gap-2 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                    <Clock className="w-3.5 h-3.5 text-[#d4a359]" />
                    Current Request Status
                  </span>
                  <span className="px-2 py-0.5 rounded-full text-[11px] font-bold uppercase tracking-wider bg-[#d4a359]/20 text-[#d4a359] border border-[#d4a359]/30">
                    Pending
                  </span>
                </div>
              </div>

              {/* Action Buttons */}
              <div className="pt-2 flex flex-col sm:flex-row items-center gap-3">
                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleReject}
                  className="w-full sm:flex-1 h-11 rounded-xl border border-[#d97070]/40 bg-[#d97070]/10 hover:bg-[#d97070]/20 text-[#d97070] font-semibold text-xs flex items-center justify-center gap-2 transition-colors cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <UserX className="w-4 h-4" />
                      <span>Reject Request</span>
                    </>
                  )}
                </button>

                <button
                  type="button"
                  disabled={isProcessing}
                  onClick={handleApprove}
                  className="w-full sm:flex-1 h-11 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 font-bold text-xs shadow-md shadow-[#c9b27c]/20 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
                >
                  {isProcessing ? (
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  ) : (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Approve Request</span>
                    </>
                  )}
                </button>
              </div>
            </>
          )}
        </div>
      </div>
    </div>
  );
}

