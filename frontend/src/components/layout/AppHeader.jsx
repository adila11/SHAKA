import { Bell } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';
import { getProfileImageUrl } from '../../data/financeData';

export default function AppHeader({ title = 'SHAKA', customTheme = null, onProfileClick }) {
  const {
    currentUser,
    navigateTo,
    pendingAdminRequestsCount,
    setIsReviewResetModalOpen,
  } = useFinance();
  const { isDark: globalDark } = useTheme();
  const isDark = customTheme ? customTheme === 'dark' : globalDark;

  const handleAvatarClick = () => {
    if (onProfileClick) {
      onProfileClick();
    } else {
      navigateTo('profile');
    }
  };

  return (
    <div
      className={`px-5 py-2.5 flex items-center justify-between border-b shrink-0 transition-colors ${
        isDark ? 'border-[#26262b] bg-[#0e0e10]' : 'border-[#e5e3dc] bg-[#f6f5f2]'
      }`}
    >
      <div className="flex items-center gap-2.5">
        <div className="w-7 h-7 rounded-lg overflow-hidden flex items-center justify-center select-none shadow-sm shadow-[#c9b27c]/20 border border-[#c9b27c]/30 bg-[#17171a] shrink-0">
          <img src="/Logo.png" alt="SHAKA Logo" className="w-full h-full object-contain p-0.5" />
        </div>
        <div className="flex items-center gap-1.5">
          <span className={`font-bold text-sm tracking-tight ${isDark ? 'text-[#e8e8ea]' : 'text-[#18181b]'}`}>
            {title}
          </span>
          <span className="text-[9px] font-mono px-1 py-0.2 rounded bg-[#c9b27c]/15 text-[#c9b27c] border border-[#c9b27c]/25">
            PRO
          </span>
        </div>
      </div>

      <div className="flex items-center gap-2">
        {currentUser?.role === 'Admin' && (
          <button
            type="button"
            title={
              pendingAdminRequestsCount > 0
                ? `${pendingAdminRequestsCount} pending reset requests`
                : 'No pending reset requests'
            }
            onClick={() => setIsReviewResetModalOpen(true)}
            className="relative p-1.5 rounded-lg border border-[#26262b] bg-[#17171a] text-[#8a8a93] hover:text-[#e8e8ea] transition-colors cursor-pointer"
          >
            <Bell className="w-3.5 h-3.5 text-[#c9b27c]" />
            {pendingAdminRequestsCount > 0 && (
              <span className="absolute -top-1 -right-1 w-3.5 h-3.5 rounded-full bg-[#d4a359] text-neutral-950 font-black text-[9px] flex items-center justify-center animate-pulse">
                {pendingAdminRequestsCount}
              </span>
            )}
          </button>
        )}

        <button
          type="button"
          onClick={handleAvatarClick}
          className="flex items-center gap-2.5 cursor-pointer group"
        >
          <div className="flex flex-col text-right leading-tight">
            <span
              className={`text-xs font-semibold transition-colors ${
                isDark ? 'text-[#e8e8ea] group-hover:text-[#c9b27c]' : 'text-[#18181b] group-hover:text-[#c9b27c]'
              }`}
            >
              {currentUser?.name || currentUser?.username || 'Member'}
            </span>
            {currentUser?.username && (
              <span className={`text-[10px] font-mono ${isDark ? 'text-[#8a8a93]' : 'text-[#71717a]'}`}>
                @{currentUser.username}
              </span>
            )}
          </div>
          <div
            className={`w-7 h-7 rounded-full border text-[10px] font-bold flex items-center justify-center transition-colors shadow-sm overflow-hidden ${
              isDark
                ? 'bg-[#17171a] border-[#26262b] text-[#c9b27c] group-hover:border-[#c9b27c]'
                : 'bg-white border-[#e5e3dc] text-[#c9b27c] group-hover:border-[#c9b27c]'
            }`}
          >
            <img
              src={getProfileImageUrl(currentUser?.profileImage || currentUser?.avatar)}
              alt={currentUser?.username || 'User'}
              className="w-full h-full object-cover"
            />
          </div>
        </button>
      </div>
    </div>
  );
}
