import { useEffect } from 'react';
import { useLocation } from 'react-router-dom';

/**
 * ScrollToTop component
 * Ensures that whenever a user navigates to a new page (or changes route),
 * the window automatically scrolls to the very top (0, 0) of the page instead of
 * retaining previous scroll depth or landing at the bottom.
 */
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    // Scroll to the very top smoothly and instantly on route navigation
    window.scrollTo({
      top: 0,
      left: 0,
      behavior: 'instant'
    });
  }, [pathname]);

  return null;
}
