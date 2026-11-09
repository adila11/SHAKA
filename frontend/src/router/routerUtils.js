import { createContext, useContext, useMemo, useCallback } from 'react';

export const RouterContext = createContext(null);
export const ParamsContext = createContext({});
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
 * Deconstructs any full URL or relative path into { pathname, search, hash }
 */
export function splitPath(fullPath) {
  if (!fullPath) return { pathname: '/', search: '', hash: '' };

  const str = String(fullPath).trim();
  const hashIdx = str.indexOf('#');
  const withoutHash = hashIdx !== -1 ? str.slice(0, hashIdx) : str;
  const hash = hashIdx !== -1 ? str.slice(hashIdx) : '';

  const searchIdx = withoutHash.indexOf('?');
  const pathname = searchIdx !== -1 ? withoutHash.slice(0, searchIdx) : withoutHash;
  const search = searchIdx !== -1 ? withoutHash.slice(searchIdx) : '';

  return {
    pathname: normalizePathname(pathname),
    search,
    hash,
  };
}

/**
 * Normalizes a pathname string (e.g. '/profile/' -> '/profile', '' -> '/')
 */
export function normalizePathname(pathname) {
  if (!pathname) return '/';
  const clean = String(pathname).trim().replace(/^#\/?/, '');
  const withSlash = clean.startsWith('/') ? clean : `/${clean}`;
  if (withSlash.length > 1 && withSlash.endsWith('/')) {
    return withSlash.slice(0, -1).toLowerCase();
  }
  return withSlash.toLowerCase();
}

/**
 * Normalizes any route string or screen id (preserves query params if provided)
 */
export function normalizePath(pathOrScreen) {
  if (!pathOrScreen) return '/';
  const { pathname, search, hash } = splitPath(pathOrScreen);
  return `${pathname}${search}${hash}`;
}

/**
 * Maps any pathname to its internal canonical screen identifier
 */
export function pathToScreen(pathname) {
  if (!pathname || pathname === '/') return 'dashboard';
  const { pathname: cleanPath } = splitPath(pathname);
  const clean = cleanPath.replace(/^\/+|\/+$/g, '').toLowerCase();

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
 * Maps any internal canonical screen identifier or path to its standard URL path
 */
export function screenToPath(screenOrPath) {
  if (!screenOrPath) return '/dashboard';
  const str = String(screenOrPath).trim();

  // If already a full or relative path starting with slash or containing search/hash
  if (str.startsWith('/') || str.includes('?') || str.includes('#')) {
    const { pathname, search, hash } = splitPath(str);
    return `${pathname}${search}${hash}`;
  }

  const screen = pathToScreen(str);
  return `/${screen}`;
}

/**
 * Matches a route pattern (e.g. '/orders/:status', '/items/:id', '*', '/ledger')
 * against a current pathname and extracts dynamic parameters.
 */
export function matchPath(pattern, pathname) {
  const normPathname = normalizePathname(pathname);
  const normPattern = normalizePathname(pattern);

  // Exact match
  if (normPattern === normPathname) {
    return { matches: true, params: {} };
  }

  // Wildcard match
  if (pattern === '*' || pattern === '/*') {
    return {
      matches: true,
      params: { '*': normPathname.replace(/^\//, '') },
    };
  }

  // Segment-based pattern match for dynamic route parameters (e.g., :id, :status)
  const patternSegments = normPattern.split('/').filter(Boolean);
  const pathSegments = normPathname.split('/').filter(Boolean);

  if (patternSegments.length !== pathSegments.length) {
    return null;
  }

  const params = {};
  for (let i = 0; i < patternSegments.length; i++) {
    const pSeg = patternSegments[i];
    const uSeg = pathSegments[i];

    if (pSeg.startsWith(':')) {
      const paramName = pSeg.slice(1);
      params[paramName] = decodeURIComponent(uSeg);
    } else if (pSeg !== uSeg) {
      return null;
    }
  }

  return { matches: true, params };
}

/**
 * Hook to access current location { pathname, search, hash, state }
 */
export function useLocation() {
  const context = useContext(RouterContext);
  if (!context) {
    if (typeof window !== 'undefined') {
      return {
        pathname: window.location.pathname || '/',
        search: window.location.search || '',
        hash: window.location.hash || '',
        state: null,
      };
    }
    return { pathname: '/', search: '', hash: '', state: null };
  }
  return context.location;
}

/**
 * Hook to access the navigate function: navigate(to, { replace?: boolean, state?: any })
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

/**
 * Hook to access route parameters (e.g. { id: '123' } for /products/:id)
 */
export function useParams() {
  return useContext(ParamsContext) || {};
}

/**
 * Hook to read and update URL query parameters (e.g. ?query=javascript)
 */
export function useSearchParams(defaultInit) {
  const location = useLocation();
  const navigate = useNavigate();

  const searchParams = useMemo(() => {
    const params = new URLSearchParams(location.search);
    if (defaultInit && !location.search) {
      Object.entries(defaultInit).forEach(([k, v]) => {
        if (!params.has(k) && v !== undefined && v !== null) {
          params.set(k, String(v));
        }
      });
    }
    return params;
  }, [location.search, defaultInit]);

  const setSearchParams = useCallback(
    (nextInit, navigateOptions = {}) => {
      let queryString = '';

      if (typeof nextInit === 'function') {
        const current = new URLSearchParams(location.search);
        const updated = nextInit(current);
        queryString = updated ? updated.toString() : '';
      } else if (nextInit instanceof URLSearchParams) {
        queryString = nextInit.toString();
      } else if (nextInit && typeof nextInit === 'object') {
        const current = new URLSearchParams();
        Object.entries(nextInit).forEach(([key, val]) => {
          if (val !== undefined && val !== null && val !== '') {
            current.set(key, String(val));
          }
        });
        queryString = current.toString();
      }

      const search = queryString ? `?${queryString}` : '';
      const target = `${location.pathname}${search}${location.hash || ''}`;
      navigate(target, {
        replace: navigateOptions.replace ?? false,
        state: navigateOptions.state,
      });
    },
    [location.pathname, location.search, location.hash, navigate]
  );

  return [searchParams, setSearchParams];
}
