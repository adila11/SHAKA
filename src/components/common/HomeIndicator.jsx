import { useTheme } from '../../context/ThemeContext';

export default function HomeIndicator({ customTheme = null }) {
  const { isDark: globalDark } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  return (
    <div className="h-5 flex items-center justify-center shrink-0">
      <div
        className={`w-32 h-1 rounded-full transition-colors ${
          isDark ? 'bg-neutral-700/60' : 'bg-neutral-300'
        }`}
      />
    </div>
  );
}
