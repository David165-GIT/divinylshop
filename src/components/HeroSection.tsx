import heroImg from "@/assets/shop-interior-2.png";
import logoText from "@/assets/divinyl-logo-text.png";
import { Facebook, MapPin, ChevronDown } from "lucide-react";
import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

const HeroSection = () => {
  const [christmasMode, setChristmasMode] = useState(false);

  useEffect(() => {
    const fetchMode = async () => {
      const { data } = await supabase
        .from("site_settings")
        .select("value")
        .eq("key", "christmas_mode")
        .single();
      setChristmasMode(data?.value === "true");
    };
    fetchMode();

    const channel = supabase
      .channel("christmas-hero")
      .on(
        "postgres_changes",
        { event: "*", schema: "public", table: "site_settings", filter: "key=eq.christmas_mode" },
        (payload: any) => {
          setChristmasMode(payload.new?.value === "true");
        }
      )
      .subscribe();

    return () => { supabase.removeChannel(channel); };
  }, []);

  return (
    <section id="accueil" className="relative min-h-screen flex flex-col">
      {/* Top - Content */}
      <div className="relative flex-1 flex items-center justify-center bg-background pt-20 pb-8">
        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <h1 className="mb-3 animate-fade-in-up flex items-center justify-center gap-4">
            <img src={logoText} alt="Divinyl" className="h-20 md:h-32" />
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

      {/* Bottom - Full-width image */}
      <div className="relative h-[35vh] md:h-[40vh] overflow-hidden">
        <img
          src={heroImg}
          alt="Intérieur de la boutique Divinyl à Nemours"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/30 to-transparent" />
      </div>

      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <ChevronDown className="w-6 h-6 text-foreground/40" />
      </div>
    </section>
  );
};

export default HeroSection;
