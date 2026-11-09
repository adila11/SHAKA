import { useLocation, useNavigate } from '../router/routerUtils';
import { useTheme } from '../context/ThemeContext';
import { ArrowLeft, Compass, Home } from 'lucide-react';

export default function NotFoundPage() {
  const location = useLocation();
  const navigate = useNavigate();
  const { isDark } = useTheme();

  const handleReturnHome = () => {
    navigate('/dashboard');
  };

  return (
    <div
      className={`min-h-[70vh] flex flex-col items-center justify-center p-6 text-center select-none ${
        isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'
      }`}
    >
      <div
        className={`w-full max-w-md p-8 rounded-3xl border shadow-xl transition-all ${
          isDark
            ? 'bg-[#17171a] border-[#26262b] shadow-black/40'
            : 'bg-white border-[#e5e3dc] shadow-neutral-200/50'
        }`}
      >
        {/* Decorative Compass Icon */}
        <div className="w-16 h-16 mx-auto mb-6 rounded-2xl bg-[#c9b27c]/15 text-[#c9b27c] flex items-center justify-center shadow-inner">
          <Compass className="w-8 h-8 animate-pulse stroke-[1.75]" />
        </div>

        {/* 404 Headline */}
        <span className="text-4xl sm:text-5xl font-black font-mono tracking-tight text-[#c9b27c]">
          404
        </span>

        <h1
          className={`text-xl sm:text-2xl font-extrabold tracking-tight mt-2 mb-2 ${
            isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'
          }`}
        >
          Page Not Found
        </h1>

        <p
          className={`text-xs sm:text-sm max-w-sm mx-auto mb-5 leading-relaxed ${
            isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'
          }`}
        >
          The financial ledger view or requested URL does not exist or has been moved.
        </p>

        {/* Path Indicator Pill */}
        {location.pathname && (
          <div
            className={`inline-flex items-center gap-2 px-3 py-1.5 rounded-xl border text-xs font-mono mb-6 max-w-full overflow-hidden truncate ${
              isDark
                ? 'bg-[#0e0e10] border-[#26262b] text-[#8a8a93]'
                : 'bg-[#f6f5f2] border-[#e5e3dc] text-[#71717a]'
            }`}
            title={location.pathname}
          >
            <span className="text-[#c9b27c]">path:</span>
            <span className="truncate">{location.pathname}</span>
          </div>
        )}

        {/* Navigation Action Buttons */}
        <div className="flex flex-col sm:flex-row items-center justify-center gap-3 w-full">
          <button
            type="button"
            onClick={handleReturnHome}
            className="w-full sm:w-auto px-5 py-2.5 rounded-xl bg-gradient-to-tr from-[#c9b27c] to-[#a68d55] text-neutral-950 font-bold text-xs shadow-md shadow-[#c9b27c]/20 hover:scale-[1.02] active:scale-[0.98] transition-all flex items-center justify-center gap-2 cursor-pointer"
          >
            <Home className="w-4 h-4 stroke-[2.5]" />
            <span>Return to Dashboard</span>
          </button>

          <button
            type="button"
            onClick={() => window.history.back()}
            className={`w-full sm:w-auto px-4 py-2.5 rounded-xl border text-xs font-semibold transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
              isDark
                ? 'bg-[#121214] border-[#26262b] text-[#e8e8ea] hover:bg-[#1a1a1e]'
                : 'bg-white border-[#e5e3dc] text-[#18181b] hover:bg-[#faf9f6]'
            }`}
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            <span>Go Back</span>
          </button>
        </div>
      </div>
    </div>
  );
}

