import { useEffect, useState, useCallback, useMemo } from "react";
import { Link, useSearchParams, useNavigate } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Facebook, Search, X } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";
import { usePinchGrid } from "@/hooks/use-pinch-grid";

type Record = Database["public"]["Tables"]["records"]["Row"];

const Catalogue = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [expandedId, setExpandedId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const tabParam = searchParams.get("tab");
  const filter = tabParam === "hifi" ? "hifi" : tabParam === "cd" ? "cd" : "vinyl";
  const { cols, gridRef } = usePinchGrid(1);

  useEffect(() => {
    const fetchRecords = async () => {
      const { data } = await supabase
        .from("records")
        .select("*")
        .not("category", "eq", "editions_originales")
        .order("artist", { ascending: true })
        .order("title", { ascending: true });
      setRecords(data || []);
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

  const filtered = records.filter((r) => r.category === filter);

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

      <div className="container mx-auto px-4 py-8">
        {/* Banner */}
        <div className="bg-muted border border-border rounded-md px-6 py-5 mb-10">
          <div className="text-center">
            <p className="font-display font-bold text-foreground text-lg">Consultez-nous pour les prix ou venez découvrir en boutique</p>
            <p className="text-sm text-muted-foreground font-body mt-1">35 Rue Gautier 1er, 77140 Nemours</p>
          </div>
          {filter !== "hifi" && filter !== "cd" && (
            <div className="mt-4 pt-3 border-t border-border">
              <p className="text-sm text-accent font-body font-semibold italic text-center tracking-wide">✦ Liste non exhaustive, bien plus encore en magasin ✦</p>
            </div>
          )}
        </div>


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
              cols === 3 ? "grid-cols-3 gap-2" : cols === 2 ? "grid-cols-2 gap-3" : "grid-cols-1 gap-6"
            } sm:grid-cols-2 sm:gap-6 lg:grid-cols-3 xl:grid-cols-4`}
            style={{ touchAction: "manipulation" }}
          >
            {filtered.map((record) => {
              const isCompact = cols && cols >= 2;
              return (
                <div
                  key={record.id}
                  className={`group bg-card border border-border rounded-md overflow-hidden hover:shadow-md transition-shadow relative cursor-pointer ${(record.quantity ?? 1) === 0 ? "opacity-70" : ""}`}
                  onClick={() => setExpandedId(expandedId === record.id ? null : record.id)}
                >
                  <span className={`absolute top-1 right-1 z-10 ${isCompact ? "px-1 py-0.5 text-[9px]" : "px-2 py-0.5 text-xs"} rounded-sm font-body font-semibold uppercase tracking-wide ${
                    (record.quantity ?? 1) === 0
                      ? "bg-destructive text-destructive-foreground"
                      : "bg-accent text-accent-foreground"
                  }`}>
                    {(record.quantity ?? 1) === 0 ? "Vendu" : "Dispo"}
                  </span>
                  {record.image_url ? (
                    <div className="overflow-hidden">
                      <img
                        src={record.image_url}
                        alt={`${record.artist} — ${record.title}`}
                        className="w-full aspect-square object-cover group-hover:scale-105 transition-transform duration-500"
                        loading="lazy"
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
