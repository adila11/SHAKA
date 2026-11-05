import PhoneFrame from '../layout/PhoneFrame';
import Screen1Login from '../../pages/Screen1Login';
import Screen2ForgotPassword from '../../pages/Screen2ForgotPassword';
import Screen3Dashboard from '../../pages/Screen3Dashboard';
import Screen4Ledger from '../../pages/Screen4Ledger';
import Screen5AddExpense from '../../pages/Screen5AddExpense';
import Screen6Budget from '../../pages/Screen6Budget';
import Screen7Profile from '../../pages/Screen7Profile';
import Screen8ChangePassword from '../../pages/Screen8ChangePassword';
import { useFinance } from '../../context/FinanceContext';

export default function AllScreensGallery() {
  const { setCurrentScreen, setViewMode } = useFinance();

  const handleInspect = (screenId) => {
    setCurrentScreen(screenId);
    setViewMode('single');
  };

  const screens = [
    {
      id: 'login',
      title: 'Screen 1: Login (Minimal)',
      component: <Screen1Login onNavigate={(s) => handleInspect(s)} />,
    },
    {
      id: 'forgot',
      title: 'Screen 2: Forgot Password',
      component: <Screen2ForgotPassword onNavigate={(s) => handleInspect(s)} />,
    },
    {
      id: 'dashboard',
      title: 'Screen 3: Dashboard (5 Widgets Max)',
      component: <Screen3Dashboard onNavigate={(s) => handleInspect(s)} />,
    },
    {
      id: 'ledger',
      title: 'Screen 4: Ledger',
      component: <Screen4Ledger onNavigate={(s) => handleInspect(s)} />,
    },
    {
      id: 'add-expense',
      title: 'Screen 5: Add Expense (Modal / Sheet)',
      component: <Screen5AddExpense onNavigate={(s) => handleInspect(s)} />,
    },
    {
      id: 'budget',
      title: 'Screen 6: Budget Planner',
      component: <Screen6Budget onNavigate={(s) => handleInspect(s)} />,
    },
    {
      id: 'profile',
      title: 'Screen 7: Profile & Settings',
      component: <Screen7Profile onNavigate={(s) => handleInspect(s)} />,
    },
    {
      id: 'change-pass',
      title: 'Screen 8: Change Password',
      component: <Screen8ChangePassword onNavigate={(s) => handleInspect(s)} />,
    },
  ];

  return (
    <div className="w-full">
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-neutral-100 dark:text-[#e8e8ea]">
            Stitch Design System Showcase
          </h2>
          <p className="text-xs text-neutral-400 dark:text-[#8a8a93]">
            All 8 mobile artboards rendered simultaneously with synchronized state and design tokens.
          </p>
        </div>
        <span className="text-xs font-semibold px-2.5 py-1 rounded-full bg-[#c9b27c]/15 text-[#c9b27c] border border-[#c9b27c]/30">
          8 Active Viewports
        </span>
      </div>

      <div className="flex gap-8 overflow-x-auto pb-8 pt-2 items-start justify-start px-2">
        {screens.map((screen) => (
          <div key={screen.id} className="flex-shrink-0 group">
            <div className="mb-2 flex items-center justify-between px-2">
              <span className="text-xs font-semibold text-neutral-400 group-hover:text-[#c9b27c] transition-colors flex items-center gap-1.5">
                <span className="w-2 h-2 rounded-full bg-[#c9b27c]" />
                {screen.title}
              </span>
              <button
                type="button"
                onClick={() => handleInspect(screen.id)}
                className="text-[11px] font-semibold text-[#c9b27c] hover:underline cursor-pointer"
              >
                Open in Simulator →
              </button>
            </div>
            <PhoneFrame screenId={screen.id}>
              {screen.component}
            </PhoneFrame>
          </div>
        ))}
      </div>
    </div>
  );
}
