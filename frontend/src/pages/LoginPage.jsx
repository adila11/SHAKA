import { useState } from 'react';
import { User, Eye, EyeOff, ArrowRight, Loader2, AlertCircle } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';

export default function LoginPage() {
  const { login, setCurrentScreen, sessionExpiryNotice } = useFinance();
  const { isDark } = useTheme();

  const [username, setUsername] = useState('abdulshamil');
  const [password, setPassword] = useState('Abdul@3621');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState('');

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setIsSubmitting(true);

    try {
      const res = await login(username, password);
      if (!res.success) {
        setErrorMessage(res.message || 'Invalid username or password');
      }
    } catch (err) {
      setErrorMessage(err.message || 'Connection error. Please check backend server.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-[75vh] flex items-center justify-center py-10 px-4">
      <div
        className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl transition-colors ${
          isDark ? 'bg-[#17171a] border-[#26262b]' : 'bg-white border-[#e5e3dc]'
        }`}
      >
        {/* Brand Monogram */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-[#c9b27c] to-[#917d50] flex items-center justify-center font-black text-neutral-950 text-2xl mx-auto mb-4 shadow-lg shadow-[#c9b27c]/25 select-none">
            S
          </div>
          <h2 className={`text-2xl font-extrabold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            SHAKA
          </h2>
          <p className={`text-xs mt-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Multi-User Shared Personal Finance Tracker
          </p>
        </div>

        {sessionExpiryNotice && (
          <div className="mb-4 p-3 rounded-xl bg-[#d4a359]/15 border border-[#d4a359]/30 flex items-center gap-2 text-[#d4a359] text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{sessionExpiryNotice}</span>
          </div>
        )}

        {errorMessage && (
          <div className="mb-4 p-3 rounded-xl bg-[#d97070]/10 border border-[#d97070]/30 flex items-center gap-2 text-[#d97070] text-xs">
            <AlertCircle className="w-4 h-4 shrink-0" />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Login Form */}
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Username
            </label>
            <div className="relative">
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                required
                className={`w-full h-12 px-4 rounded-xl border text-sm outline-none focus:border-[#c9b27c] transition-colors ${
                  isDark
                    ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                    : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                }`}
                placeholder="Enter username"
              />
              <div className="absolute right-3.5 top-3.5 text-[#8a8a93]">
                <User className="w-4 h-4" />
              </div>
            </div>
          </div>

          <div>
            <label className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              Password
            </label>
            <div className="relative">
              <input
                type={showPassword ? 'text' : 'password'}
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                className={`w-full h-12 px-4 rounded-xl border text-sm outline-none focus:border-[#c9b27c] transition-colors ${
                  isDark
                    ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                    : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                }`}
                placeholder="Enter password"
              />
              <button
                type="button"
                onClick={() => setShowPassword(!showPassword)}
                className={`absolute right-3.5 top-3.5 cursor-pointer ${
                  isDark ? 'text-[#8a8a93] hover:text-[#e8e8ea]' : 'text-[#71717a] hover:text-[#18181b]'
                }`}
              >
                {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <div className="flex items-center justify-between text-xs pt-1">
            <label className={`flex items-center gap-2 cursor-pointer ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(e) => setRememberMe(e.target.checked)}
                className="w-4 h-4 rounded border-[#26262b] bg-[#17171a] text-[#c9b27c] focus:ring-0 accent-[#c9b27c]"
              />
              <span>Remember me</span>
            </label>
            <button
              type="button"
              onClick={() => setCurrentScreen('forgot')}
              className="text-[#c9b27c] hover:underline font-semibold cursor-pointer"
            >
              Forgot password?
            </button>
          </div>

          <button
            type="submit"
            disabled={isSubmitting}
            className="w-full h-12 mt-4 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 font-bold text-sm shadow-md shadow-[#c9b27c]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99] disabled:opacity-60"
          >
            {isSubmitting ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              <>
                <span>Log In</span>
                <ArrowRight className="w-4 h-4" />
              </>
            )}
          </button>
        </form>

        <div className="mt-6 pt-5 border-t border-[#26262b]/60 text-center">
          <p className="text-xs text-[#8a8a93] mb-2.5">
            Quick fill configured account:
          </p>
          <div className="flex items-center justify-center gap-2">
            <button
              type="button"
              onClick={() => {
                setUsername('abdulshamil');
                setPassword('Abdul@3621');
              }}
              className="px-3 py-1.5 rounded-lg border border-[#c9b27c]/40 text-[#c9b27c] text-xs font-mono font-semibold hover:bg-[#c9b27c]/10 transition-colors cursor-pointer"
            >
              abdulshamil
            </button>
            <button
              type="button"
              onClick={() => {
                setUsername('adilaka');
                setPassword('Adi;a@3621');
              }}
              className="px-3 py-1.5 rounded-lg border border-[#c9b27c]/40 text-[#c9b27c] text-xs font-mono font-semibold hover:bg-[#c9b27c]/10 transition-colors cursor-pointer"
            >
              adilaka
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
