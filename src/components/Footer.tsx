import logo from "@/assets/logo-divinyl.png";
import { Facebook } from "lucide-react";

const Footer = () => {
  return (
    <footer className="py-12 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <img src={logo} alt="Divinyl logo" className="w-6 h-6 invert" />
            <span className="font-display text-lg font-bold text-gradient-gold">Divinyl</span>
          </div>

          <p className="text-sm text-muted-foreground font-body text-center">
            © {new Date().getFullYear()} Divinyl — 35 Rue Gautier 1er, 77140 Nemours
          </p>

          <a
            href="https://www.facebook.com/divinyl.shop/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-primary transition-colors"
            aria-label="Facebook Divinyl"
          >
            <Facebook className="w-5 h-5" />
          </a>
        </div>
      </div>
    </footer>
  );
};

export default Footer;
