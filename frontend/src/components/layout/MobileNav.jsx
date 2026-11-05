import { LayoutDashboard, BookOpen, Plus, PieChart, User } from 'lucide-react';
import { useFinance } from '../../context/FinanceContext';
import { useTheme } from '../../context/ThemeContext';

export default function MobileNav() {
  const { currentScreen, setCurrentScreen, setIsAddExpenseModalOpen } = useFinance();
  const { isDark } = useTheme();

  const navItems = [
    { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard },
    { id: 'ledger', label: 'Ledger', icon: BookOpen },
    { id: 'add-expense', label: 'Add', isAction: true },
    { id: 'budget', label: 'Budget', icon: PieChart },
    { id: 'profile', label: 'Profile', icon: User },
  ];

  return (
    <nav
      className={`md:hidden fixed bottom-0 left-0 right-0 z-40 border-t backdrop-blur-lg px-4 h-16 flex items-center justify-between pb-safe transition-colors ${
        isDark
          ? 'bg-[#17171a]/95 border-[#26262b]'
          : 'bg-white/95 border-[#e5e3dc]'
      }`}
    >
      {navItems.map((item) => {
        if (item.isAction) {
          return (
            <div key={item.id} className="flex-1 flex justify-center -mt-6">
              <button
                type="button"
                onClick={() => setIsAddExpenseModalOpen(true)}
                className="w-12 h-12 rounded-full bg-gradient-to-tr from-[#c9b27c] to-[#a68d55] text-neutral-950 flex items-center justify-center shadow-lg shadow-[#c9b27c]/30 hover:scale-105 active:scale-95 transition-transform cursor-pointer"
                aria-label="Add Expense"
              >
                <Plus className="w-6 h-6 stroke-[2.5]" />
              </button>
            </div>
          );
        }

        const Icon = item.icon;
        const isActive = currentScreen === item.id;

        return (
          <button
            key={item.id}
            type="button"
            onClick={() => setCurrentScreen(item.id)}
            className={`flex-1 flex flex-col items-center justify-center gap-1 py-1 transition-colors cursor-pointer ${
              isActive
                ? 'text-[#c9b27c]'
                : isDark
                ? 'text-[#8a8a93] hover:text-[#e8e8ea]'
                : 'text-[#71717a] hover:text-[#18181b]'
            }`}
          >
            <Icon className="w-5 h-5" />
            <span className={`text-[10px] ${isActive ? 'font-bold' : 'font-medium'}`}>
              {item.label}
            </span>
          </button>
        );
      })}
    </nav>
  );
}

