import React, {
  useState,
  useEffect,
  useCallback,
  useMemo,
} from 'react';
import {
  RouterContext,
  LOCATION_CHANGE_EVENT,
  normalizePath,
  pathToScreen,
  screenToPath,
  useLocation,
  useNavigate,
} from './routerUtils';

/**
 * HTML5 History API Browser Router Provider Component
 */
export function BrowserRouter({ children }) {
  const [location, setLocation] = useState(() => {
    if (typeof window === 'undefined') {
      return { pathname: '/', search: '', hash: '' };
    }

    // Hash-to-Browser Path auto-migration (e.g., /#profile -> /profile)
    if (window.location.hash && window.location.hash.length > 1) {
      const hashPath = window.location.hash.replace(/^#\/?/, '/');
      window.history.replaceState(null, '', hashPath);
      return {
        pathname: hashPath,
        search: window.location.search,
        hash: '',
      };
    }

    return {
      pathname: window.location.pathname || '/',
      search: window.location.search || '',
      hash: window.location.hash || '',
    };
  });

  // Listen to both browser Back/Forward (popstate) and programmatic navigation (shaka_location_change)
  useEffect(() => {
    const handleLocationChange = () => {
      setLocation({
        pathname: window.location.pathname || '/',
        search: window.location.search || '',
        hash: window.location.hash || '',
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

    const targetPath = screenToPath(to);
    const isReplace = Boolean(options.replace);

    if (isReplace) {
      window.history.replaceState(options.state || null, '', targetPath);
    } else {
      window.history.pushState(options.state || null, '', targetPath);
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
 * Declarative Routes matcher: matches current pathname against child Route paths
 */
export function Routes({ children }) {
  const location = useLocation();
  const currentPath = normalizePath(location.pathname);
  const currentScreen = pathToScreen(location.pathname);

  const routes = React.Children.toArray(children).filter(
    child => React.isValidElement(child) && child.props.path !== undefined
  );

  // 1. Direct path match
  for (const route of routes) {
    const routePath = normalizePath(route.props.path);
    if (routePath === currentPath) {
      return route.props.element;
    }
  }

  // 2. Screen ID match (handles root '/' matching '/dashboard', '/log-expense' matching '/add-expense', etc.)
  for (const route of routes) {
    const routeScreen = pathToScreen(route.props.path);
    if (routeScreen === currentScreen) {
      return route.props.element;
    }
  }

  // 3. Fallback wildcards or aliases
  for (const route of routes) {
    const routePath = route.props.path;
    if (routePath === '*' || routePath === '/*') {
      return route.props.element;
    }
  }

  // 4. Default to first route or null
  return routes[0]?.props.element || null;
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
  const currentPath = normalizePath(location.pathname);
  const isActive = currentPath === targetPath || pathToScreen(currentPath) === pathToScreen(targetPath);

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
