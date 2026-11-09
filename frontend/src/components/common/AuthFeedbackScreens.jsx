import { ShieldAlert, ServerOff, RefreshCw, Loader2, LogOut } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';
import { useFinance } from '../../context/FinanceContext';

export function AuthInitializingScreen() {
  const { isDark } = useTheme();

  return (
    <div
      role="status"
      aria-live="polite"
      className={`min-h-[70vh] flex flex-col items-center justify-center p-6 text-center transition-colors ${
        isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'
      }`}
    >
      <div className="w-16 h-16 rounded-3xl overflow-hidden border border-[#c9b27c]/40 bg-[#17171a] flex items-center justify-center mx-auto mb-6 shadow-xl shadow-[#c9b27c]/25 select-none animate-pulse">
        <img src="/Logo.png" alt="SHAKA Logo" className="w-full h-full object-contain p-1" />
      </div>
      <h2 className="text-xl font-extrabold tracking-tight mb-2">
        Authenticating Secure Session
      </h2>
      <p className={`text-xs max-w-sm mx-auto mb-6 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
        Verifying cryptographic session credentials with SHAKA backend vault...
      </p>
      <div className="w-56 h-1.5 rounded-full overflow-hidden bg-[#26262b] mb-4">
        <div className="h-full rounded-full bg-gradient-to-r from-[#c9b27c] via-[#f3e5c0] to-[#c9b27c] animate-pulse w-full" />
      </div>
      <div className="inline-flex items-center gap-2 text-[11px] font-mono font-medium text-[#c9b27c]">
        <Loader2 className="w-3.5 h-3.5 animate-spin" />
        <span>INITIALIZING AUTHENTICATION</span>
      </div>
    </div>
  );
}

export function ServerUnavailableScreen({ onRetry, errorMsg }) {
  const { isDark } = useTheme();
  const { logout } = useFinance();

  return (
    <div
      role="alert"
      className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center"
    >
      <div
        className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl transition-colors ${
          isDark ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]' : 'bg-white border-[#e5e3dc] text-[#18181b]'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-[#d97070]/15 text-[#d97070] border border-[#d97070]/30 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#d97070]/10">
          <ServerOff className="w-7 h-7 stroke-[2.5]" />
        </div>
        <h3 className="text-xl font-extrabold tracking-tight mb-2">
          Backend Server Unavailable
        </h3>
        <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
          {errorMsg || 'Unable to connect to the SHAKA backend API server at http://localhost:5000/api.'}
        </p>
        <div className="p-3 rounded-xl bg-neutral-900/40 border border-[#26262b] text-[11px] font-mono text-[#8a8a93] text-left mb-6 break-all">
          <span className="text-[#d97070] font-bold">STATUS:</span> SERVER_UNAVAILABLE
          <br />
          <span className="text-[#8fb39a] font-bold">NOTICE:</span> Protected records are safely locked until backend verification succeeds.
        </div>

        <div className="flex flex-col gap-2.5">
          <button
            type="button"
            onClick={onRetry}
            className="w-full h-11 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 font-bold text-xs tracking-wide shadow-md shadow-[#c9b27c]/20 transition-all flex items-center justify-center gap-2 cursor-pointer active:scale-[0.99]"
          >
            <RefreshCw className="w-4 h-4" />
            <span>Retry Backend Connection</span>
          </button>
          <button
            type="button"
            onClick={logout}
            className={`w-full h-11 rounded-xl border text-xs font-semibold transition-colors flex items-center justify-center gap-2 cursor-pointer ${
              isDark
                ? 'border-[#26262b] text-[#8a8a93] hover:text-[#e8e8ea] hover:bg-[#202024]'
                : 'border-[#e5e3dc] text-[#71717a] hover:text-[#18181b] hover:bg-[#f6f5f2]'
            }`}
          >
            <LogOut className="w-4 h-4" />
            <span>Clear Saved Session & Go to Login</span>
          </button>
        </div>
      </div>
    </div>
  );
}

export function AccessDeniedScreen({ requiredRole, userRole }) {
  const { isDark } = useTheme();
  const { setCurrentScreen } = useFinance();

  return (
    <div
      role="alert"
      className="min-h-[70vh] flex flex-col items-center justify-center p-6 text-center"
    >
      <div
        className={`w-full max-w-md p-8 rounded-3xl border shadow-2xl transition-colors ${
          isDark ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]' : 'bg-white border-[#e5e3dc] text-[#18181b]'
        }`}
      >
        <div className="w-14 h-14 rounded-2xl bg-[#d4a359]/15 text-[#d4a359] border border-[#d4a359]/30 flex items-center justify-center mx-auto mb-5 shadow-lg shadow-[#d4a359]/10">
          <ShieldAlert className="w-7 h-7 stroke-[2.5]" />
        </div>
        <h3 className="text-xl font-extrabold tracking-tight mb-2">
          Access Denied
        </h3>
        <p className={`text-xs leading-relaxed mb-4 ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
          This resource requires <strong className="text-[#c9b27c]">{requiredRole || 'Admin'}</strong> privileges. Your current role is <span className="font-mono">{userRole || 'Member'}</span>.
        </p>

        <button
          type="button"
          onClick={() => setCurrentScreen('dashboard')}
          className="w-full h-11 rounded-xl bg-[#c9b27c] hover:bg-[#bba46e] text-neutral-950 font-bold text-xs tracking-wide shadow-md shadow-[#c9b27c]/20 transition-all cursor-pointer"
        >
          Return to Dashboard
        </button>
      </div>
    </div>
  );
}

