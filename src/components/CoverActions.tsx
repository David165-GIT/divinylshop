import { useState } from "react";
import { Heart, ZoomIn } from "lucide-react";
import { Dialog, DialogContent, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { toggleFavorite, useFavorites } from "@/lib/favorites";

type Props = {
  record: { id: string; title: string; artist: string; image_url: string | null; category: string };
  compact?: boolean;
};

const CoverActions = ({ record, compact }: Props) => {
  const favorites = useFavorites();
  const [zoom, setZoom] = useState(false);
  const isFav = favorites.some((f) => f.id === record.id);
  const size = compact ? "w-7 h-7" : "w-9 h-9";
  const icon = compact ? "w-3.5 h-3.5" : "w-4 h-4";
  const btn = `${size} flex items-center justify-center rounded-full bg-background/85 backdrop-blur-sm border border-border shadow-sm transition-colors`;

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
        {record.image_url && (
          <button
            type="button"
            aria-label="Agrandir la pochette"
            onClick={(e) => { e.stopPropagation(); setZoom(true); }}
            className={`${btn} text-muted-foreground hover:text-foreground`}
          >
            <ZoomIn className={icon} />
          </button>
        )}
      </div>
      {record.image_url && (
        <Dialog open={zoom} onOpenChange={setZoom}>
          <DialogContent className="max-w-3xl p-3 sm:p-4" onClick={(e) => e.stopPropagation()}>
            <DialogTitle className="font-display text-base pr-6">{record.title}</DialogTitle>
            <DialogDescription className="font-body -mt-2">{record.artist}</DialogDescription>
            <img
              src={record.image_url}
              alt={`${record.artist} — ${record.title}`}
              className="w-full max-h-[75vh] object-contain rounded-md bg-muted"
              decoding="async"
            />
          </DialogContent>
        </Dialog>
      )}
    </>
  );
};

export default CoverActions;
