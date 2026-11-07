import { lazy, Suspense, useEffect } from 'react';
import { BrowserRouter, Routes, Route } from './router/BrowserRouter';
import { ThemeProvider } from './context/ThemeContext';
import { ToastProvider } from './context/ToastContext';
import { FinanceProvider, useFinance } from './context/FinanceContext';
import { ErrorBoundary } from './components/common/ErrorBoundary';
import ResponsiveLayout from './components/layout/ResponsiveLayout';
import AccessCodePromptModal from './components/modals/AccessCodePromptModal';
import AdminPasswordResetApprovalModal from './components/modals/AdminPasswordResetApprovalModal';
import {
  AuthInitializingScreen,
  ServerUnavailableScreen,
  AccessDeniedScreen,
} from './components/common/AuthFeedbackScreens';
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

function ProtectedRoute({ children, requiredRole = null }) {
  const { authStatus, isLoggedIn, currentUser, retryConnection, setCurrentScreen, error } = useFinance();

  useEffect(() => {
    if (authStatus === 'UNAUTHENTICATED') {
      setCurrentScreen('login');
    }
  }, [authStatus, setCurrentScreen]);

  if (authStatus === 'INITIALIZING') {
    return <AuthInitializingScreen />;
  }

  if (authStatus === 'SERVER_UNAVAILABLE') {
    return <ServerUnavailableScreen onRetry={retryConnection} errorMsg={error} />;
  }

  if (authStatus !== 'AUTHENTICATED' || !isLoggedIn || !currentUser) {
    return <LoginPage />;
  }

  if (requiredRole && currentUser.role !== requiredRole) {
    return <AccessDeniedScreen requiredRole={requiredRole} userRole={currentUser?.role} />;
  }

  return children;
}

function PublicRoute({ children }) {
  const { authStatus, isLoggedIn, setCurrentScreen } = useFinance();

  useEffect(() => {
    if (authStatus === 'AUTHENTICATED' && isLoggedIn) {
      setCurrentScreen('dashboard');
    }
  }, [authStatus, isLoggedIn, setCurrentScreen]);

  if (authStatus === 'INITIALIZING') {
    return <AuthInitializingScreen />;
  }

  if (authStatus === 'AUTHENTICATED' && isLoggedIn) {
    return <DashboardPage />;
  }

  return children;
}

function PageRouter() {
  const {
    viewMode,
    setViewMode,
    isReviewResetModalOpen,
    setIsReviewResetModalOpen,
  } = useFinance();

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

  return (
    <ResponsiveLayout>
      <Suspense fallback={<PageLoadingFallback />}>
        <Routes>
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/dashboard"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/ledger"
            element={
              <ProtectedRoute>
                <LedgerPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/add-expense"
            element={
              <ProtectedRoute>
                <LogExpensePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/log-expense"
            element={
              <ProtectedRoute>
                <LogExpensePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/budget"
            element={
              <ProtectedRoute>
                <BudgetPage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/profile"
            element={
              <ProtectedRoute>
                <ProfilePage />
              </ProtectedRoute>
            }
          />
          <Route
            path="/login"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/signup"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route
            path="/register"
            element={
              <PublicRoute>
                <LoginPage />
              </PublicRoute>
            }
          />
          <Route path="/forgot" element={<ForgotPasswordPage />} />
          <Route path="/forgot-password" element={<ForgotPasswordPage />} />
          <Route path="/change-pass" element={<ChangePasswordPage />} />
          <Route path="/change-password" element={<ChangePasswordPage />} />
          <Route
            path="*"
            element={
              <ProtectedRoute>
                <DashboardPage />
              </ProtectedRoute>
            }
          />
        </Routes>
      </Suspense>
      <AccessCodePromptModal />
      <AdminPasswordResetApprovalModal
        isOpen={isReviewResetModalOpen}
        onClose={() => setIsReviewResetModalOpen(false)}
      />
    </ResponsiveLayout>
  );
}

export default function App() {
  return (
    <ErrorBoundary>
      <BrowserRouter>
        <ThemeProvider>
          <ToastProvider>
            <FinanceProvider>
              <PageRouter />
            </FinanceProvider>
          </ToastProvider>
        </ThemeProvider>
      </BrowserRouter>
    </ErrorBoundary>
  );
}
