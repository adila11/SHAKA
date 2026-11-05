import StatusBar from '../common/StatusBar';
import HomeIndicator from '../common/HomeIndicator';
import { useTheme } from '../../context/ThemeContext';

export default function PhoneFrame({
  children,
  screenId = 'screen',
  screenLabel = null,
  showLabel = false,
  customTheme = null,
  className = '',
}) {
  const { isDark: globalDark } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  return (
    <div className="flex flex-col items-center gap-3">
      {showLabel && screenLabel && (
        <div className="text-xs font-semibold uppercase tracking-wider text-neutral-400 flex items-center gap-2 select-none">
          <span className="w-2 h-2 rounded-full bg-[#c9b27c]" />
          <span>{screenLabel}</span>
        </div>
      )}

      <div
        data-screen={screenId}
        className={`phone-viewport relative rounded-[44px] shadow-2xl overflow-hidden border-[6px] transition-colors flex flex-col ${
          isDark
            ? 'border-neutral-800 bg-[#0e0e10] text-[#e8e8ea]'
            : 'border-neutral-300 bg-[#f6f5f2] text-[#18181b]'
        } ${className}`}
      >
        <StatusBar customTheme={customTheme} />
        <div className="flex-1 flex flex-col overflow-hidden relative">
          {children}
        </div>
        <HomeIndicator customTheme={customTheme} />
      </div>
    </div>
  );
}
