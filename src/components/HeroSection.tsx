import heroImg from "@/assets/hero-shop.jpg";
import logo from "@/assets/logo-divinyl.png";
import { Facebook, MapPin } from "lucide-react";

const HeroSection = () => {
  return (
    <section id="accueil" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      <img
        src={heroImg}
        alt="Intérieur de la boutique Divinyl"
        className="absolute inset-0 w-full h-full object-cover"
      />
      <div className="absolute inset-0 bg-warm-overlay" />

      {/* Watermark logo */}
      <img
        src={logo}
        alt=""
        aria-hidden="true"
        className="watermark-logo w-[600px] h-[600px] md:w-[800px] md:h-[800px] top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 object-contain"
      />

      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <img
          src={logo}
          alt="Logo Divinyl"
          className="w-28 h-28 md:w-40 md:h-40 mx-auto mb-6 animate-fade-in-up drop-shadow-md"
        />
        <h1 className="text-6xl md:text-8xl font-display font-black text-gradient-dark mb-4 animate-fade-in-up" style={{ animationDelay: "0.2s" }}>
          Divinyl
        </h1>
        <p className="text-xl md:text-2xl font-body text-foreground/80 mb-2 animate-fade-in-up" style={{ animationDelay: "0.4s" }}>
          Disquaire & Hi-Fi Vintage
        </p>
        <p className="text-sm font-body text-muted-foreground flex items-center justify-center gap-2 mb-6 animate-fade-in-up" style={{ animationDelay: "0.6s" }}>
          <MapPin className="w-4 h-4 text-accent" />
          Nemours (77) — Seine-et-Marne
        </p>
        <p className="text-base md:text-lg text-muted-foreground font-body max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: "0.8s" }}>
          Vinyles rares, éditions originales, pressages collectors
          et matériel hi-fi vintage d'exception.
        </p>
        <div className="mt-10 flex flex-col sm:flex-row items-center justify-center gap-4 animate-fade-in-up" style={{ animationDelay: "1s" }}>
          <a
            href="#vinyles"
            className="inline-block px-8 py-3 bg-primary text-primary-foreground font-body font-semibold rounded-sm tracking-wide uppercase text-sm hover:opacity-90 transition-all duration-300"
          >
            Découvrir
          </a>
          <a
            href="https://www.facebook.com/divinyl.shop/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 border border-foreground/25 text-foreground font-body font-medium rounded-sm tracking-wide text-sm hover:border-accent hover:text-accent transition-all duration-300"
          >
            <Facebook className="w-4 h-4" />
            Suivez-nous
          </a>
        </div>
      </div>

      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-5 h-8 rounded-full border-2 border-foreground/30 flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 bg-foreground/40 rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
