import { useState } from 'react';
import { RefreshCw, Sparkles, X } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';
import { useTheme } from '../../context/ThemeContext';

export default function PwaUpdateNotification() {
  const { updateAvailable, applyUpdate } = usePWA();
  const { isDark } = useTheme();
  const [isDismissed, setIsDismissed] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);

  if (!updateAvailable || isDismissed) return null;

  const handleUpdate = () => {
    setIsUpdating(true);
    applyUpdate();
  };

  return (
    <div className="fixed bottom-20 md:bottom-6 right-4 left-4 md:left-auto md:max-w-md z-50 animate-slide-up">
      <div
        className={`p-4 rounded-2xl border shadow-2xl backdrop-blur-md flex items-center justify-between gap-3.5 transition-all ${
          isDark
            ? 'bg-[#17171a]/95 border-[#c9b27c]/40 text-[#e8e8ea]'
            : 'bg-white/95 border-[#c9b27c]/40 text-[#18181b]'
        }`}
      >
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-xl bg-[#c9b27c]/20 border border-[#c9b27c]/40 flex items-center justify-center text-[#c9b27c] shrink-0">
            <Sparkles className="w-5 h-5 animate-pulse" />
          </div>
          <div>
            <h4 className="text-xs font-bold tracking-tight">Update Available</h4>
            <p className="text-[11px] text-[#8a8a93]">
              A new release of SHAKA is ready with fresh improvements.
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2 shrink-0">
          <button
            type="button"
            disabled={isUpdating}
            onClick={handleUpdate}
            className="px-3 py-1.5 rounded-xl font-bold text-xs bg-gradient-to-r from-[#c9b27c] to-[#a68d55] text-neutral-950 flex items-center gap-1.5 shadow-md shadow-[#c9b27c]/20 hover:scale-[1.02] active:scale-[0.98] transition-all cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${isUpdating ? 'animate-spin' : ''}`} />
            <span>{isUpdating ? 'Updating...' : 'Update'}</span>
          </button>
          <button
            type="button"
            onClick={() => setIsDismissed(true)}
            className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
              isDark ? 'hover:bg-[#202024] text-[#8a8a93]' : 'hover:bg-[#f4f2ed] text-[#71717a]'
            }`}
            aria-label="Dismiss notification"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
