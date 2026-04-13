import { useEffect, useState, useRef } from "react";
import { useIsTablet, useIsTouchDevice } from "@/hooks/use-mobile";
import { useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Facebook, Search, LayoutGrid } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { usePinchGrid } from "@/hooks/use-pinch-grid";
import { fetchAllRecords } from "@/lib/fetchAllRecords";

type Record = Database["public"]["Tables"]["records"]["Row"];

const Catalogue = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState("");
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const scrollToIdRef = useRef<string | null>(null);
  const prevColsRef = useRef<number | null>(null);
  const tabParam = searchParams.get("tab");
  const filter = tabParam === "hifi" ? "hifi" : tabParam === "cd" ? "cd" : "vinyl";
  
  const isTablet = useIsTablet();
  const isTouchDevice = useIsTouchDevice();
  const maxPinchCols = isTablet ? 5 : 3;
  const defaultPinchCols = isTablet ? 3 : 2;
  const { cols, gridRef, setCols } = usePinchGrid(defaultPinchCols, maxPinchCols);
  const [desktopCols, setDesktopCols] = useState(4);
  const cycleDesktopCols = () => setDesktopCols((prev) => (prev >= 5 ? 3 : prev + 1));

  useEffect(() => {
    const prevCols = prevColsRef.current;
    prevColsRef.current = cols;

    if (cols === null) return;

    // Zoom in: multi-col → 1 col (click on article)
    if (scrollToIdRef.current && cols === 1) {
      const id = scrollToIdRef.current;
      scrollToIdRef.current = null;
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-record-id="${id}"]`);
        if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
      });
      return;
    }

    // Zoom out: 1 col → multi-col (pinch), scroll to the article being viewed
    if (prevCols === 1 && cols > 1 && expandedId) {
      requestAnimationFrame(() => {
        const el = document.querySelector(`[data-record-id="${expandedId}"]`);
        if (el) el.scrollIntoView({ behavior: "instant", block: "center" });
      });
    }
  }, [cols, expandedId]);

  useEffect(() => {
    const fetchRecords = async () => {
      const data = await fetchAllRecords(
        { categoryNeq: "editions_originales" },
        [{ column: "artist", ascending: true }, { column: "title", ascending: true }]
      );
      setRecords(data);
      setLoading(false);
    };
    fetchRecords();

    const channel = supabase
      .channel("catalogue-realtime")
      .on("postgres_changes", { event: "*", schema: "public", table: "records" }, () => {
        fetchRecords();
      })
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  const filtered = records.filter((r) => {
    if (r.category !== filter) return false;
    if ((r.quantity ?? 1) === 0) return false;
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      r.title.toLowerCase().includes(q) ||
      r.artist.toLowerCase().includes(q) ||
      (r.genre && r.genre.toLowerCase().includes(q))
    );
  });

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <h1 className="text-xl font-display font-bold text-gradient-dark">{filter === "hifi" ? "Matériel Hi-Fi" : filter === "cd" ? "CD Audio" : "Catalogue Vinyles"}</h1>
          </div>
          <a
            href="https://www.facebook.com/divinyl.shop/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
          >
            <Facebook className="w-5 h-5" />
          </a>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-8 pb-3">
        {/* Banner */}
        <div className="bg-muted border border-border rounded-md px-6 py-5">
          <div className="text-center">
            <p className="font-display font-bold text-foreground text-lg">Consultez-nous pour les prix ou venez découvrir en boutique</p>
          </div>
          <div className="mt-4 pt-3 border-t border-border">
            <p className="text-accent font-body font-semibold italic text-center tracking-wide whitespace-nowrap" style={{ fontSize: 'clamp(0.55rem, 2.8vw, 0.875rem)' }}>✦ Liste non exhaustive, bien plus encore en magasin ✦</p>
          </div>
        </div>
      </div>

      {/* Search - sticky below header */}
      <div className="sticky top-[57px] z-40 bg-background border-b border-border">
        <div className="container mx-auto px-4 py-2">
          <div className="flex items-center gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                placeholder="Rechercher"
                className="w-full pl-9 pr-3 py-2 rounded-md border border-border bg-background text-foreground font-body text-sm focus:outline-none focus:ring-2 focus:ring-ring"
              />
            </div>
            {!isTouchDevice && (
              <button
                onClick={cycleDesktopCols}
                className="hidden sm:flex items-center justify-center w-9 h-9 rounded-md border border-border bg-background text-muted-foreground hover:text-foreground transition-colors shrink-0"
                title={`Affichage ${desktopCols} colonnes`}
              >
                <LayoutGrid className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 pt-4">
        {loading ? (
          <p className="text-center text-muted-foreground font-body py-16">Chargement…</p>
        ) : filtered.length === 0 ? (
          <div className="text-center py-16">
            <p className="text-muted-foreground font-body mb-4">Aucun article disponible pour le moment.</p>
            <a
              href="https://www.facebook.com/divinyl.shop/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 text-accent font-body hover:underline"
            >
              <Facebook className="w-4 h-4" /> Suivez-nous sur Facebook pour les nouveautés
            </a>
          </div>
        ) : (
          <div
            ref={gridRef}
            className={`grid ${
              cols === 5 ? "grid-cols-5 gap-1" : cols === 4 ? "grid-cols-4 gap-2" : cols === 3 ? "grid-cols-3 gap-2" : cols === 2 ? "grid-cols-2 gap-3" : "grid-cols-1 gap-6"
            } ${!isTouchDevice ? (desktopCols === 3 ? "sm:grid-cols-3 sm:gap-4" : desktopCols === 5 ? "sm:grid-cols-5 sm:gap-3" : "sm:grid-cols-4 sm:gap-4") : ""}`}
            style={{ touchAction: "manipulation" }}
          >
            {filtered.map((record) => {
              const isCompact = cols && cols >= 2;
              return (
                <div
                  key={record.id}
                  data-record-id={record.id}
                  className="group bg-card border border-border rounded-md overflow-hidden hover:shadow-md transition-shadow relative cursor-pointer"
                  onClick={() => {
                    if (cols && cols >= 2) {
                      scrollToIdRef.current = record.id;
                      setCols(1);
                      setExpandedId(record.id);
                    } else {
                      setExpandedId(expandedId === record.id ? null : record.id);
                    }
                  }}
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
                        {record.category === "vinyl" ? "Vinyle" : record.category === "cd" ? "CD Audio" : record.category === "hifi" ? "Hi-Fi" : "Édition Originale"}
                        {record.genre && ` · ${record.genre}`}
                        {record.condition && ` · ${record.condition}`}
                      </p>
                    )}
                    <h3 className={`font-display font-bold text-foreground leading-tight ${isCompact ? "text-[11px] line-clamp-1" : ""}`}>{record.title}</h3>
                    <p className={`text-muted-foreground font-body ${isCompact ? "text-[10px] line-clamp-1" : "text-sm"}`}>{record.artist}</p>
                    {record.description && !isCompact && (
                      <p className={`text-xs text-muted-foreground font-body mt-2 transition-all duration-300 ${expandedId === record.id ? "" : "line-clamp-2"}`}>{record.description}</p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-16 py-10 border-t border-border">
          <p className="text-muted-foreground font-body">
            Intéressé par un article ? Contactez-moi par Téléphone ou Facebook !
          </p>
        </div>
      </div>
    </div>
  );
};

export default Catalogue;
