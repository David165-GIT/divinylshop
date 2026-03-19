import { useState } from "react";
import { X, Check } from "lucide-react";

interface SuggestionPopupProps {
  title: string;
  artist: string;
  imageUrl: string | null;
  description: string | null;
  loading: boolean;
  onAccept: (imageUrl: string | null, description: string | null) => void;
  onReject: () => void;
}

const SuggestionPopup = ({ title, artist, imageUrl, description, loading, onAccept, onReject }: SuggestionPopupProps) => {
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

  if (!imageUrl && !description) {
    return null; // Nothing found, will auto-dismiss
  }

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

        {imageUrl && (
          <div className="mb-4">
            <label className="flex items-center gap-2 mb-2 cursor-pointer">
              <input
                type="checkbox"
                checked={acceptImage}
                onChange={(e) => setAcceptImage(e.target.checked)}
                className="accent-accent"
              />
              <span className="text-sm font-body font-medium text-foreground">Image proposée</span>
            </label>
            <img
              src={imageUrl}
              alt={`${title} - ${artist}`}
              className={`w-full max-w-[250px] aspect-square object-cover rounded-sm mx-auto ${!acceptImage ? "opacity-30" : ""}`}
            />
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
              acceptImage ? imageUrl : null,
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
