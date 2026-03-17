import { Link } from "react-router-dom";
import bannerImg from "@/assets/eo-banner-deep-purple.png";

const EditionsOriginalesBanner = () => {
  return (
    <section className="py-16 px-4">
      <div className="container mx-auto">
        <Link
          to="/editions-originales"
          className="group relative block overflow-hidden rounded-md border border-border"
        >
          <div className="flex flex-col md:flex-row items-stretch">
            {/* Image */}
            <div className="md:w-1/3 overflow-hidden">
              <img
                src={bannerImg}
                alt="Éditions Originales — Deep Purple Made in Japan"
                className="w-full h-64 md:h-full object-cover group-hover:scale-105 transition-transform duration-700"
              />
            </div>
            {/* Text */}
            <div className="md:w-2/3 bg-card flex flex-col items-center justify-center p-10 md:p-16 text-center">
              <p className="text-xs text-accent font-body uppercase tracking-[0.25em] mb-3">Collection exclusive</p>
              <h2 className="text-3xl md:text-4xl font-display font-bold text-foreground mb-4">Éditions Originales</h2>
              <p className="text-muted-foreground font-body max-w-md mb-6">
                Découvrez notre sélection de pressages originaux et pièces rares de collection.
              </p>
              <span className="inline-flex items-center gap-2 px-6 py-3 bg-foreground text-background font-body font-semibold rounded-sm uppercase text-sm group-hover:opacity-85 transition-all">
                Voir la collection
              </span>
            </div>
          </div>
        </Link>
      </div>
    </section>
  );
};

export default EditionsOriginalesBanner;
