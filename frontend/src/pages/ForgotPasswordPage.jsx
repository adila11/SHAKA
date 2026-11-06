import { useState } from 'react';
import { ArrowLeft, Mail, Send, CheckCircle2, Loader2 } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';
import { api } from '../services/api';

export default function ForgotPasswordPage() {
  const { setCurrentScreen } = useFinance();
  const { isDark } = useTheme();

  const [username, setUsername] = useState('alex_rivera');
  const [submitted, setSubmitted] = useState(false);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      await api.auth.forgotPassword(username);
    } catch {
      // Continue flow even if endpoint throws
    } finally {
      setLoading(false);
      setSubmitted(true);
      setTimeout(() => {
        setCurrentScreen('change-pass');
      }, 900);
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
          onClick={() => setCurrentScreen('login')}
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
            Forgot Password
          </h2>
          <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
            Enter your registered username below. We&apos;ll verify your multi-user account and generate a secure reset link.
          </p>
        </div>

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
                className={`w-full h-12 px-4 rounded-xl border text-sm outline-none focus:border-[#c9b27c] transition-colors ${
                  isDark
                    ? 'bg-[#0e0e10] border-[#26262b] text-[#e8e8ea]'
                    : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#18181b]'
                }`}
                placeholder="Enter username"
                required
              />
              <div className="absolute right-3.5 top-3.5 text-[#8a8a93]">
                <Mail className="w-4 h-4" />
              </div>
            </div>
          </div>

          <button
            type="submit"
            disabled={submitted || loading}
            className={`w-full h-12 mt-4 rounded-xl font-bold text-sm shadow-md transition-all flex items-center justify-center gap-2 ${
              submitted
                ? 'bg-[#8fb39a] text-neutral-950'
                : 'bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 shadow-[#c9b27c]/20'
            } disabled:opacity-75`}
          >
            {loading ? (
              <>
                <Loader2 className="w-4 h-4 animate-spin" />
                <span>Generating link...</span>
              </>
            ) : submitted ? (
              <>
                <CheckCircle2 className="w-4 h-4" />
                <span>Link Dispatched! Redirecting...</span>
              </>
            ) : (
              <>
                <span>Send Reset Link</span>
                <Send className="w-4 h-4" />
              </>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
