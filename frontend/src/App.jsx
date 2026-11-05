import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import ResponsiveLayout from './components/layout/ResponsiveLayout';
import DashboardPage from './pages/DashboardPage';
import LedgerPage from './pages/LedgerPage';
import BudgetPage from './pages/BudgetPage';
import ProfilePage from './pages/ProfilePage';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ChangePasswordPage from './pages/ChangePasswordPage';
import AllScreensGallery from './components/showcase/AllScreensGallery';
import { ArrowLeft } from 'lucide-react';

function PageRouter() {
  const { currentScreen, viewMode, setViewMode } = useFinance();

  // If user explicitly switched to the Stitch Phone Gallery Showcase
  if (viewMode === 'all') {
    return (
      <div className="min-h-screen bg-[#0e0e10] text-[#e8e8ea] p-4 sm:p-8 font-sans">
        <div className="max-w-7xl mx-auto mb-6 flex items-center justify-between">
          <button
            type="button"
            onClick={() => setViewMode('page')}
            className="px-4 py-2 rounded-xl bg-[#c9b27c] text-neutral-950 font-bold text-xs flex items-center gap-2 hover:bg-[#bba46e] transition-all cursor-pointer shadow-md shadow-[#c9b27c]/20"
          >
            <ArrowLeft className="w-4 h-4" />
            <span>Return to Responsive Web Page</span>
          </button>
          <span className="text-xs text-[#8a8a93]">
            Viewing raw 8-Screen Stitch Phone Gallery
          </span>
        </div>
        <AllScreensGallery />
      </div>
    );
  }

  // Proper responsive page layout (default)
  const renderCurrentPage = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardPage />;
      case 'ledger':
        return <LedgerPage />;
      case 'budget':
        return <BudgetPage />;
      case 'profile':
        return <ProfilePage />;
      case 'login':
        return <LoginPage />;
      case 'forgot':
        return <ForgotPasswordPage />;
      case 'change-pass':
        return <ChangePasswordPage />;
      default:
        return <DashboardPage />;
    }
  };

  return <ResponsiveLayout>{renderCurrentPage()}</ResponsiveLayout>;
}

export default function App() {
  return (
    <ThemeProvider>
      <FinanceProvider>
        <PageRouter />
      </FinanceProvider>
    </ThemeProvider>
  );
}
