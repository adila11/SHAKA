import { useState } from 'react';
import { ShieldCheck, Eye, EyeOff, Loader2, AlertCircle, LogOut } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';

export default function AccessCodePromptModal() {
  const { isAccessCodeModalOpen, setIsAccessCodeModalOpen, verifyAccessCode, logout } = useFinance();
  const { isDark } = useTheme();

  const [code, setCode] = useState('');
  const [showCode, setShowCode] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isAccessCodeModalOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = code.trim();
    if (!trimmed) {
      setErrorMsg('Please enter your 4-digit access code.');
      return;
    }
    if (!/^\d{4}$/.test(trimmed)) {
      setErrorMsg('Access code must be exactly 4 digits.');
      return;
    }

    setErrorMsg('');
    setIsSubmitting(true);

    try {
      const res = await verifyAccessCode(code.trim());
      if (!res.success) {
        setErrorMsg(res.message || 'Invalid access code. Please try again.');
      } else {
        setCode('');
      }
    } catch (err) {
      setErrorMsg(err.message || 'Verification error occurred.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogout = () => {
    setIsAccessCodeModalOpen(false);
    logout();
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md transition-all"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
      }}
    >
      <div
        className={`w-full max-w-md rounded-3xl p-6 sm:p-7 border shadow-2xl transition-colors min-w-0 max-w-full break-words overflow-hidden ${
          isDark
            ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]'
            : 'bg-white border-[#e5e3dc] text-[#18181b]'
        }`}
      >
        <div className="text-center mb-6">
          <div className="w-14 h-14 rounded-2xl bg-gradient-to-tr from-[#c9b27c] to-[#917d50] text-neutral-950 flex items-center justify-center mx-auto mb-3 shadow-lg shadow-[#c9b27c]/20">
            <ShieldCheck className="w-7 h-7 stroke-[2.5]" />
          </div>
          <h3 className={`text-xl font-extrabold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            Access Code Required
          </h3>
          <p className={`text-xs mt-1.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Enter your secure access code to verify and continue.
          </p>
        </div>

        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#d97070]/10 border border-[#d97070]/30 flex items-start gap-2.5 text-[#d97070] text-xs">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span>{errorMsg}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Enter 4-Digit Access Code
            </label>
            <div className="relative">
              <input
                type={showCode ? 'text' : 'password'}
                value={code}
                onChange={(e) => {
                  setCode(e.target.value.replace(/\D/g, '').slice(0, 4));
                  if (errorMsg) setErrorMsg('');
                }}
                maxLength={4}
                inputMode="numeric"
                autoFocus
                placeholder="••••"
                className={`w-full h-12 px-4 text-center tracking-[0.4em] text-xl font-mono rounded-xl border outline-none focus:border-[#c9b27c] transition-colors ${
                  isDark
                    ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                    : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                }`}
              />
              <button
                type="button"
                onClick={() => setShowCode(!showCode)}
                className={`absolute right-3.5 top-3.5 cursor-pointer ${
                  isDark ? 'text-[#8a8a93] hover:text-[#e8e8ea]' : 'text-[#71717a] hover:text-[#18181b]'
                }`}
              >
                {showCode ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 rounded-xl bg-gradient-to-tr from-[#c9b27c] to-[#a68d55] text-neutral-950 font-bold text-sm shadow-md shadow-[#c9b27c]/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-2 cursor-pointer disabled:opacity-50"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Verifying Code...</span>
              </>
            ) : (
              <span>Verify & Continue Session</span>
            )}
          </button>
        </form>

        <div className="mt-5 pt-4 border-t border-[#26262b]/50 text-center">
          <button
            type="button"
            onClick={handleLogout}
            className={`text-xs font-semibold flex items-center justify-center gap-1.5 mx-auto hover:underline cursor-pointer ${
              isDark ? 'text-[#8a8a93] hover:text-[#e8e8ea]' : 'text-[#71717a] hover:text-[#18181b]'
            }`}
          >
            <LogOut className="w-3.5 h-3.5" />
            <span>Log in with account password instead</span>
          </button>
        </div>
      </div>
    </div>
  );
}

