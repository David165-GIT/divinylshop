import { Facebook, Package } from "lucide-react";

const SellSection = () => {
  return (
    <section className="py-20 bg-grain">
      <div className="container mx-auto px-4">
        <div className="max-w-2xl mx-auto text-center">
          <Package className="w-10 h-10 text-accent mx-auto mb-6" />
          <h2 className="text-3xl md:text-4xl font-display font-bold text-gradient-dark mb-4">
            Du matériel à vendre ?
          </h2>
          <p className="text-muted-foreground font-body leading-relaxed mb-8">
            Vous avez du matériel Hi-Fi ou des vinyles <span className="text-foreground font-medium">(uniquement par lot)</span> à
            vendre ? Contactez-moi directement sur Facebook pour me proposer vos pièces.
          </p>
          <a
            href="https://www.facebook.com/divinyl.shop/"
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center gap-2 px-8 py-3 bg-foreground text-background font-body font-semibold rounded-sm tracking-wide uppercase text-sm hover:opacity-85 transition-all duration-300"
          >
            <Facebook className="w-4 h-4" />
            Me contacter sur Facebook
          </a>
        </div>
      </div>
    </section>
  );
};

export default SellSection;
