import { useRef, useState, useEffect, useCallback } from "react";
import { useIsMobile } from "./use-mobile";

/**
 * Hook that lets mobile users pinch on a grid container
 * to cycle between 1, 2, and 3 columns.
 */
export function usePinchGrid(defaultCols = 1) {
  const isMobile = useIsMobile();
  const [cols, setCols] = useState(defaultCols);
  const [gridElement, setGridElement] = useState<HTMLDivElement | null>(null);
  const startDistRef = useRef<number | null>(null);
  const colsRef = useRef(defaultCols);

  useEffect(() => {
    colsRef.current = cols;
  }, [cols]);

  const gridRef = useCallback((node: HTMLDivElement | null) => {
    setGridElement(node);
  }, []);

  const getDistance = (t1: Touch, t2: Touch) =>
    Math.hypot(t2.clientX - t1.clientX, t2.clientY - t1.clientY);

  const onTouchStart = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 2) return;

    e.preventDefault();
    startDistRef.current = getDistance(e.touches[0], e.touches[1]);
  }, []);

  const onTouchMove = useCallback((e: TouchEvent) => {
    if (e.touches.length !== 2 || startDistRef.current === null) return;

    e.preventDefault();

    const dist = getDistance(e.touches[0], e.touches[1]);
    const ratio = dist / startDistRef.current;
    const currentCols = colsRef.current;

    if (ratio < 0.6 && currentCols < 3) {
      const nextCols = currentCols + 1;
      colsRef.current = nextCols;
      setCols(nextCols);
      startDistRef.current = null;
      return;
    }

    if (ratio > 1.6 && currentCols > 1) {
      const nextCols = currentCols - 1;
      colsRef.current = nextCols;
      setCols(nextCols);
      startDistRef.current = null;
    }
  }, []);

  const onTouchEnd = useCallback(() => {
    startDistRef.current = null;
  }, []);

  useEffect(() => {
    if (!isMobile || !gridElement) return;

    gridElement.addEventListener("touchstart", onTouchStart, { passive: false });
    gridElement.addEventListener("touchmove", onTouchMove, { passive: false });
    gridElement.addEventListener("touchend", onTouchEnd, { passive: true });
    gridElement.addEventListener("touchcancel", onTouchEnd, { passive: true });

    return () => {
      gridElement.removeEventListener("touchstart", onTouchStart);
      gridElement.removeEventListener("touchmove", onTouchMove);
      gridElement.removeEventListener("touchend", onTouchEnd);
      gridElement.removeEventListener("touchcancel", onTouchEnd);
    };
  }, [gridElement, isMobile, onTouchEnd, onTouchMove, onTouchStart]);

  return { cols: isMobile ? cols : null, gridRef, setCols };
}
