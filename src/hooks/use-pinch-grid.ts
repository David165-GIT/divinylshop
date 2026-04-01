import { useRef, useState, useEffect, useCallback } from "react";
import { useIsMobile } from "./use-mobile";

/**
 * Hook that lets mobile users pinch on a grid container
 * to cycle between 1, 2, and 3 columns.
 * Returns { cols, gridRef } – bind gridRef to the grid wrapper.
 */
export function usePinchGrid(defaultCols = 1) {
  const isMobile = useIsMobile();
  const [cols, setCols] = useState(defaultCols);
  const gridRef = useRef<HTMLDivElement>(null);
  const startDistRef = useRef<number | null>(null);
  const startColsRef = useRef(defaultCols);

  // Keep startColsRef in sync
  useEffect(() => {
    startColsRef.current = cols;
  }, [cols]);

  const getDistance = (t1: Touch, t2: Touch) =>
    Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      e.preventDefault();
      startDistRef.current = getDistance(e.touches[0], e.touches[1]);
    }
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 2 || startDistRef.current === null) return;
    e.preventDefault();
    const dist = getDistance(e.touches[0], e.touches[1]);
    const ratio = dist / startDistRef.current;

    const current = startColsRef.current;
    // Pinch in (fingers closer = zoom out = more columns)
    if (ratio < 0.65 && current < 3) {
      setCols(current + 1);
      startDistRef.current = null;
    }
    // Pinch out (fingers apart = zoom in = fewer columns)
    if (ratio > 1.5 && current > 1) {
      setCols(current - 1);
      startDistRef.current = null;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    startDistRef.current = null;
  }, []);

  useEffect(() => {
    if (!isMobile) return;
    const el = gridRef.current;
    if (!el) return;

    // Must NOT be passive so we can preventDefault to stop browser zoom
    el.addEventListener("touchstart", onTouchStart, { passive: false });
    el.addEventListener("touchmove", onTouchMove, { passive: false });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [isMobile, onTouchStart, onTouchMove, onTouchEnd]);

  return { cols: isMobile ? cols : null, gridRef };
}
