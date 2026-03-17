import logo from "@/assets/logo-divinyl.png";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container mx-auto px-4 text-center">
        <div className="flex items-center justify-center gap-2 mb-4">
          <Disc3 className="w-5 h-5 text-primary" />
          <span className="font-display text-lg font-bold text-gradient-gold">Divinyl</span>
        </div>
        <p className="text-sm text-muted-foreground font-body">
          © {new Date().getFullYear()} Divinyl — Disquaire & Hi-Fi Vintage. Tous droits réservés.
        </p>
      </div>
    </footer>
  );
};

export default Footer;
