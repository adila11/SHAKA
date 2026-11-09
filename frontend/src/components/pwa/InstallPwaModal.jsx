import { X, Download, Share, PlusSquare, Monitor, Smartphone, CheckCircle, ShieldCheck, Zap } from 'lucide-react';
import { usePWA } from '../../context/PWAContext';
import { useTheme } from '../../context/ThemeContext';

export default function InstallPwaModal() {
  const {
    isInstallModalOpen,
    setIsInstallModalOpen,
    canNativePrompt,
    installApp,
    platformInfo,
    isInstalled,
  } = usePWA();
  const { isDark } = useTheme();

  if (!isInstallModalOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm animate-fade-in"
      style={{
        paddingTop: 'max(1rem, env(safe-area-inset-top, 0px))',
        paddingBottom: 'max(1rem, env(safe-area-inset-bottom, 0px))',
        paddingLeft: 'max(1rem, env(safe-area-inset-left, 0px))',
        paddingRight: 'max(1rem, env(safe-area-inset-right, 0px))',
      }}
    >
      <div
        className={`w-full max-w-lg rounded-2xl border shadow-2xl p-6 sm:p-7 relative transition-all ${
          isDark
            ? 'bg-[#17171a] border-[#26262b] text-[#e8e8ea]'
            : 'bg-white border-[#e5e3dc] text-[#18181b]'
        }`}
      >
        {/* Close Button */}
        <button
          type="button"
          onClick={() => setIsInstallModalOpen(false)}
          className={`absolute top-4 right-4 p-2 rounded-xl transition-colors cursor-pointer ${
            isDark
              ? 'hover:bg-[#202024] text-[#8a8a93] hover:text-[#e8e8ea]'
              : 'hover:bg-[#f4f2ed] text-[#71717a] hover:text-[#18181b]'
          }`}
          aria-label="Close dialog"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Modal Header */}
        <div className="flex items-center gap-3.5 mb-5">
          <div className="w-12 h-12 rounded-2xl overflow-hidden bg-[#202024] border border-[#c9b27c]/40 flex items-center justify-center shadow-lg shadow-[#c9b27c]/15 shrink-0">
            <img src="/Logo.png" alt="SHAKA Logo" className="w-full h-full object-contain p-1" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h2 className="text-lg font-bold tracking-tight">Install SHAKA App</h2>
              <span className="text-[10px] font-mono uppercase px-2 py-0.5 rounded-full bg-[#c9b27c]/15 text-[#c9b27c] border border-[#c9b27c]/30 font-semibold">
                PWA
              </span>
            </div>
            <p className="text-xs text-[#8a8a93]">
              Experience quiet luxury personal finance as an ultra-fast standalone app.
            </p>
          </div>
        </div>

        {/* Highlights / Benefits */}
        <div className="grid grid-cols-3 gap-2.5 mb-6 text-center">
          <div
            className={`p-3 rounded-xl border text-xs flex flex-col items-center gap-1.5 ${
              isDark ? 'bg-[#202024]/60 border-[#2b2b31]' : 'bg-[#f8f7f4] border-[#e8e5dc]'
            }`}
          >
            <Zap className="w-4 h-4 text-[#c9b27c]" />
            <span className="font-semibold text-[11px]">Instant Launch</span>
            <span className="text-[10px] text-[#8a8a93]">Zero tab overhead</span>
          </div>
          <div
            className={`p-3 rounded-xl border text-xs flex flex-col items-center gap-1.5 ${
              isDark ? 'bg-[#202024]/60 border-[#2b2b31]' : 'bg-[#f8f7f4] border-[#e8e5dc]'
            }`}
          >
            <ShieldCheck className="w-4 h-4 text-[#c9b27c]" />
            <span className="font-semibold text-[11px]">Offline Access</span>
            <span className="text-[10px] text-[#8a8a93]">Cached ledgers</span>
          </div>
          <div
            className={`p-3 rounded-xl border text-xs flex flex-col items-center gap-1.5 ${
              isDark ? 'bg-[#202024]/60 border-[#2b2b31]' : 'bg-[#f8f7f4] border-[#e8e5dc]'
            }`}
          >
            <CheckCircle className="w-4 h-4 text-[#c9b27c]" />
            <span className="font-semibold text-[11px]">Native Window</span>
            <span className="text-[10px] text-[#8a8a93]">Dock & Home screen</span>
          </div>
        </div>

        {/* Already Installed State */}
        {isInstalled ? (
          <div
            className={`p-4 rounded-xl border text-center mb-4 ${
              isDark ? 'bg-[#202024]/40 border-[#26262b]' : 'bg-[#f4f2ed] border-[#e0ded6]'
            }`}
          >
            <p className="text-xs font-semibold text-[#c9b27c] mb-1">
              ✓ SHAKA is already installed on this device!
            </p>
            <p className="text-[11px] text-[#8a8a93]">
              You can launch it anytime from your desktop applications, dock, or home screen.
            </p>
          </div>
        ) : canNativePrompt ? (
          /* Native Prompt Available */
          <div className="space-y-4">
            <button
              type="button"
              onClick={installApp}
              className="w-full py-3 px-4 rounded-xl font-bold text-xs bg-gradient-to-r from-[#c9b27c] via-[#ecd9aa] to-[#c9b27c] text-neutral-950 flex items-center justify-center gap-2 shadow-lg shadow-[#c9b27c]/20 hover:scale-[1.01] active:scale-[0.99] transition-all cursor-pointer"
            >
              <Download className="w-4 h-4" />
              <span>Install SHAKA to Device</span>
            </button>
            <p className="text-[11px] text-center text-[#8a8a93]">
              One click adds SHAKA to your home screen or desktop application menu.
            </p>
          </div>
        ) : platformInfo.isIOS ? (
          /* iOS Safari Specific Guide */
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#c9b27c]">
              <Smartphone className="w-4 h-4" />
              <span>How to Install on iOS (Safari):</span>
            </div>
            <div
              className={`p-4 rounded-xl border space-y-2.5 text-xs ${
                isDark ? 'bg-[#202024]/50 border-[#2b2b31]' : 'bg-[#f8f7f4] border-[#e8e5dc]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#c9b27c] text-neutral-950 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Tap the <strong className="text-[#c9b27c] inline-flex items-center gap-1">Share <Share className="w-3.5 h-3.5 inline" /></strong> button in the Safari navigation bar.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#c9b27c] text-neutral-950 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Scroll down the share sheet and tap <strong className="text-[#c9b27c] inline-flex items-center gap-1">Add to Home Screen <PlusSquare className="w-3.5 h-3.5 inline" /></strong>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#c9b27c] text-neutral-950 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Confirm by tapping <strong className="text-[#c9b27c]">Add</strong> in the top right corner.
                </p>
              </div>
            </div>
          </div>
        ) : (
          /* Desktop / Chrome / Edge Manual Instructions */
          <div className="space-y-3">
            <div className="flex items-center gap-2 text-xs font-bold text-[#c9b27c]">
              <Monitor className="w-4 h-4" />
              <span>How to Install on Desktop (Chrome, Edge, Brave):</span>
            </div>
            <div
              className={`p-4 rounded-xl border space-y-2.5 text-xs ${
                isDark ? 'bg-[#202024]/50 border-[#2b2b31]' : 'bg-[#f8f7f4] border-[#e8e5dc]'
              }`}
            >
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#c9b27c] text-neutral-950 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  1
                </span>
                <p>
                  Look at the right side of your browser&apos;s address bar for the <strong className="text-[#c9b27c]">Install icon</strong> (an icon with a computer and arrow).
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#c9b27c] text-neutral-950 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  2
                </span>
                <p>
                  Alternatively, open browser menu <strong>(⋮)</strong> &gt; <strong>Save and share / Apps</strong> &gt; <strong>Install SHAKA</strong>.
                </p>
              </div>
              <div className="flex items-start gap-2.5">
                <span className="w-5 h-5 rounded-full bg-[#c9b27c] text-neutral-950 font-bold text-[10px] flex items-center justify-center shrink-0 mt-0.5">
                  3
                </span>
                <p>
                  Click <strong className="text-[#c9b27c]">Install</strong> to open SHAKA in its own distraction-free window.
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Footer info */}
        <div className="mt-6 pt-4 border-t border-[#26262b] flex items-center justify-between text-[11px] text-[#8a8a93]">
          <span>Compatible with Windows, macOS, iOS, Android</span>
          <button
            type="button"
            onClick={() => setIsInstallModalOpen(false)}
            className="text-xs font-semibold hover:text-[#e8e8ea] transition-colors cursor-pointer"
          >
            Dismiss
          </button>
        </div>
      </div>
    </div>
  );
}

