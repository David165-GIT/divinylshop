import { useEffect } from "react";
import { useLocation, useNavigationType } from "react-router-dom";

const SCROLL_KEY = "divinyl-home-scroll";

const ScrollToTop = () => {
  const { pathname, hash } = useLocation();
  const navType = useNavigationType();

  // Always scroll to top on initial page load (no hash)
  useEffect(() => {
    if (!window.location.hash) {
      window.scrollTo(0, 0);
    }
  }, []);

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
    // If there's a hash, scroll to that element
    if (hash) {
      const el = document.querySelector(hash);
      if (el) {
        requestAnimationFrame(() => {
          el.scrollIntoView({ behavior: "smooth" });
        });
        return;
      }
    }

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
  }, [pathname, hash, navType]);

  return null;
};

export default ScrollToTop;
