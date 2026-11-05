import { useState } from 'react';
import { User, Eye, EyeOff, ArrowRight } from 'lucide-react';
import { useFinance } from '../context/FinanceContext';
import { useTheme } from '../context/ThemeContext';

export default function Screen1Login({ customTheme = null, onNavigate }) {
  const { navigateTo, setIsLoggedIn } = useFinance();
  const { isDark: globalDark } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  const [username, setUsername] = useState('alex_rivera');
  const [password, setPassword] = useState('password123');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(true);

  const handleNav = (screen) => {
    if (onNavigate) {
      onNavigate(screen);
    } else {
      navigateTo(screen);
    }
  };

  const handleLogin = (e) => {
    e.preventDefault();
    setIsLoggedIn(true);
    handleNav('dashboard');
  };

  return (
    <div className="flex-1 px-6 flex flex-col justify-center">
      <div className="mb-8 text-center">
        <div className="w-16 h-16 mx-auto mb-4 rounded-2xl bg-gradient-to-br from-[#c9b27c] to-[#967f4c] flex items-center justify-center shadow-lg shadow-[#c9b27c]/20 select-none">
          <span className="text-neutral-950 font-extrabold text-2xl tracking-tighter">S</span>
        </div>
        <h2 className={`text-2xl font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
          SHAKA
        </h2>
        <p className={`text-xs mt-1 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
          Shared personal finance tracker
        </p>
      </div>

      <form onSubmit={handleLogin} className="space-y-4">
        <div>
          <label
            className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
              isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'
            }`}
          >
            Username
          </label>
          <div className="relative">
            <input
              type="text"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              className={`w-full h-12 px-4 rounded-xl border text-sm focus:outline-none focus:border-[#c9b27c] transition-colors ${
                isDark
                  ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]'
                  : 'bg-white border-[#e5e3dc] text-[#18181b]'
              }`}
              placeholder="Enter username"
            />
            <div className="absolute right-3.5 top-3.5 text-[#8a8a93]">
              <User className="w-4 h-4" />
            </div>
          </div>
        </div>

        <div>
          <label
            className={`block text-xs font-semibold uppercase tracking-wider mb-1.5 ${
              isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'
            }`}
          >
            Password
          </label>
          <div className="relative">
            <input
              type={showPassword ? 'text' : 'password'}
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className={`w-full h-12 px-4 rounded-xl border text-sm focus:outline-none focus:border-[#c9b27c] transition-colors ${
                isDark
                  ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]'
                  : 'bg-white border-[#e5e3dc] text-[#18181b]'
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
          <label
            className={`flex items-center gap-2 cursor-pointer ${
              isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'
            }`}
          >
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
            onClick={() => handleNav('forgot')}
            className="text-[#c9b27c] hover:underline font-medium cursor-pointer"
          >
            Forgot password?
          </button>
        </div>

        <button
          type="submit"
          className="w-full h-12 mt-4 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 font-bold text-sm shadow-md shadow-[#c9b27c]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
        >
          <span>Log In</span>
          <ArrowRight className="w-4 h-4" />
        </button>
      </form>
    </div>
  );
}
