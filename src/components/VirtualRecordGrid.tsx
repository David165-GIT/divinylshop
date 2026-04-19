import { useEffect, useLayoutEffect, useMemo, useRef, useState } from "react";
import { useWindowVirtualizer } from "@tanstack/react-virtual";
import type { Database } from "@/integrations/supabase/types";

type Record = Database["public"]["Tables"]["records"]["Row"];

interface VirtualRecordGridProps {
  records: Record[];
  cols: number; // 1..5 (mobile/tablet via pinch)
  desktopCols: number; // 3..5 (sm:+)
  isTouchDevice: boolean;
  expandedId: string | null;
  onCardClick: (record: Record) => void;
  gridRef: React.Ref<HTMLDivElement> | ((node: HTMLDivElement | null) => void);
  renderCategoryLabel: (record: Record) => string;
}

/**
 * Virtualized grid for large record lists.
 * Uses window scroll virtualization: only rows visible in viewport are rendered.
 * Computes row height from actual column width to keep aspect-square images crisp.
 */
const VirtualRecordGrid = ({
  records,
  cols,
  desktopCols,
  isTouchDevice,
  expandedId,
  onCardClick,
  gridRef,
  renderCategoryLabel,
}: VirtualRecordGridProps) => {
  const containerRef = useRef<HTMLDivElement | null>(null);

  // Detect actual column count taking into account responsive sm: breakpoint
  const [effectiveCols, setEffectiveCols] = useState<number>(cols || 2);
  const [rowHeight, setRowHeight] = useState<number>(300);

  useLayoutEffect(() => {
    const node = containerRef.current;
    if (!node) return;

    const computeLayout = () => {
      const width = node.clientWidth;
      if (!width) return;
      const isDesktop = !isTouchDevice && window.matchMedia("(min-width: 640px)").matches;
      const c = isDesktop ? desktopCols : cols || 2;
      setEffectiveCols(c);

      // gap matching the original tailwind classes (rough px)
      const gapPxMobile: { [k: number]: number } = { 1: 24, 2: 12, 3: 8, 4: 8, 5: 4 };
      const gapPxDesktop: { [k: number]: number } = { 3: 16, 4: 16, 5: 12 };
      const gap = isDesktop ? gapPxDesktop[c] ?? 16 : gapPxMobile[c] ?? 12;

      const colWidth = (width - gap * (c - 1)) / c;
      // Card = square image + text block. Estimate text height by compactness.
      const isCompact = c >= 2;
      const textHeight = isCompact ? 56 : 140; // p-2 (compact) vs p-4 + meta + desc
      setRowHeight(Math.ceil(colWidth + textHeight + gap));
    };

    computeLayout();
    const ro = new ResizeObserver(computeLayout);
    ro.observe(node);
    window.addEventListener("resize", computeLayout);
    return () => {
      ro.disconnect();
      window.removeEventListener("resize", computeLayout);
    };
  }, [cols, desktopCols, isTouchDevice]);

  const rowCount = Math.ceil(records.length / effectiveCols);

  const [scrollMargin, setScrollMargin] = useState(0);
  useLayoutEffect(() => {
    const update = () => {
      if (containerRef.current) {
        setScrollMargin(containerRef.current.getBoundingClientRect().top + window.scrollY);
      }
    };
    update();
    window.addEventListener("resize", update);
    return () => window.removeEventListener("resize", update);
  }, [effectiveCols]);

  const virtualizer = useWindowVirtualizer({
    count: rowCount,
    estimateSize: () => rowHeight,
    overscan: 4,
    scrollMargin,
  });

  // Re-measure when row height changes
  useEffect(() => {
    virtualizer.measure();
  }, [rowHeight, virtualizer]);

  const items = virtualizer.getVirtualItems();

  // Combine refs
  const setRefs = (node: HTMLDivElement | null) => {
    containerRef.current = node;
    if (typeof gridRef === "function") {
      gridRef(node);
    } else if (gridRef && "current" in gridRef) {
      (gridRef as React.MutableRefObject<HTMLDivElement | null>).current = node;
    }
  };

  const isCompact = effectiveCols >= 2;
  const gridGapClass = useMemo(() => {
    if (effectiveCols === 5) return "gap-1";
    if (effectiveCols === 4) return "gap-2";
    if (effectiveCols === 3) return "gap-2";
    if (effectiveCols === 2) return "gap-3";
    return "gap-6";
  }, [effectiveCols]);

  return (
    <div
      ref={setRefs}
      style={{ height: virtualizer.getTotalSize(), position: "relative", touchAction: "manipulation" }}
    >
      {items.map((virtualRow) => {
        const startIdx = virtualRow.index * effectiveCols;
        const rowRecords = records.slice(startIdx, startIdx + effectiveCols);
        return (
          <div
            key={virtualRow.key}
            data-index={virtualRow.index}
            ref={virtualizer.measureElement}
            style={{
              position: "absolute",
              top: 0,
              left: 0,
              width: "100%",
              transform: `translateY(${virtualRow.start - virtualizer.options.scrollMargin}px)`,
            }}
          >
            <div
              className={`grid ${gridGapClass}`}
              style={{ gridTemplateColumns: `repeat(${effectiveCols}, minmax(0, 1fr))` }}
            >
              {rowRecords.map((record) => (
                <div
                  key={record.id}
                  data-record-id={record.id}
                  className="group bg-card border border-border rounded-md overflow-hidden hover:shadow-md transition-shadow relative cursor-pointer"
                  onClick={() => onCardClick(record)}
                >
                  {record.image_url ? (
                    <div className="overflow-hidden">
                      <img
                        src={record.image_url}
                        alt={`${record.artist} — ${record.title}`}
                        className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                        width={600}
                        height={600}
                        loading="lazy"
                        decoding="async"
                      />
                    </div>
                  ) : (
                    <div className="w-full aspect-square bg-muted flex items-center justify-center">
                      <span className={`${isCompact ? "text-2xl" : "text-4xl"} text-muted-foreground/30`}>♫</span>
                    </div>
                  )}
                  <div className={isCompact ? "p-2" : "p-4"}>
                    {!isCompact && (
                      <p className="text-xs text-accent font-body uppercase tracking-wide mb-1">
                        {renderCategoryLabel(record)}
                        {record.genre && ` · ${record.genre}`}
                        {record.condition && ` · ${record.condition}`}
                      </p>
                    )}
                    <h3
                      className={`font-display font-bold text-foreground leading-tight ${
                        isCompact ? "text-[11px] line-clamp-1" : ""
                      }`}
                    >
                      {record.title}
                    </h3>
                    <p
                      className={`text-muted-foreground font-body ${
                        isCompact ? "text-[10px] line-clamp-1" : "text-sm"
                      }`}
                    >
                      {record.artist}
                    </p>
                    {record.description && !isCompact && (
                      <p
                        className={`text-xs text-muted-foreground font-body mt-2 transition-all duration-300 ${
                          expandedId === record.id ? "" : "line-clamp-2"
                        }`}
                      >
                        {record.description}
                      </p>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        );
      })}
    </div>
  );
};

export default VirtualRecordGrid;
