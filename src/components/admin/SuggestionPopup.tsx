import { useState } from "react";
import { X, Check, ChevronLeft, ChevronRight } from "lucide-react";

interface SuggestionPopupProps {
  title: string;
  artist: string;
  imageUrl: string | null;
  imageUrls?: string[];
  description: string | null;
  loading: boolean;
  onAccept: (imageUrl: string | null, description: string | null) => void;
  onReject: () => void;
}

const SuggestionPopup = ({ title, artist, imageUrl, imageUrls = [], description, loading, onAccept, onReject }: SuggestionPopupProps) => {
  const allImages = imageUrls.length > 0 ? imageUrls : (imageUrl ? [imageUrl] : []);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [acceptImage, setAcceptImage] = useState(true);
  const [acceptDescription, setAcceptDescription] = useState(true);

  if (loading) {
    return (
      <div className="fixed inset-0 bg-foreground/50 z-[70] flex items-center justify-center p-4">
        <div className="bg-background rounded-md border border-border p-6 w-full max-w-md text-center">
          <div className="animate-spin w-8 h-8 border-2 border-accent border-t-transparent rounded-full mx-auto mb-4" />
          <p className="text-sm text-muted-foreground font-body">
            Recherche en cours pour « {title} » de {artist}…
          </p>
        </div>
      </div>
    );
  }

  if (allImages.length === 0 && !description) {
    return null;
  }

  const selectedImage = allImages[selectedImageIndex] || null;

  return (
    <div className="fixed inset-0 bg-foreground/50 z-[70] flex items-center justify-center p-4">
      <div className="bg-background rounded-md border border-border p-6 w-full max-w-md max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h3 className="font-display font-bold text-foreground text-lg">Suggestion trouvée</h3>
          <button onClick={onReject}>
            <X className="w-5 h-5 text-muted-foreground" />
          </button>
        </div>

        <p className="text-xs text-muted-foreground font-body mb-4">
          Voici ce que j'ai trouvé pour « {title} » de {artist}. Validez ce que vous souhaitez garder.
        </p>

        {allImages.length > 0 && (
          <div className="mb-4">
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptImage}
                onChange={(e) => setAcceptImage(e.target.checked)}
                className="accent-accent"
              />
              <span className="text-sm font-body font-medium text-foreground">
                Image proposée {allImages.length > 1 ? `(${selectedImageIndex + 1}/${allImages.length})` : ""}
              </span>
            </label>
            <div className={`relative ${!acceptImage ? "opacity-30" : ""}`}>
              <img
                src={selectedImage!}
                alt={`${title} - ${artist}`}
                className="w-full max-w-[250px] aspect-square object-cover rounded-sm mx-auto"
              />
              {allImages.length > 1 && (
                <>
                  <button
                    onClick={() => setSelectedImageIndex((i) => (i - 1 + allImages.length) % allImages.length)}
                    className="absolute left-0 top-1/2 -translate-y-1/2 bg-background/80 border border-border rounded-full p-1 shadow-sm hover:bg-background transition-colors"
                  >
                    <ChevronLeft className="w-4 h-4 text-foreground" />
                  </button>
                  <button
                    onClick={() => setSelectedImageIndex((i) => (i + 1) % allImages.length)}
                    className="absolute right-0 top-1/2 -translate-y-1/2 bg-background/80 border border-border rounded-full p-1 shadow-sm hover:bg-background transition-colors"
                  >
                    <ChevronRight className="w-4 h-4 text-foreground" />
                  </button>
                  <div className="flex justify-center gap-1.5 mt-2">
                    {allImages.map((_, i) => (
                      <button
                        key={i}
                        onClick={() => setSelectedImageIndex(i)}
                        className={`w-2 h-2 rounded-full transition-colors ${i === selectedImageIndex ? "bg-accent" : "bg-border"}`}
                      />
                    ))}
                  </div>
                </>
              )}
            </div>
          </div>
        )}

        {description && (
          <div className="mb-6">
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptDescription}
                onChange={(e) => setAcceptDescription(e.target.checked)}
                className="accent-accent"
              />
              <span className="text-sm font-body font-medium text-foreground">Description proposée</span>
            </label>
            <p className={`text-sm text-muted-foreground font-body bg-muted p-3 rounded-sm ${!acceptDescription ? "opacity-30" : ""}`}>
              {description}
            </p>
          </div>
        )}

        <div className="flex gap-3 justify-center">
          <button
            onClick={onReject}
            className="px-6 py-2 border border-border rounded-sm text-sm font-body font-medium text-muted-foreground hover:text-foreground transition-colors"
          >
            Non merci
          </button>
          <button
            onClick={() => onAccept(
              acceptImage ? selectedImage : null,
              acceptDescription ? description : null,
            )}
            className="inline-flex items-center gap-2 px-6 py-2 bg-foreground text-background rounded-sm text-sm font-body font-semibold hover:opacity-85 transition-all"
          >
            <Check className="w-4 h-4" /> Valider
          </button>
        </div>
      </div>
    </div>
  );
};

export default SuggestionPopup;
