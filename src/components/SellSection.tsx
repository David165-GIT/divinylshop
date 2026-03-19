import { Facebook, Package } from "lucide-react";

const SellSection = () => {
  return (
    <section className="py-20 bg-grain">
      <div className="container mx-auto px-4">
        <div className="relative max-w-2xl mx-auto text-center p-10 rounded-lg overflow-hidden">
          {/* Animated glowing border */}
          <div className="absolute inset-0 rounded-lg p-[2px] overflow-hidden">
            <div className="absolute inset-[-200%] animate-[spin_4s_linear_infinite] bg-[conic-gradient(from_0deg,hsl(var(--accent)),hsl(var(--primary)),hsl(var(--accent)),transparent,hsl(var(--accent)))]" />
          </div>
          <div className="absolute inset-[2px] rounded-lg bg-background" />

          {/* Content */}
          <div className="relative z-10">
            <Package className="w-10 h-10 text-accent mx-auto mb-6" />
            <h2 className="text-3xl md:text-4xl font-display font-bold text-gradient-dark mb-4">
              Du matériel à vendre ?
            </h2>
            <p className="text-muted-foreground font-body leading-relaxed mb-8">
              Vous avez du matériel Hi-Fi ou des vinyles <span className="text-foreground font-medium">(uniquement par lot)</span> à
              vendre ? Contactez-moi par Téléphone ou Facebook pour me proposer vos pièces.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
};

export default SellSection;
