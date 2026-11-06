import { useState } from 'react';
import { ArrowLeft, Lock, CheckCircle2, AlertCircle, Loader2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function ChangePasswordPage() {
  const { setCurrentScreen } = useFinance();
  const { isDark } = useTheme();

  const [currentPassword, setCurrentPassword] = useState('password123');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');
  const [loading, setLoading] = useState(false);

  const hasLength = newPassword.length >= 8;
  const hasUpperNumber = /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!passwordsMatch) return;
    setErrorMsg('');
    setLoading(true);

    try {
      await api.auth.changePassword({ currentPassword, newPassword });
      setSuccess(true);
      setTimeout(() => {
        setCurrentScreen('profile');
      }, 1000);
    } catch (err) {
      setErrorMsg(err.message || 'Failed to update password');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div
        className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl transition-colors ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        <button
          type="button"
          onClick={() => setCurrentScreen('profile')}
          className={`w-9 h-9 rounded-xl border flex items-center justify-center mb-6 transition-colors cursor-pointer ${
            isDark
              ? 'bg-[#0e0e10] border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea]'
              : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#71717a] hover:text-[#18181b]'
          }`}
        >
          <ArrowLeft className="w-4 h-4" />
        </button>

        <div className="mb-6">
          <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            Change Password
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Keep your multi-user account secure.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#d97070]/10 border border-[#d97070]/30 flex items-center gap-2 text-[#d97070] text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Current Password
            </label>
            <input
              type="password"
              value={currentPassword}
              onChange={(e) => setCurrentPassword(e.target.value)}
              className={`w-full h-12 px-4 rounded-xl border text-sm outline-none focus:border-[#c9b27c] transition-colors ${
                isDark
                  ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                  : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
              }`}
              placeholder="••••••••"
              required
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              New Password
            </label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className={`w-full h-12 px-4 rounded-xl border text-sm outline-none focus:border-[#c9b27c] transition-colors ${
                isDark
                  ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                  : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
              }`}
              placeholder="Min. 8 chars, 1 uppercase, 1 number"
              required
            />
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Confirm New Password
            </label>
            <input
              type="password"
              value={confirmPassword}
              onChange={(e) => setConfirmPassword(e.target.value)}
              className={`w-full h-12 px-4 rounded-xl border text-sm outline-none focus:border-[#c9b27c] transition-colors ${
                isDark
                  ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                  : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
              }`}
              placeholder="Re-enter new password"
              required
            />
          </div>

          {/* Validation Checklist */}
          <div className="space-y-1.5 pt-2 text-xs">
            <div className={`flex items-center gap-2 ${hasLength ? 'text-[#8fb39a]' : isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${hasLength ? 'bg-[#8fb39a]' : 'bg-[#8a8a93]'}`} />
              <span>At least 8 characters</span>
            </div>
            <div className={`flex items-center gap-2 ${hasUpperNumber ? 'text-[#8fb39a]' : isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${hasUpperNumber ? 'bg-[#8fb39a]' : 'bg-[#8a8a93]'}`} />
              <span>Includes uppercase letter & number</span>
            </div>
            <div className={`flex items-center gap-2 ${passwordsMatch ? 'text-[#8fb39a]' : isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              <div className={`w-1.5 h-1.5 rounded-full ${passwordsMatch ? 'bg-[#8fb39a]' : 'bg-[#8a8a93]'}`} />
              <span>Passwords match</span>
            </div>
          </div>

          <button
            type="submit"
            disabled={!passwordsMatch || !hasLength || !hasUpperNumber || loading}
            className={`w-full h-12 mt-4 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              success
                ? 'bg-[#8fb39a] text-neutral-950'
                : 'bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 shadow-[#c9b27c]/20'
            } disabled:opacity-50 disabled:cursor-not-allowed`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Updating...</span>
              </>
            ) : success ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Password Updated!</span>
              </>
            ) : (
              <>
                <Lock className="w-4 h-4" />
                <span>Update Password</span>
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
