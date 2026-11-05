
export default function ShakaLogo({ size = 'md', showText = false, textSubtitle = null, isDark = true }) {
  const sizeClasses = {
    sm: 'w-7 h-7 rounded-lg text-xs',
    md: 'w-10 h-10 rounded-xl text-base',
    lg: 'w-16 h-16 rounded-2xl text-2xl',
  }[size] || 'w-10 h-10 rounded-xl text-base';

  return (
    <div className="flex items-center gap-2.5">
      <div
        className={`${sizeClasses} bg-gradient-to-br from-[#c9b27c] to-[#967f4c] flex items-center justify-center font-extrabold text-neutral-950 shadow-md shadow-[#c9b27c]/20 shrink-0 select-none`}
      >
        S
      </div>
      {showText && (
        <div className="text-left">
          <div className="flex items-center gap-1.5">
            <span className={`font-bold tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
              SHAKA
            </span>
            <span className="text-[10px] font-mono px-1.5 py-0.2 rounded bg-[#c9b27c]/20 text-[#c9b27c] border border-[#c9b27c]/30">
              LEDGER
            </span>
          </div>
          {textSubtitle && (
            <p className={`text-[11px] ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
              {textSubtitle}
            </p>
          )}
        </div>
      )}
    </div>
  );
}
