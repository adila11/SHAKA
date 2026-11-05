import { Signal, Wifi, Battery } from 'lucide-react';
import { useTheme } from '../../context/ThemeContext';

export default function StatusBar({ time = '9:41', customTheme = null }) {
  const { isDark: globalDark } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  return (
    <div
      className={`h-11 px-7 flex items-center justify-between text-xs font-medium shrink-0 select-none transition-colors ${
        isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'
      }`}
    >
      <span className="font-semibold text-[13px] tracking-tight">{time}</span>
      <div className={`w-24 h-4 rounded-full mx-auto ${isDark ? 'bg-black/50' : 'bg-black/20'}`} />
      <div className="flex items-center gap-1.5">
        <Signal className="w-3.5 h-3.5" />
        <Wifi className="w-3.5 h-3.5" />
        <Battery className="w-4 h-4" />
      </div>
    </div>
  );
}
