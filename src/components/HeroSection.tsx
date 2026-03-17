import heroImg from "@/assets/hero-shop.jpg";

const HeroSection = () => {
  return (
    <section id="accueil" className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background image */}
      <img
        src={heroImg}
        alt="Intérieur de la boutique Divinyl"
        className="absolute inset-0 w-full h-full object-cover"
      />
      {/* Overlay */}
      <div className="absolute inset-0 bg-warm-overlay" />

      {/* Content */}
      <div className="relative z-10 text-center px-4 max-w-3xl mx-auto">
        <h1
          className="text-6xl md:text-8xl font-display font-black text-gradient-gold mb-6"
          style={{ animationDelay: "0.2s" }}
        >
          Divinyl
        </h1>
        <p className="text-xl md:text-2xl font-body text-foreground/80 mb-4 animate-fade-in-up" style={{ animationDelay: "0.5s" }}>
          Disquaire & Hi-Fi Vintage
        </p>
        <p className="text-base md:text-lg text-muted-foreground font-body max-w-lg mx-auto animate-fade-in-up" style={{ animationDelay: "0.8s" }}>
          Vinyles rares, éditions originales et matériel hi-fi d'exception.
          <br />
          Plongez dans l'univers du son analogique.
        </p>
        <div className="mt-10 animate-fade-in-up" style={{ animationDelay: "1.1s" }}>
          <a
            href="#vinyles"
            className="inline-block px-8 py-3 bg-primary text-primary-foreground font-body font-semibold rounded-sm tracking-wide uppercase text-sm hover:brightness-110 transition-all duration-300"
          >
            Découvrir
          </a>
        </div>
      </div>

      {/* Scroll indicator */}
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 animate-bounce">
        <div className="w-5 h-8 rounded-full border-2 border-primary/50 flex items-start justify-center pt-1.5">
          <div className="w-1 h-2 bg-primary rounded-full" />
        </div>
      </div>
    </section>
  );
};

export default HeroSection;
