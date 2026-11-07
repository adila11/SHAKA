import { createContext, useContext } from 'react';

export const RouterContext = createContext(null);
export const LOCATION_CHANGE_EVENT = 'shaka_location_change';

/**
 * Patch History API once so that pushState and replaceState
 * automatically notify all React routers and subscribers.
 */
if (typeof window !== 'undefined' && !window.__shaka_history_patched) {
  window.__shaka_history_patched = true;

  const originalPushState = window.history.pushState.bind(window.history);
  window.history.pushState = function (...args) {
    const result = originalPushState(...args);
    window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
    return result;
  };

  const originalReplaceState = window.history.replaceState.bind(window.history);
  window.history.replaceState = function (...args) {
    const result = originalReplaceState(...args);
    window.dispatchEvent(new Event(LOCATION_CHANGE_EVENT));
    return result;
  };
}

/**
 * Normalizes any route string or screen id into a standard pathname
 * e.g., 'dashboard' -> '/dashboard', '/profile/' -> '/profile', '' -> '/'
 */
export function normalizePath(pathOrScreen) {
  if (!pathOrScreen) return '/';
  const clean = String(pathOrScreen).trim().replace(/^#\/?/, '');
  const withSlash = clean.startsWith('/') ? clean : `/${clean}`;
  if (withSlash.length > 1 && withSlash.endsWith('/')) {
    return withSlash.slice(0, -1).toLowerCase();
  }
  return withSlash.toLowerCase();
}

/**
 * Maps any pathname to its internal canonical screen identifier
 * e.g., '/' -> 'dashboard', '/dashboard' -> 'dashboard', '/ledger' -> 'ledger'
 */
export function pathToScreen(pathname) {
  if (!pathname || pathname === '/') return 'dashboard';
  const clean = String(pathname).replace(/^#\/?/, '').replace(/^\/+|\/+$/g, '').toLowerCase();
  if (!clean || clean === 'dashboard') return 'dashboard';
  if (clean === 'ledger') return 'ledger';
  if (clean === 'add-expense' || clean === 'log-expense') return 'add-expense';
  if (clean === 'budget') return 'budget';
  if (clean === 'profile') return 'profile';
  if (clean === 'login' || clean === 'signup' || clean === 'register') return 'login';
  if (clean === 'forgot' || clean === 'forgot-password') return 'forgot';
  if (clean === 'change-pass' || clean === 'change-password') return 'change-pass';
  return clean;
}

/**
 * Maps any internal canonical screen identifier to its standard URL path
 * e.g., 'dashboard' -> '/dashboard', 'profile' -> '/profile'
 */
export function screenToPath(screenOrPath) {
  if (!screenOrPath) return '/dashboard';
  const str = String(screenOrPath).trim();
  if (str.startsWith('/') && str !== '/') {
    return normalizePath(str);
  }
  const screen = pathToScreen(str);
  return `/${screen}`;
}

/**
 * Access the current location { pathname, search, hash }
 */
export function useLocation() {
  const context = useContext(RouterContext);
  if (!context) {
    if (typeof window !== 'undefined') {
      return {
        pathname: window.location.pathname || '/',
        search: window.location.search || '',
        hash: window.location.hash || '',
      };
    }
    return { pathname: '/', search: '', hash: '' };
  }
  return context.location;
}

/**
 * Access the navigate function: navigate(to, { replace?: boolean })
 */
export function useNavigate() {
  const context = useContext(RouterContext);
  if (!context) {
    return (to, options = {}) => {
      if (typeof window !== 'undefined') {
        const targetPath = screenToPath(to);
        if (options.replace) {
          window.history.replaceState(options.state || null, '', targetPath);
        } else {
          window.history.pushState(options.state || null, '', targetPath);
        }
      }
    };
  }
  return context.navigate;
}
