import { useEffect } from "react";
import { useLocation } from "react-router-dom";

// Renders nothing — just resets scroll position every time the route
// changes, so navigating to a new page always starts at the top
// instead of keeping wherever you'd scrolled to on the previous page.
export default function ScrollToTop() {
  const { pathname } = useLocation();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [pathname]);

  return null;
}