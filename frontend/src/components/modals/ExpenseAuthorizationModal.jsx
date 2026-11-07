import { useState } from 'react';
import { ShieldAlert, Lock, KeyRound, Eye, EyeOff, Loader2, AlertCircle, X } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { formatCurrency } from '../../data/financeData';

export default function ExpenseAuthorizationModal({
  isOpen,
  onClose,
  amount,
  onAuthorized,
}) {
  const { isAccessCodeEnabled, authorizeExpense, currentUser } = useFinance();
  const { isDark } = useTheme();

  const [credential, setCredential] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [isVerifying, setIsVerifying] = useState(false);
  const [errorMsg, setErrorMsg] = useState('');

  if (!isOpen) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = credential.trim();

    if (!trimmed) {
      setErrorMsg(
        isAccessCodeEnabled
          ? 'Please enter your 4-digit access code.'
          : 'Please enter your account password.'
      );
      return;
    }

    if (isAccessCodeEnabled && !/^\d{4}$/.test(trimmed)) {
      setErrorMsg('Access code must be a 4-digit number.');
      return;
    }

    setErrorMsg('');
    setIsVerifying(true);

    try {
      const res = await authorizeExpense({
        amount,
        credential: trimmed,
        credentialType: isAccessCodeEnabled ? 'accessCode' : 'password',
        user: currentUser?.username || '',
      });

      if (res?.success && res.authorizationToken) {
        setCredential('');
        onAuthorized(res.authorizationToken);
      } else {
        setCredential('');
        setErrorMsg(res?.message || 'Verification failed. Please check your credentials.');
      }
    } catch (err) {
      setCredential('');
      setErrorMsg(err.message || 'Authorization failed. Please try again.');
    } finally {
      setIsVerifying(false);
    }
  };

  const handleCancel = () => {
    if (isVerifying) return;
    setCredential('');
    setErrorMsg('');
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 transition-all">
      <div
        className={`w-full max-w-md rounded-2xl p-5 sm:p-6 border shadow-2xl transition-colors overflow-hidden min-w-0 break-words ${
          isDark
            ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]'
            : 'bg-white border-[#e5e3dc] text-[#18181b]'
        }`}
      >
        {/* Header with Title & Dismiss */}
        <div className="flex items-start justify-between gap-3 mb-4 min-w-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-[#d4a359]/15 text-[#d4a359] border border-[#d4a359]/30 flex items-center justify-center font-bold shrink-0 shadow-sm">
              <ShieldAlert className="w-5 h-5 stroke-[2.2]" />
            </div>
            <div className="min-w-0">
              <h3 className={`text-base font-bold tracking-tight truncate ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
                Expense Authorization Required
              </h3>
              <p className={`text-xs ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                Amount exceeds ₹7,000 threshold
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={handleCancel}
            disabled={isVerifying}
            className="p-1 rounded-lg text-[#8a8a93] hover:text-white cursor-pointer disabled:opacity-30 disabled:cursor-not-allowed shrink-0"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Amount Display with overflow-wrap protection */}
        <div
          className={`p-3.5 rounded-xl border text-center mb-4 transition-colors overflow-hidden min-w-0 ${
            isDark ? 'bg-[#0e0e10] border-[#26262b]' : 'bg-[#f6f5f2] border-[#e5e3dc]'
          }`}
        >
          <span className={`block text-[10px] font-semibold uppercase tracking-wider ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Amount to Authorize
          </span>
          <div className="text-xl sm:text-2xl font-black font-mono text-[#c9b27c] mt-0.5 break-all max-w-full">
            {formatCurrency(amount)}
          </div>
          <p className={`text-[11px] mt-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Expenses above ₹7,000 require additional verification. Please verify your authorization to continue.
          </p>
        </div>

        {/* Error alert message */}
        {errorMsg && (
          <div className="mb-4 p-3 rounded-xl bg-[#d97070]/10 border border-[#d97070]/30 flex items-start gap-2.5 text-[#d97070] text-xs animate-fadeIn min-w-0 break-words">
            <AlertCircle className="w-4 h-4 shrink-0 mt-0.5" />
            <span className="flex-1">{errorMsg}</span>
          </div>
        )}

        {/* Verification Form (JavaScript Validation, noValidate) */}
        <form onSubmit={handleSubmit} noValidate className="space-y-4">
          <div>
            <div className="flex items-center justify-between mb-1.5 min-w-0">
              <label className={`block text-xs font-semibold uppercase tracking-wider truncate ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                {isAccessCodeEnabled ? '4-Digit Access Code' : 'Account Password'}
              </label>
              <span className="text-[10px] text-[#c9b27c] font-mono font-semibold shrink-0">
                {isAccessCodeEnabled ? 'PIN Security' : 'Password Fallback'}
              </span>
            </div>

            <div className="relative min-w-0">
              {isAccessCodeEnabled ? (
                <>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={credential}
                    onChange={(e) => {
                      setCredential(e.target.value.replace(/\D/g, '').slice(0, 4));
                      if (errorMsg) setErrorMsg('');
                    }}
                    maxLength={4}
                    inputMode="numeric"
                    autoFocus
                    placeholder="••••"
                    disabled={isVerifying}
                    className={`w-full h-11 px-4 text-center tracking-[0.4em] text-lg font-mono rounded-xl border outline-none focus:border-[#c9b27c] transition-colors ${
                      isDark
                        ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                        : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                    }`}
                  />
                  <KeyRound className="w-4 h-4 text-[#8a8a93] absolute left-3.5 top-3.5 pointer-events-none" />
                </>
              ) : (
                <>
                  <input
                    type={showPassword ? 'text' : 'password'}
                    value={credential}
                    onChange={(e) => {
                      setCredential(e.target.value);
                      if (errorMsg) setErrorMsg('');
                    }}
                    autoFocus
                    placeholder="Enter your account password"
                    disabled={isVerifying}
                    className={`w-full h-11 pl-10 pr-10 text-xs sm:text-sm rounded-xl border outline-none focus:border-[#c9b27c] transition-colors ${
                      isDark
                        ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                        : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                    }`}
                  />
                  <Lock className="w-4 h-4 text-[#8a8a93] absolute left-3.5 top-3.5 pointer-events-none" />
                </>
              )}

              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                disabled={isVerifying}
                className={`absolute right-3.5 top-3.5 cursor-pointer disabled:opacity-40 ${
                  isDark ? 'text-[#8a8a93] hover:text-[#e8e8ea]' : 'text-[#71717a] hover:text-[#18181b]'
                }`}
                title={showPassword ? 'Hide' : 'Show'}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <p className={`text-[10px] mt-1.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              {isAccessCodeEnabled
                ? 'Enter your 4-digit security access code configured in your admin profile.'
                : 'Access code is not enabled. Verify with your admin account password.'}
            </p>
          </div>

          <div className="flex items-center gap-2 pt-2">
            <button
              type="button"
              onClick={handleCancel}
              disabled={isVerifying}
              className={`flex-1 h-10 rounded-xl border text-xs font-semibold transition-colors cursor-pointer disabled:opacity-50 ${
                isDark
                  ? 'border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea] hover:bg-[#202024]'
                  : 'border-[#e5e3dc] text-[#71717a] hover:text-[#18181b] hover:bg-[#f6f5f2]'
              }`}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isVerifying || !credential.trim()}
              className="flex-1 h-10 rounded-xl bg-gradient-to-tr from-[#c9b27c] to-[#a68d55] text-neutral-950 font-bold text-xs shadow-md shadow-[#c9b27c]/20 hover:scale-[1.01] active:scale-[0.99] transition-all flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isVerifying ? (
                <>
                  <Loader2 className="w-3.5 h-3.5 animate-spin" />
                  <span>Verifying...</span>
                </>
              ) : (
                <span>Verify & Authorize</span>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

