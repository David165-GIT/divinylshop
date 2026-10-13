import { useState } from "react";
import { ClipboardList, Download, FileUp, Image as ImageIcon, Loader2 } from "lucide-react";
import { fetchAllRecords } from "@/lib/fetchAllRecords";
import { toast } from "@/hooks/use-toast";

const CATEGORY_LABELS: Record<string, string> = {
  vinyl: "Vinyles",
  editions_originales: "Éditions Originales",
  cd: "CD Audio",
  hifi: "Hi-Fi",
};

const esc = (v: unknown) => {
  const s = v === null || v === undefined ? "" : String(v);
  return /[";\n\r]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s;
};

interface SpecialActionsProps {
  onImportCsv: () => void;
  importLoading: boolean;
  onMigrateWebp: () => void;
  webpMigrating: boolean;
  webpProgress: { processed: number; remaining: number; errors: number } | null;
}

const SpecialActions = ({ onImportCsv, importLoading, onMigrateWebp, webpMigrating, webpProgress }: SpecialActionsProps) => {
  const [loading, setLoading] = useState(false);

  const exportInventory = async () => {
    setLoading(true);
    try {
      const records = await fetchAllRecords(undefined, [
        { column: "category", ascending: true },
        { column: "artist", ascending: true },
        { column: "title", ascending: true },
      ]);
      const header = ["ID", "Type", "Artiste / Marque", "Titre", "Genre", "État", "Prix (€)", "Quantité"];
      const rows = records.map((r) => [
        r.id,
        CATEGORY_LABELS[r.category] ?? r.category,
        r.artist,
        r.title,
        r.genre,
        r.condition,
        r.price !== null ? String(r.price).replace(".", ",") : "",
        r.quantity,
      ]);
      const total = records.reduce((s, r) => s + (r.quantity || 0), 0);
      rows.push([], ["", "TOTAL", "", "", "", "", "", total] as never);
      const csv = "\uFEFF" + [header, ...rows].map((row) => row.map(esc).join(";")).join("\r\n");
      const blob = new Blob([csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `inventaire-divinyl-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast({ title: "Inventaire téléchargé", description: `${records.length} articles, ${total} pièces en stock.` });
    } catch (e) {
      console.error(e);
      toast({ title: "Erreur", description: "Impossible de générer l'inventaire.", variant: "destructive" });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-4">
      <h2 className="text-xl font-display font-bold text-foreground">Actions spéciales</h2>

      <div className="bg-card border border-border rounded-md p-4 max-w-xl">
        <div className="flex items-center gap-2 mb-2">
          <ClipboardList className="w-4 h-4 text-accent" />
          <h3 className="font-display font-bold text-foreground text-sm">Inventaire</h3>
        </div>
        <p className="text-sm text-muted-foreground font-body mb-4">
          Télécharge la liste de tous les articles (type, artiste, titre, genre, état, prix, quantité) dans un fichier qui s'ouvre avec Excel.
        </p>
        <button
          onClick={exportInventory}
          disabled={loading}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-foreground text-background text-sm font-body font-medium disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Download className="w-4 h-4" />}
          {loading ? "Préparation…" : "Extraire l'inventaire"}
        </button>
      </div>

      <div className="bg-card border border-border rounded-md p-4 max-w-xl">
        <div className="flex items-center gap-2 mb-2">
          <FileUp className="w-4 h-4 text-accent" />
          <h3 className="font-display font-bold text-foreground text-sm">Importer CSV</h3>
        </div>
        <p className="text-sm text-muted-foreground font-body mb-4">
          Ajoutez des articles ou réimportez un fichier d'inventaire modifié : les articles existants sont mis à jour (quantité, prix, état…) sans doublon.
        </p>
        <div className="flex flex-wrap gap-3">
          <button
            onClick={onImportCsv}
            disabled={importLoading}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-foreground text-background text-sm font-body font-medium disabled:opacity-60"
          >
            {importLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <FileUp className="w-4 h-4" />}
            {importLoading ? "Import…" : "Importer CSV"}
          </button>
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-2 px-4 py-2 rounded-sm border border-border text-foreground text-sm font-body font-medium hover:bg-muted transition-colors"
          >
            <FileDown className="w-4 h-4" />
            Format attendu
          </button>
        </div>
        <p className="text-xs text-muted-foreground font-body mt-3">
          Type accepté : Vinyles, Éditions Originales, CD Audio ou Hi-Fi. Laissez la colonne ID vide pour créer un nouvel article.
        </p>
      </div>

      <div className="bg-card border border-border rounded-md p-4 max-w-xl">
        <div className="flex items-center gap-2 mb-2">
          <ImageIcon className="w-4 h-4 text-accent" />
          <h3 className="font-display font-bold text-foreground text-sm">Convertir en WebP</h3>
        </div>
        <p className="text-sm text-muted-foreground font-body mb-4">
          Convertit toutes les images existantes du site au format WebP, plus léger et plus rapide à charger.
        </p>
        <button
          onClick={onMigrateWebp}
          disabled={webpMigrating}
          className="inline-flex items-center gap-2 px-4 py-2 rounded-sm bg-foreground text-background text-sm font-body font-medium disabled:opacity-60"
        >
          {webpMigrating ? <Loader2 className="w-4 h-4 animate-spin" /> : <ImageIcon className="w-4 h-4" />}
          {webpMigrating
            ? `WebP… ${webpProgress?.processed ?? 0}${webpProgress?.remaining ? ` / reste ${webpProgress.remaining}` : ""}`
            : "Convertir WebP"}
        </button>
      </div>
    </div>
  );
};

export default SpecialActions;
