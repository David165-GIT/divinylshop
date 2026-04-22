import { useEffect, useState } from "react";
import { Disc3, Headphones, Heart, Star, X } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import paoloImg from "@/assets/paolo-boutique.webp";
import boutiqueImg from "@/assets/boutique-interieur.webp";

const features = [
  {
    icon: Disc3,
    title: "Passion du vinyle",
    description: "Sélection pointue de vinyles rares, pressages originaux et collectors dans tous les styles : rock, jazz, soul, funk, classique…",
  },
  {
    icon: Headphones,
    title: "Hi-Fi Vintage",
    description: "Platines, amplis à tubes, enceintes… Du matériel vintage révisé et prêt à jouer pour une écoute authentique.",
  },
  {
    icon: Heart,
    title: "Conseil & passion",
    description: "Un accueil chaleureux et des conseils personnalisés pour trouver le disque ou l'appareil qu'il vous faut.",
  },
];

const toEmbedUrl = (url: string): string => {
  if (url.includes("/embed/")) return url;
  let id = "";
  const shortMatch = url.match(/youtu\.be\/([a-zA-Z0-9_-]+)/);
  const longMatch = url.match(/[?&]v=([a-zA-Z0-9_-]+)/);
  if (shortMatch) id = shortMatch[1];
  else if (longMatch) id = longMatch[1];
  if (id) return `https://www.youtube.com/embed/${id}`;
  return url;
};

const AboutSection = () => {
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
      <section id="apropos" className="py-16 bg-grain">
        <div className="container mx-auto px-4">
          <div className="text-center mb-10">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gradient-dark mb-4">À propos</h2>
            <p className="text-muted-foreground font-body max-w-lg mx-auto">
              Divinyl, c'est un disquaire indépendant à Nemours (77), né de la passion pour
              la musique et le beau matériel. Venez fouiller dans nos bacs et découvrir des pépites sonores.
            </p>
            <div className="flex items-center justify-center gap-1 mt-4">
              {[...Array(5)].map((_, i) => (
                <Star key={i} className="w-5 h-5 text-accent fill-accent" />
              ))}
              <span className="text-sm text-muted-foreground font-body ml-2">5/5 — 52 avis</span>
            </div>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-6 max-w-2xl mx-auto mb-16">
            <figure className="rounded-md overflow-hidden shadow-md border border-border flex flex-col group hover:shadow-xl hover:-translate-y-2 transition-all duration-500">
              <div className="overflow-hidden flex-1">
                <img
                  src={paoloImg}
                  alt="Paolo vous accueille dans sa boutique Divinyl à Nemours"
                  className="w-full h-full object-cover object-center"
                />
              </div>
              <figcaption className="bg-card px-4 py-3 text-center font-body text-sm text-muted-foreground italic">
                Paolo vous accueille dans sa boutique
              </figcaption>
            </figure>
            <figure
              className="rounded-md overflow-hidden shadow-md border border-border cursor-pointer group hover:shadow-xl hover:-translate-y-2 transition-all duration-500 flex flex-col"
              onClick={() => setVideoOpen(true)}
            >
              <div className="overflow-hidden flex-1">
                <img
                  src={boutiqueImg}
                  alt="L'intérieur de la boutique Divinyl à Nemours"
                  className="w-full h-full object-cover object-center transition-transform duration-700 group-hover:scale-110"
                />
              </div>
              <figcaption className="bg-card px-4 py-3 text-center">
                <span className="font-display text-sm font-bold text-foreground block">La boutique</span>
                <span className="text-sm font-body text-accent font-medium">Voir la vidéo →</span>
              </figcaption>
            </figure>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
            {features.map((feature) => (
              <div
                key={feature.title}
                className="text-center p-8 rounded-md bg-card border border-border hover:border-accent/40 hover:shadow-md transition-all duration-300"
              >
                <feature.icon className="w-10 h-10 text-accent mx-auto mb-4" />
                <h3 className="font-display text-xl font-bold text-foreground mb-2">{feature.title}</h3>
                <p className="text-sm text-muted-foreground font-body leading-relaxed">{feature.description}</p>
              </div>
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

export default AboutSection;
