import { useState } from 'react';
import { ArrowLeft, Lock, CheckCircle2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';

export default function Screen8ChangePassword({ customTheme = null, onNavigate }) {
  const { navigateTo } = useFinance();
  const { isDark: globalDark } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  const [currentPassword, setCurrentPassword] = useState('currentpass123');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [success, setSuccess] = useState(false);

  const handleNav = (screen) => {
    if (onNavigate) {
      onNavigate(screen);
    } else {
      navigateTo(screen);
    }
  };

  const hasLength = newPassword.length >= 8;
  const hasUpperNumber = /[A-Z]/.test(newPassword) && /[0-9]/.test(newPassword);
  const passwordsMatch = newPassword.length > 0 && newPassword === confirmPassword;

  const handleSubmit = (e) => {
    e.preventDefault();
    setSuccess(true);
    setTimeout(() => {
      handleNav('profile');
    }, 1000);
  };

  return (
    <div className="flex-1 px-6 flex flex-col justify-center">
      <button
        type="button"
        onClick={() => handleNav('profile')}
        className={`w-9 h-9 -ml-1 rounded-xl border flex items-center justify-center mb-6 transition-colors cursor-pointer ${
          isDark
            ? 'bg-[#17171a] border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea]'
            : 'bg-white border-[#e5e3dc] text-[#71717a] hover:text-[#18181b]'
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

      <form onSubmit={handleSubmit} className="space-y-3.5">
        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Current Password
          </label>
          <input
            type="password"
            value={currentPassword}
            onChange={(e) => setCurrentPassword(e.target.value)}
            className={`w-full h-11 px-4 rounded-xl border text-xs focus:outline-none focus:border-[#c9b27c] transition-colors ${
              isDark ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]' : 'bg-white border-[#e5e3dc] text-[#18181b]'
            }`}
          />
        </div>

        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            New Password
          </label>
          <input
            type="password"
            value={newPassword}
            onChange={(e) => setNewPassword(e.target.value)}
            placeholder="At least 8 characters"
            className={`w-full h-11 px-4 rounded-xl border text-xs focus:outline-none focus:border-[#c9b27c] transition-colors ${
              isDark ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]' : 'bg-white border-[#e5e3dc] text-[#18181b]'
            }`}
          />
        </div>

        <div>
          <label className={`block text-xs font-semibold uppercase tracking-wider mb-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Confirm New Password
          </label>
          <input
            type="password"
            value={confirmPassword}
            onChange={(e) => setConfirmPassword(e.target.value)}
            placeholder="Re-type new password"
            className={`w-full h-11 px-4 rounded-xl border text-xs focus:outline-none focus:border-[#c9b27c] transition-colors ${
              isDark ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]' : 'bg-white border-[#e5e3dc] text-[#18181b]'
            }`}
          />
        </div>

        {/* Security Checklist */}
        <div className="pt-1 pb-1 space-y-1.5">
          <div className="flex items-center gap-2 text-[11px]">
            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasLength ? 'bg-[#8fb39a] text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-400'}`}>
              ✓
            </span>
            <span className={hasLength ? 'text-[#8fb39a]' : isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}>
              At least 8 characters
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${hasUpperNumber ? 'bg-[#8fb39a] text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-400'}`}>
              ✓
            </span>
            <span className={hasUpperNumber ? 'text-[#8fb39a]' : isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}>
              Contains uppercase & number
            </span>
          </div>
          <div className="flex items-center gap-2 text-[11px]">
            <span className={`w-3.5 h-3.5 rounded-full flex items-center justify-center text-[9px] ${passwordsMatch ? 'bg-[#8fb39a] text-neutral-950 font-bold' : 'bg-neutral-800 text-neutral-400'}`}>
              ✓
            </span>
            <span className={passwordsMatch ? 'text-[#8fb39a]' : isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}>
              Passwords match
            </span>
          </div>
        </div>

        <button
          type="submit"
          className="w-full h-12 mt-3 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 font-bold text-sm shadow-md shadow-[#c9b27c]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          {success ? (
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
  );
}
