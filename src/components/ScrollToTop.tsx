import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const SCROLL_KEY = "divinyl-home-scroll";

const ScrollToTop = () => {
  const { pathname } = useLocation();
  const navType = useNavigationType();

  // Save scroll position when leaving homepage
  useEffect(() => {
    const handleBeforeNav = () => {
      if (window.location.pathname === "/") {
        sessionStorage.setItem(SCROLL_KEY, String(window.scrollY));
      }
    };

    window.addEventListener("beforeunload", handleBeforeNav);
    return () => window.removeEventListener("beforeunload", handleBeforeNav);
  }, []);

  useEffect(() => {
    // On POP (back/forward), restore saved position for homepage
    if (navType === "POP" && pathname === "/") {
      const saved = sessionStorage.getItem(SCROLL_KEY);
      if (saved) {
        requestAnimationFrame(() => {
          window.scrollTo(0, parseInt(saved, 10));
        });
        return;
      }
    }
    // For PUSH navigation, scroll to top
    window.scrollTo(0, 0);
  }, [pathname, navType]);

  return null;
};

export default ScrollToTop;
