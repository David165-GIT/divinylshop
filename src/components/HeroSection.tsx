import { useEffect, useState } from "react";
import heroImg from "@/assets/shop-interior-2.webp";
import logoText from "@/assets/divinyl-logo-text.webp";
import { Facebook, MapPin, ChevronDown, Calendar as CalendarIcon } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { formatEventDate } from "@/lib/formatEventDate";
import { linkifyText } from "@/lib/linkify";

type FeaturedEvent = {
  id: string;
  title: string;
  event_date: string | null;
  end_date: string | null;
  description: string | null;
  image_url: string | null;
};

const HeroSection = () => {
  const [featured, setFeatured] = useState<FeaturedEvent | null>(null);

  useEffect(() => {
    const fetchFeatured = async () => {
      const { data } = await supabase
        .from("events")
        .select("id, title, event_date, end_date, description, image_url")
        .eq("is_featured", true)
        .maybeSingle();
      if (data) setFeatured(data as FeaturedEvent);
    };
    fetchFeatured();
  }, []);

  return (
    <section id="accueil" className="relative min-h-screen flex flex-col">
      {/* Top - Content */}
      <div className="relative flex-1 flex items-center justify-center bg-background pt-20 pb-2 md:pb-4">
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <h1 className="mb-3 animate-fade-in-up">
            <img src={logoText} alt="Divinyl" className="h-20 md:h-32 mx-auto" width={503} height={128} />
          </h1>
          <div className="w-16 h-0.5 bg-accent mx-auto mb-4 animate-fade-in-up" style={{ animationDelay: "0.15s" }} />
          <p className="text-lg md:text-xl font-body text-muted-foreground tracking-[0.2em] uppercase animate-fade-in-up" style={{ animationDelay: "0.25s" }}>
            Disquaire & Hi-Fi Vintage
          </p>
          <p className="text-sm font-body text-muted-foreground/70 flex items-center justify-center gap-1.5 mt-3 animate-fade-in-up" style={{ animationDelay: "0.35s" }}>
            <MapPin className="w-3.5 h-3.5 text-accent" />
            Nemours (77) — Seine-et-Marne
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: "0.45s" }}>
            <a
              href="#vinyles"
              className="inline-block px-8 py-3 bg-foreground text-background font-body font-semibold rounded-sm tracking-wide uppercase text-sm hover:opacity-85 transition-all duration-300"
            >
              Découvrir
            </a>
            <a
              href="https://www.facebook.com/divinyl.shop/"
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-2 px-8 py-3 border border-border text-muted-foreground font-body font-medium rounded-sm tracking-wide text-sm hover:border-foreground hover:text-foreground transition-all duration-300"
            >
              <Facebook className="w-4 h-4" />
              Facebook
            </a>
          </div>
        </div>
      </div>

      {/* Bottom - Featured event banner OR shop image */}
      {featured ? (
        <div className="relative bg-card border-t border-border overflow-hidden">
          <div className="container mx-auto px-4 py-4 md:py-5">
            <div className="grid grid-cols-1 md:grid-cols-2 md:items-start items-center gap-6 md:gap-12 max-w-6xl mx-auto">
              {featured.image_url && (
                <div className="flex justify-center md:justify-start md:pl-8">
                  <img
                    src={featured.image_url}
                    alt={featured.title}
                    className="w-full max-w-md md:max-w-none h-auto md:h-56 max-h-64 object-contain md:object-cover rounded-md"
                    fetchPriority="high"
                  />
                </div>
              )}
              <div className="flex flex-col justify-start text-center md:text-left md:pr-8">
                <p className="inline-flex items-center justify-center md:justify-start gap-1.5 text-sm md:text-base text-accent font-body uppercase tracking-[0.2em] font-semibold">
                  <CalendarIcon className="w-4 h-4" />
                  Évènement à venir
                </p>
                <h2 className="text-2xl md:text-3xl font-display font-bold text-foreground mt-5">
                  {featured.title}
                </h2>
                {formatEventDate(featured.event_date, featured.end_date) && (
                  <p className="text-sm md:text-base font-body text-accent font-semibold mt-1">
                    {formatEventDate(featured.event_date, featured.end_date)}
                  </p>
                )}
                {featured.description && (
                  <p className="text-sm md:text-base font-body text-muted-foreground mt-3 leading-relaxed whitespace-pre-line break-words">
                    {linkifyText(featured.description)}
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      ) : (
        <div className="relative h-[35vh] md:h-[40vh] overflow-hidden">
          <img
            src={heroImg}
            alt="Intérieur de la boutique Divinyl à Nemours"
            className="w-full h-full object-cover object-center"
            fetchPriority="high"
          />
          <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
        </div>
      )}

    </section>
  );
};

export default HeroSection;
