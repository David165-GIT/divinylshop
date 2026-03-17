import { useState, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { Menu, X, Facebook } from "lucide-react";
import logo from "@/assets/logo-divinyl.png";


const navLinks = [
  { label: "Accueil", href: "#accueil" },
  { label: "Vinyles", href: "/catalogue?tab=vinyl" },
  { label: "Hi-Fi", href: "/catalogue?tab=hifi" },
  { label: "Éd. Originales", href: "/editions-originales" },
  { label: "À propos", href: "#apropos" },
  { label: "Contact", href: "#contact" },
];

const Navbar = () => {
  const [open, setOpen] = useState(false);

  return (
    <nav className="fixed top-0 left-0 right-0 z-50 bg-background/85 backdrop-blur-md border-b border-border">
      <div className="container mx-auto flex items-center justify-between py-3 px-4">
        <a href="#accueil" className="flex items-center gap-2 group">
          <img src={logo} alt="Divinyl logo" className="w-8 h-8" />
          <span className="text-2xl font-display font-bold text-gradient-dark">Divinyl</span>
        </a>

        <div className="hidden md:flex items-center gap-8">
          <ul className="flex items-center gap-8">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  className="text-sm font-body text-muted-foreground hover:text-foreground transition-colors duration-300 tracking-wide uppercase"
                >
                  {link.label}
                </a>
              </li>
            ))}
          </ul>
          <a
            href="https://www.facebook.com/divinyl.shop/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
            aria-label="Facebook"
          >
            <Facebook className="w-5 h-5" />
          </a>
        </div>

        <button onClick={() => setOpen(!open)} className="md:hidden text-foreground">
          {open ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
        </button>
      </div>

      {open && (
        <div className="md:hidden bg-background border-b border-border">
          <ul className="flex flex-col items-center gap-4 py-6">
            {navLinks.map((link) => (
              <li key={link.href}>
                <a
                  href={link.href}
                  onClick={() => setOpen(false)}
                  className="text-lg font-body text-muted-foreground hover:text-foreground transition-colors"
                >
                  {link.label}
                </a>
              </li>
            ))}
            <li>
              <a
                href="https://www.facebook.com/divinyl.shop/"
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-2 text-lg font-body text-accent"
              >
                <Facebook className="w-5 h-5" /> Facebook
              </a>
            </li>
          </ul>
        </div>
      )}
    </nav>
  );
};

export default Navbar;
