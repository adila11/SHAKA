import { useState } from 'react';
import { ArrowLeft, Mail, Send } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';

export default function Screen2ForgotPassword({ customTheme = null, onNavigate }) {
  const { navigateTo } = useFinance();
  const { isDark: globalDark } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  const [username, setUsername] = useState('');
  const [submitted, setSubmitted] = useState(false);

  const handleNav = (screen) => {
    if (onNavigate) {
      onNavigate(screen);
    } else {
      navigateTo(screen);
    }
  };

  const handleSubmit = (e) => {
    e.preventDefault();
    setSubmitted(true);
    setTimeout(() => {
      handleNav('change-pass');
    }, 800);
  };

  return (
    <div className="flex-1 px-6 flex flex-col justify-center">
      <button
        type="button"
        onClick={() => handleNav('login')}
        className={`w-9 h-9 -ml-1 rounded-xl border flex items-center justify-center mb-8 transition-colors cursor-pointer ${
          isDark
            ? 'bg-[#17171a] border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea]'
            : 'bg-white border-[#e5e3dc] text-[#71717a] hover:text-[#18181b]'
        }`}
      >
        <ArrowLeft className="w-4 h-4" />
      </button>

      <div className="mb-8">
        <div className="flex items-center gap-2 mb-2">
          <span className="text-[10px] font-mono px-2 py-0.5 rounded bg-[#c9b27c]/15 text-[#c9b27c] border border-[#c9b27c]/30 font-bold uppercase tracking-wider">
            Two-Admin Approval
          </span>
        </div>
        <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
          Admin Password Recovery
        </h2>
        <p className={`text-xs mt-2 leading-relaxed ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
          Enter your registered administrator email. The second administrator must review and approve your request before resetting.
        </p>
      </div>

      <form onSubmit={handleSubmit} noValidate className="space-y-4">
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
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full h-12 px-4 rounded-xl border text-sm focus:outline-none focus:border-[#c9b27c] transition-colors ${
                isDark
                  ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]'
                  : 'bg-white border-[#e5e3dc] text-[#18181b]'
              }`}
              placeholder="admin@shaka.local"
            />
            <div className="absolute right-3.5 top-3.5 text-[#8a8a93]">
              <Mail className="w-4 h-4" />
            </div>
          </div>
        </div>

        <button
          type="submit"
          className="w-full h-12 mt-2 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 font-bold text-sm shadow-md shadow-[#c9b27c]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <span>{submitted ? 'Reset Link Generated...' : 'Send Reset Link'}</span>
          <Send className="w-4 h-4" />
        </button>

        <div className="text-center pt-4">
          <button
            type="button"
            onClick={() => handleNav('login')}
            className="text-xs font-semibold text-[#8a8a93] hover:text-[#c9b27c] transition-colors cursor-pointer"
          >
            ← Back to login
          </button>
        </div>
      </form>
    </div>
  );
}
