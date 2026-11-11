import { Heart, Trash2, X } from "lucide-react";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetDescription, SheetTrigger } from "@/components/ui/sheet";
import { clearFavorites, removeFavorite, useFavorites } from "@/lib/favorites";

const CAT: Record<string, string> = { vinyl: "Vinyle", cd: "CD Audio", hifi: "Hi-Fi", editions_originales: "Édition Originale" };

const FavoritesSheet = () => {
  const favorites = useFavorites();
  return (
    <Sheet>
      <SheetTrigger asChild>
        <button type="button" aria-label="Mes repérages" className="relative inline-flex items-center gap-1.5 text-muted-foreground hover:text-foreground transition-colors">
          <Heart className="w-5 h-5" />
          <span className="hidden sm:inline text-sm font-body">Mes repérages</span>
          {favorites.length > 0 && (
            <span className="absolute -top-2 -left-2 min-w-[18px] h-[18px] px-1 rounded-full bg-destructive text-destructive-foreground text-[10px] font-bold flex items-center justify-center">
              {favorites.length}
            </span>
          )}
        </button>
      </SheetTrigger>
      <SheetContent className="w-full sm:max-w-md overflow-y-auto">
        <SheetHeader>
          <SheetTitle className="font-display">Mes repérages</SheetTitle>
          <SheetDescription className="font-body">
            Montrez cette liste en boutique pour retrouver vos disques. Elle reste enregistrée sur cet appareil.
          </SheetDescription>
        </SheetHeader>
        {favorites.length === 0 ? (
          <p className="mt-10 text-center text-sm text-muted-foreground font-body">
            Aucun repérage pour l'instant. Touchez le cœur sur une pochette pour l'ajouter.
          </p>
        ) : (
          <>
            <ul className="mt-6 space-y-3">
              {favorites.map((f) => (
                <li key={f.id} className="flex items-center gap-3 border border-border rounded-md p-2 bg-card">
                  {f.image_url ? (
                    <img src={f.image_url} alt="" className="w-16 h-16 aspect-square object-cover rounded" width={64} height={64} loading="lazy" />
                  ) : (
                    <div className="w-16 h-16 rounded bg-muted flex items-center justify-center text-muted-foreground/40">♫</div>
                  )}
                  <div className="flex-1 min-w-0">
                    <p className="text-[10px] uppercase tracking-wide text-accent font-body">{CAT[f.category] ?? f.category}</p>
                    <p className="font-display font-bold text-sm leading-tight truncate">{f.title}</p>
                    <p className="text-xs text-muted-foreground font-body truncate">{f.artist}</p>
                  </div>
                  <button type="button" aria-label="Retirer" onClick={() => removeFavorite(f.id)} className="p-2 text-muted-foreground hover:text-destructive">
                    <X className="w-4 h-4" />
                  </button>
                </li>
              ))}
            </ul>
            <button type="button" onClick={clearFavorites} className="mt-6 inline-flex items-center gap-2 text-xs text-muted-foreground hover:text-destructive font-body">
              <Trash2 className="w-3.5 h-3.5" /> Vider la liste
            </button>
          </>
        )}
      </SheetContent>
    </Sheet>
  );
};

export default FavoritesSheet;
