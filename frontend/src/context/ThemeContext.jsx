import { createContext, useContext, useEffect, useState, useRef, useCallback } from 'react';

const ThemeContext = createContext(null);

export function ThemeProvider({ children }) {
  const [theme, setThemeState] = useState(() => {
    if (typeof window !== 'undefined') {
      return localStorage.getItem('shaka_theme') || 'dark';
    }
    return 'dark';
  });

  const isTransitioningRef = useRef(false);

  // Apply theme class to DOM root & synchronize storage
  const applyThemeToDOM = useCallback((newTheme) => {
    const root = document.documentElement;
    if (newTheme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
    localStorage.setItem('shaka_theme', newTheme);
  }, []);

  // Initial sync
  useEffect(() => {
    applyThemeToDOM(theme);
  }, [theme, applyThemeToDOM]);

  /**
   * Advanced Circular Reveal Theme Toggle
   * Triggers a circular reveal animation radiating from the clicked button coordinates.
   * Uses the native View Transitions API where supported, with a seamless CSS circular fallback.
   *
   * @param {MouseEvent|Object} event - The click event triggering the transition
   * @param {'dark'|'light'|null} targetTheme - Explicit target theme, or toggles current theme
   */
  const toggleTheme = useCallback((event, targetTheme = null) => {
    const nextTheme = targetTheme || (theme === 'dark' ? 'light' : 'dark');
    if (nextTheme === theme) return;

    // Prevent rapid click overlap
    if (isTransitioningRef.current) return;
    isTransitioningRef.current = true;
    setTimeout(() => {
      isTransitioningRef.current = false;
    }, 450);

    // Extract originating viewport coordinates from event or button bounding box
    let x = window.innerWidth / 2;
    let y = 0;

    if (event) {
      if (event.currentTarget && typeof event.currentTarget.getBoundingClientRect === 'function') {
        const rect = event.currentTarget.getBoundingClientRect();
        x = rect.left + rect.width / 2;
        y = rect.top + rect.height / 2;
      } else if (typeof event.clientX === 'number' && typeof event.clientY === 'number') {
        x = event.clientX;
        y = event.clientY;
      }
    }

    const prefersReducedMotion =
      typeof window !== 'undefined' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    // Maximum distance from originating click to the furthest corner of viewport
    const endRadius = Math.hypot(
      Math.max(x, window.innerWidth - x),
      Math.max(y, window.innerHeight - y)
    );

    // Strategy A: Native View Transitions API
    if (document.startViewTransition && !prefersReducedMotion) {
      const transition = document.startViewTransition(() => {
        applyThemeToDOM(nextTheme);
        setThemeState(nextTheme);
      });

      transition.ready.then(() => {
        document.documentElement.animate(
          {
            clipPath: [
              `circle(0px at ${x}px ${y}px)`,
              `circle(${endRadius}px at ${x}px ${y}px)`,
            ],
          },
          {
            duration: 480,
            easing: 'cubic-bezier(0.4, 0, 0.2, 1)',
            pseudoElement: '::view-transition-new(root)',
          }
        );
      }).catch(() => {
        // Fallback gracefully if transition fails
        applyThemeToDOM(nextTheme);
        setThemeState(nextTheme);
      });
      return;
    }

    // Strategy B: CSS Circular Reveal Fallback for browsers without View Transitions
    if (!prefersReducedMotion && typeof document !== 'undefined') {
      const ripple = document.createElement('div');
      ripple.className = 'theme-circular-ripple';
      const rippleSize = endRadius * 2;
      ripple.style.width = `${rippleSize}px`;
      ripple.style.height = `${rippleSize}px`;
      ripple.style.left = `${x}px`;
      ripple.style.top = `${y}px`;
      ripple.style.backgroundColor = nextTheme === 'dark' ? '#0e0e10' : '#f6f5f2';

      document.body.appendChild(ripple);

      // Trigger expansion
      requestAnimationFrame(() => {
        ripple.classList.add('active');
      });

      setTimeout(() => {
        applyThemeToDOM(nextTheme);
        setThemeState(nextTheme);
        // Fade out & clean up ripple overlay
        ripple.style.opacity = '0';
        setTimeout(() => {
          if (ripple.parentNode) {
            ripple.parentNode.removeChild(ripple);
          }
        }, 300);
      }, 400);
      return;
    }

    // Strategy C: Instant switch for reduced motion
    applyThemeToDOM(nextTheme);
    setThemeState(nextTheme);
  }, [theme, applyThemeToDOM]);

  const setTheme = useCallback((newTheme) => {
    toggleTheme(null, newTheme);
  }, [toggleTheme]);

  return (
    <ThemeContext.Provider
      value={{
        theme,
        setTheme,
        toggleTheme,
        isDark: theme === 'dark',
      }}
    >
      {children}
    </ThemeContext.Provider>
  );
}

export function useTheme() {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
}
