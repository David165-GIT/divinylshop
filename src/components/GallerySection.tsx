import { useEffect, useState } from "react";
import { Link } from "react-router-dom";
import { X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import shopVinylWall from "@/assets/shop-vinyl-wall.png";
import shopDeepPurple from "@/assets/shop-deep-purple.png";
import shopHifi from "@/assets/shop-hifi.png";
import shopInterior1 from "@/assets/shop-interior-1.png";

interface GalleryItem {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  link?: string;
  video?: boolean;
  alwaysShow?: boolean;
}

const vinylItems: GalleryItem[] = [
  { src: shopVinylWall, alt: "Mur de vinyles chez Divinyl", title: "Notre sélection", subtitle: "Voir tout le catalogue →", link: "/catalogue", alwaysShow: true },
  { src: shopDeepPurple, alt: "Deep Purple — Made in Japan", title: "Éditions originales", subtitle: "Pressages rares et collectors →", link: "/editions-originales", alwaysShow: true },
  { src: shopHifi, alt: "Matériel Hi-Fi chez Divinyl", title: "Le matériel Hi-Fi", subtitle: "Voir le matériel disponible →", link: "/catalogue?tab=hifi", alwaysShow: true },
  { src: shopInterior1, alt: "Intérieur de la boutique Divinyl", title: "La boutique", subtitle: "Voir la vidéo →", video: true, alwaysShow: true },
];

const GalleryCard = ({ item, onVideoClick }: { item: GalleryItem; onVideoClick?: () => void }) => {
  const content = (
    <>
      <img
        src={item.src}
        alt={item.alt}
        className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-x-0 bottom-0 bg-background/85 backdrop-blur-sm p-4">
        <h3 className="font-display text-lg font-bold text-foreground">{item.title}</h3>
        <p className={`text-sm font-body mt-0.5 ${item.link || item.video ? "text-accent font-medium" : "text-muted-foreground"}`}>{item.subtitle}</p>
      </div>
    </>
  );

  if (item.link) {
    return (
      <Link to={item.link} className="group relative overflow-hidden rounded-md block shadow-sm hover:shadow-lg transition-shadow duration-500">
        {content}
      </Link>
    );
  }

  if (item.video) {
    return (
      <button onClick={onVideoClick} className="group relative overflow-hidden rounded-md block shadow-sm hover:shadow-lg transition-shadow duration-500 w-full text-left">
        {content}
      </button>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-md cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-500">
      {content}
    </div>
  );
};

const toEmbedUrl = (url: string): string => {
  // Already an embed URL
  if (url.includes("/embed/")) return url;
  // youtu.be/ID or youtube.com/watch?v=ID
  let id = "";
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (shortMatch) id = shortMatch[1];
  else if (longMatch) id = longMatch[1];
  if (id) return `https://www.youtube.com/embed/${id}`;
  return url;
};

const GallerySection = () => {
  const [videoOpen, setVideoOpen] = useState(false);
  const [videoUrl, setVideoUrl] = useState("");

  useEffect(() => {
    const fetchVideoUrl = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "gallery_video_url")
        .single();
      if (data) setVideoUrl(toEmbedUrl(data.value));
    };
    fetchVideoUrl();
  }, []);

  return (
    <>
      {/* Vinyles */}
      <section id="vinyles" className="relative py-24 bg-grain overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gradient-dark mb-4">Sélection Vinyle et Matériel Hifi</h2>
            <p className="text-muted-foreground font-body max-w-md mx-auto">
              Une sélection pointue pour les amateurs de beau son et de belles pochettes.
            </p>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
            {vinylItems.map((item) => (
              <GalleryCard key={item.title} item={item} onVideoClick={() => setVideoOpen(true)} />
            ))}
          </div>
        </div>
      </section>

      {/* Video Modal */}
      {videoOpen && videoUrl && (
        <div
          className="fixed inset-0 z-[100] bg-black/80 flex items-center justify-center p-4"
          onClick={() => setVideoOpen(false)}
        >
          <div
            className="relative bg-background rounded-lg overflow-hidden shadow-2xl max-w-sm w-full"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              onClick={() => setVideoOpen(false)}
              className="absolute top-2 right-2 z-10 bg-background/80 rounded-full p-1 text-foreground hover:bg-background transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
            <div className="aspect-video">
              <iframe
                src={videoUrl}
                width="100%"
                height="100%"
                style={{ border: "none" }}
                allowFullScreen
                allow="autoplay; clipboard-write; encrypted-media; picture-in-picture; web-share"
              />
            </div>
          </div>
        </div>
      )}
    </>
  );
};

export default GallerySection;
