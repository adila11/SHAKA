import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  RouterContext,
  ParamsContext,
  LOCATION_CHANGE_EVENT,
  normalizePathname,
  splitPath,
  pathToScreen,
  screenToPath,
  matchPath,
  useLocation,
  useNavigate,
} from './routerUtils';

/**
 * HTML5 History API Browser Router Provider Component
 */
export function BrowserRouter({ children }) {
  const [location, setLocation] = useState(() => {
    if (typeof window === 'undefined') {
      return { pathname: '/', search: '', hash: '', state: null };
    }

    // Hash-to-Browser Path auto-migration (e.g., /#profile -> /profile)
    if (window.location.hash && window.location.hash.length > 1 && !window.location.hash.startsWith('#/')) {
      const hashPath = window.location.hash.replace(/^#\/?/, '/');
      window.history.replaceState(null, '', hashPath);
      return {
        pathname: hashPath,
        search: window.location.search || '',
        hash: '',
        state: null,
      };
    }

    return {
      pathname: window.location.pathname || '/',
      search: window.location.search || '',
      hash: window.location.hash || '',
      state: window.history.state || null,
    };
  });

  // Listen to both browser Back/Forward (popstate) and programmatic navigation (shaka_location_change)
  useEffect(() => {
    const handleLocationChange = () => {
      setLocation({
        pathname: window.location.pathname || '/',
        search: window.location.search || '',
        hash: window.location.hash || '',
        state: window.history.state || null,
      });
    };

    window.addEventListener('popstate', handleLocationChange);
    window.addEventListener(LOCATION_CHANGE_EVENT, handleLocationChange);

    return () => {
      window.removeEventListener('popstate', handleLocationChange);
      window.removeEventListener(LOCATION_CHANGE_EVENT, handleLocationChange);
    };
  }, []);

  const navigate = useCallback((to, options = {}) => {
    if (typeof window === 'undefined') return;

    const targetUrl = screenToPath(to);
    const isReplace = Boolean(options.replace);

    if (isReplace) {
      window.history.replaceState(options.state || null, '', targetUrl);
    } else {
      window.history.pushState(options.state || null, '', targetUrl);
    }
  }, []);

  const contextValue = useMemo(
    () => ({
      location,
      navigate,
    }),
    [location, navigate]
  );

  return (
    <RouterContext.Provider value={contextValue}>
      {children}
    </RouterContext.Provider>
  );
}

/**
 * Declarative Route component
 */
export function Route(props) {
  return props.element || null;
}

/**
 * Declarative Routes matcher: matches current pathname against child Route patterns
 */
export function Routes({ children }) {
  const location = useLocation();
  const currentPath = normalizePathname(location.pathname);
  const currentScreen = pathToScreen(location.pathname);

  const routes = React.Children.toArray(children).filter(
    child => React.isValidElement(child) && child.props.path !== undefined
  );

  let wildcardRoute = null;

  // 1. Direct or dynamic pattern matching
  for (const route of routes) {
    const routePattern = route.props.path;
    if (routePattern === '*' || routePattern === '/*') {
      wildcardRoute = route;
      continue;
    }

    const match = matchPath(routePattern, currentPath);
    if (match) {
      return (
        <ParamsContext.Provider value={match.params}>
          {route.props.element}
        </ParamsContext.Provider>
      );
    }
  }

  // 2. Canonical screen ID match for route aliases (e.g. /log-expense -> /add-expense)
  for (const route of routes) {
    const routePattern = route.props.path;
    if (routePattern === '*' || routePattern === '/*') continue;

    const routeScreen = pathToScreen(routePattern);
    if (routeScreen && routeScreen === currentScreen && routeScreen !== currentPath.replace(/^\//, '')) {
      return (
        <ParamsContext.Provider value={{}}>
          {route.props.element}
        </ParamsContext.Provider>
      );
    }
  }

  // 3. Render wildcard route (Custom 404 handler)
  if (wildcardRoute) {
    return (
      <ParamsContext.Provider value={{ '*': currentPath.replace(/^\//, '') }}>
        {wildcardRoute.props.element}
      </ParamsContext.Provider>
    );
  }

  return null;
}

/**
 * Declarative Link component that uses HTML5 history.pushState
 */
export function Link({ to, replace = false, onClick, className = '', children, ...props }) {
  const navigate = useNavigate();

  const handleClick = (e) => {
    if (onClick) onClick(e);
    // Ignore modified clicks (Ctrl+click, Cmd+click, middle click) so browser can open in new tab
    if (
      !e.defaultPrevented &&
      e.button === 0 &&
      !e.metaKey &&
      !e.altKey &&
      !e.ctrlKey &&
      !e.shiftKey
    ) {
      e.preventDefault();
      navigate(to, { replace });
    }
  };

  const href = screenToPath(to);

  return (
    <a href={href} onClick={handleClick} className={className} {...props}>
      {children}
    </a>
  );
}

/**
 * Declarative NavLink component with active state support
 */
export function NavLink({
  to,
  replace = false,
  className = '',
  activeClassName = '',
  children,
  ...props
}) {
  const location = useLocation();
  const targetPath = screenToPath(to);
  const currentPath = normalizePathname(location.pathname);
  const targetPathname = splitPath(targetPath).pathname;
  const isActive = currentPath === targetPathname || pathToScreen(currentPath) === pathToScreen(targetPathname);

  const resolvedClass =
    typeof className === 'function'
      ? className({ isActive })
      : `${className} ${isActive ? activeClassName : ''}`.trim();

  return (
    <Link to={to} replace={replace} className={resolvedClass} {...props}>
      {typeof children === 'function' ? children({ isActive }) : children}
    </Link>
  );
}

/**
 * Declarative Navigate redirect component
 */
export function Navigate({ to, replace = true }) {
  const navigate = useNavigate();

  useEffect(() => {
    navigate(to, { replace });
  }, [navigate, to, replace]);

  return null;
}
