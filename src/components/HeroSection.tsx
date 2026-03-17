import heroImg from "@/assets/hero-turntable.png";
import logo from "@/assets/logo-divinyl.png";
import { Facebook, MapPin, ChevronDown } from "lucide-react";

const HeroSection = () => {
  return (
    <section id="accueil" className="relative min-h-screen flex flex-col">
      {/* Top half - Content on clean background */}
      <div className="relative flex-1 flex items-center justify-center bg-background pt-20 pb-8">
        {/* Watermark logo */}
        <img
          src={logo}
          alt=""
          aria-hidden="true"
          className="watermark-logo w-[500px] h-[500px] md:w-[700px] md:h-[700px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain opacity-[0.035]"
        />

        <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
          <img
            src={logo}
            alt="Logo Divinyl"
            className="w-24 h-24 md:w-32 md:h-32 mx-auto mb-8 animate-fade-in-up drop-shadow-sm"
          />
          <h1 className="text-7xl md:text-9xl font-display font-black text-foreground mb-3 animate-fade-in-up tracking-tight" style={{ animationDelay: "0.15s" }}>
            Divinyl
          </h1>
          <div className="w-16 h-0.5 bg-accent mx-auto mb-4 animate-fade-in-up" style={{ animationDelay: "0.3s" }} />
          <p className="text-lg md:text-xl font-body text-muted-foreground tracking-[0.2em] uppercase animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
            Disquaire & Hi-Fi Vintage
          </p>
          <p className="text-sm font-body text-muted-foreground/70 flex items-center justify-center gap-1.5 mt-3 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
            <MapPin className="w-3.5 h-3.5 text-accent" />
            Nemours (77) — Seine-et-Marne
          </p>

          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
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

      {/* Bottom - Full-width image banner */}
      <div className="relative h-[35vh] md:h-[40vh] overflow-hidden">
        <img
          src={heroImg}
          alt="Platine vinyle Shure"
          className="w-full h-full object-cover object-center"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-background/40 to-transparent" />
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-6 left-1/2 -translate-x-1/2 z-20 animate-bounce">
        <ChevronDown className="w-6 h-6 text-background/70" />
      </div>
    </section>
  );
};

export default HeroSection;
