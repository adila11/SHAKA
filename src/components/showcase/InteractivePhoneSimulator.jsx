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

export default function InteractivePhoneSimulator() {
  const { currentScreen, isAddExpenseModalOpen, setIsAddExpenseModalOpen } = useFinance();

  const renderActiveScreen = () => {
    switch (currentScreen) {
      case 'login':
        return <Screen1Login />;
      case 'forgot':
        return <Screen2ForgotPassword />;
      case 'dashboard':
        return <Screen3Dashboard />;
      case 'ledger':
        return <Screen4Ledger />;
      case 'add-expense':
        return <Screen5AddExpense />;
      case 'budget':
        return <Screen6Budget />;
      case 'profile':
        return <Screen7Profile />;
      case 'change-pass':
        return <Screen8ChangePassword />;
      default:
        return <Screen3Dashboard />;
    }
  };

  const screenLabels = {
    login: 'Screen 1: Login',
    forgot: 'Screen 2: Forgot Password',
    dashboard: 'Screen 3: Dashboard',
    ledger: 'Screen 4: Ledger',
    'add-expense': 'Screen 5: Add Expense',
    budget: 'Screen 6: Budget Allocation',
    profile: 'Screen 7: Profile & Settings',
    'change-pass': 'Screen 8: Change Password',
  };

  return (
    <div className="flex flex-col items-center justify-center py-4 relative">
      <PhoneFrame
        screenId={currentScreen}
        screenLabel={screenLabels[currentScreen]}
        showLabel={true}
      >
        {renderActiveScreen()}

        {/* Modal Overlay for Add Expense when triggered via Center + button */}
        {isAddExpenseModalOpen && (
          <div className="absolute inset-0 z-50 flex flex-col justify-end">
            <Screen5AddExpense onClose={() => setIsAddExpenseModalOpen(false)} />
          </div>
        )}
      </PhoneFrame>

      {/* Helper caption below phone */}
      <div className="mt-4 text-center">
        <p className="text-xs text-neutral-400">
          Interactive Simulation • Click navigation items, add transactions, or switch screens from the top bar.
        </p>
      </div>
    </div>
  );
}
