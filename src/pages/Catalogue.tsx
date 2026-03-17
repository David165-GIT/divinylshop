import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { supabase } from "@/integrations/supabase/client";
import { ArrowLeft, Facebook } from "lucide-react";
import type { Database } from "@/integrations/supabase/types";

type Record = Database["public"]["Tables"]["records"]["Row"];

const Catalogue = () => {
  const [records, setRecords] = useState<Record[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<"vinyl" | "hifi">("vinyl");

  useEffect(() => {
    const fetchRecords = async () => {
      const { data } = await supabase
        .from("records")
        .select("*")
        .eq("is_sold", false)
        .neq("category", "editions_originales")
        .order("created_at", { ascending: false });
      setRecords(data || []);
      setLoading(false);
    };
    fetchRecords();
  }, []);

  const filtered = records.filter((r) => r.category === filter);

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <div className="border-b border-border bg-background/90 backdrop-blur-md sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link to="/" className="text-muted-foreground hover:text-foreground transition-colors">
              <ArrowLeft className="w-5 h-5" />
            </Link>
            <h1 className="text-xl font-display font-bold text-gradient-dark">Catalogue Divinyl</h1>
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
        <div className="bg-muted border border-border rounded-md px-6 py-5 mb-10 text-center">
          <p className="font-display font-bold text-foreground text-lg">Consultez-nous pour les prix ou venez découvrir en boutique</p>
          <p className="text-sm text-muted-foreground font-body mt-1">35 Rue Gautier 1er, 77140 Nemours</p>
        </div>

        {/* Filters */}
        <div className="flex items-center justify-center gap-3 mb-10 flex-wrap">
          {(["vinyl", "hifi"] as const).map((f) => (
            <button
              key={f}
              onClick={() => setFilter(f)}
              className={`px-5 py-2 rounded-sm text-sm font-body tracking-wide transition-all ${
                filter === f
                  ? "bg-foreground text-background font-semibold"
                  : "bg-muted text-muted-foreground hover:text-foreground"
              }`}
            >
              {f === "vinyl" ? "Vinyles" : "Hi-Fi"}
            </button>
          ))}
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
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {filtered.map((record) => (
              <div key={record.id} className="group bg-card border border-border rounded-md overflow-hidden hover:shadow-md transition-shadow">
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
                    <span className="text-4xl text-muted-foreground/30">♫</span>
                  </div>
                )}
                <div className="p-4">
                  <p className="text-xs text-accent font-body uppercase tracking-wide mb-1">
                    {record.category === "vinyl" ? "Vinyle" : record.category === "hifi" ? "Hi-Fi" : "Édition Originale"}
                    {record.genre && ` · ${record.genre}`}
                    {record.condition && ` · ${record.condition}`}
                  </p>
                  <h3 className="font-display font-bold text-foreground leading-tight">{record.title}</h3>
                  <p className="text-sm text-muted-foreground font-body">{record.artist}</p>
                  {record.description && (
                    <p className="text-xs text-muted-foreground font-body mt-2 line-clamp-2">{record.description}</p>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* CTA */}
        <div className="text-center mt-16 py-10 border-t border-border">
          <p className="text-muted-foreground font-body mb-4">
            Intéressé par un article ? Contactez-moi sur Facebook !
          </p>
          <a
            href="https://www.facebook.com/divinyl.shop/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-foreground text-background font-body font-semibold rounded-sm uppercase text-sm hover:opacity-85 transition-all"
          >
            <Facebook className="w-4 h-4" /> Me contacter
          </a>
        </div>
      </div>
    </div>
  );
};

export default Catalogue;
