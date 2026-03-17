import { Facebook } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCallback } from "react";

const Footer = () => {
  const navigate = useNavigate();

  const handleTripleClick = useCallback((e: React.MouseEvent) => {
    if (e.detail === 3) {
      e.preventDefault();
      navigate("/admin/login");
    }
  }, [navigate]);
  return (
    <footer className="py-12 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <a href="/admin/login" className="font-display text-lg font-bold text-gradient-dark hover:opacity-80 transition-opacity">Divinyl</a>
          </div>

          <p className="text-sm text-muted-foreground font-body text-center">
            © {new Date().getFullYear()} Divinyl — 35 Rue Gautier 1er, 77140 Nemours
          </p>

          <a
            href="https://www.facebook.com/divinyl.shop/"
            target="_blank"
            rel="noopener noreferrer"
            className="text-muted-foreground hover:text-foreground transition-colors"
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
