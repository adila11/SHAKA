import { lazy, Suspense } from 'react';
import { ThemeProvider } from './context/ThemeContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import ResponsiveLayout from './components/layout/ResponsiveLayout';
import AccessCodePromptModal from './components/modals/AccessCodePromptModal';
import { ArrowLeft } from 'lucide-react';

// Code-splitting & Lazy Loading for all pages
const DashboardPage = lazy(() => import('./pages/DashboardPage'));
const LedgerPage = lazy(() => import('./pages/LedgerPage'));
const BudgetPage = lazy(() => import('./pages/BudgetPage'));
const ProfilePage = lazy(() => import('./pages/ProfilePage'));
const LoginPage = lazy(() => import('./pages/LoginPage'));
const ForgotPasswordPage = lazy(() => import('./pages/ForgotPasswordPage'));
const ChangePasswordPage = lazy(() => import('./pages/ChangePasswordPage'));
const LogExpensePage = lazy(() => import('./pages/LogExpensePage'));
const AllScreensGallery = lazy(() => import('./components/showcase/AllScreensGallery'));

function PageLoadingFallback() {
  return (
    <div className="w-full py-20 flex flex-col items-center justify-center gap-3">
      <div className="w-48 h-1.5 rounded-full overflow-hidden bg-[#26262b]">
        <div className="h-full rounded-full bg-gradient-to-r from-[#c9b27c] via-[#ecd9aa] to-[#c9b27c] animate-pulse w-full" />
      </div>
      <span className="text-xs font-semibold uppercase tracking-wider text-[#8a8a93]">
        Loading view...
      </span>
    </div>
  );
}

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
        <Suspense fallback={<PageLoadingFallback />}>
          <AllScreensGallery />
        </Suspense>
      </div>
    );
  }

  // Proper responsive page layout (default) with lazy-loaded routes
  const renderCurrentPage = () => {
    switch (currentScreen) {
      case 'dashboard':
        return <DashboardPage />;
      case 'ledger':
        return <LedgerPage />;
      case 'add-expense':
      case 'log-expense':
        return <LogExpensePage />;
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

  return (
    <ResponsiveLayout>
      <Suspense fallback={<PageLoadingFallback />}>
        {renderCurrentPage()}
      </Suspense>
      <AccessCodePromptModal />
    </ResponsiveLayout>
  );
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
