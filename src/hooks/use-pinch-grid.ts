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

  const getDistance = (t1: Touch, t2: Touch) =>
    Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length === 2) {
      startDistRef.current = getDistance(e.touches[0], e.touches[1]);
      startColsRef.current = cols;
    }
  }, [cols]);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 2 || startDistRef.current === null) return;
    const dist = getDistance(e.touches[0], e.touches[1]);
    const ratio = dist / startDistRef.current;

    // Pinch out (zoom out / more columns)
    if (ratio < 0.7 && startColsRef.current < 3) {
      setCols(Math.min(startColsRef.current + 1, 3));
      startDistRef.current = null; // prevent repeated triggers
    }
    // Pinch in (zoom in / fewer columns)
    if (ratio > 1.4 && startColsRef.current > 1) {
      setCols(Math.max(startColsRef.current - 1, 1));
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

    el.addEventListener("touchstart", onTouchStart, { passive: true });
    el.addEventListener("touchmove", onTouchMove, { passive: true });
    el.addEventListener("touchend", onTouchEnd, { passive: true });

    return () => {
      el.removeEventListener("touchstart", onTouchStart);
      el.removeEventListener("touchmove", onTouchMove);
      el.removeEventListener("touchend", onTouchEnd);
    };
  }, [isMobile, onTouchStart, onTouchMove, onTouchEnd]);

  return { cols: isMobile ? cols : null, gridRef };
}
