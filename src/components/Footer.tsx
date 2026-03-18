import { Facebook } from "lucide-react";
import { useNavigate } from "react-router-dom";
import { useCallback, useRef } from "react";

const Footer = () => {
  const navigate = useNavigate();
  const tapCountRef = useRef(0);
  const tapTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const handleTap = useCallback(() => {
    tapCountRef.current += 1;
    if (tapTimerRef.current) clearTimeout(tapTimerRef.current);
    if (tapCountRef.current >= 3) {
      tapCountRef.current = 0;
      navigate("/admin/login");
      return;
    }
    tapTimerRef.current = setTimeout(() => {
      tapCountRef.current = 0;
    }, 600);
  }, [navigate]);
  return (
    <footer className="py-12 border-t border-border">
      <div className="container mx-auto px-4">
        <div className="flex flex-col md:flex-row items-center justify-between gap-6">
          <div className="flex items-center gap-2">
            <span onClick={handleTap} className="font-display text-lg font-bold text-gradient-dark cursor-default select-none">Divinyl</span>
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
