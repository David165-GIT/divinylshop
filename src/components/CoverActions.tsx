import { Heart } from "lucide-react";
import { toggleFavorite, useFavorites } from "@/lib/favorites";

type Props = {
  record: { id: string; title: string; artist: string; image_url: string | null; category: string };
  compact?: boolean;
};

const CoverActions = ({ record, compact }: Props) => {
  const favorites = useFavorites();
  const isFav = favorites.some((f) => f.id === record.id);
  const size = compact ? "w-7 h-7" : "w-9 h-9";
  const icon = compact ? "w-3.5 h-3.5" : "w-4 h-4";
  const btn = `${size} flex items-center justify-center rounded-full bg-background/95 border border-border shadow-sm transition-colors`;

  return (
    <>
      <div className="absolute top-1.5 right-1.5 z-10 flex flex-col gap-1.5">
        <button
          type="button"
          aria-label={isFav ? "Retirer de mes repérages" : "Ajouter à mes repérages"}
          aria-pressed={isFav}
          onClick={(e) => {
            e.stopPropagation();
            toggleFavorite({ id: record.id, title: record.title, artist: record.artist, image_url: record.image_url, category: record.category });
          }}
          className={`${btn} ${isFav ? "text-destructive" : "text-muted-foreground hover:text-foreground"}`}
        >
          <Heart className={`${icon} ${isFav ? "fill-current" : ""}`} />
        </button>
      </div>
    </>
  );
};

export default CoverActions;
