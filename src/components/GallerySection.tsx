import { Link } from "react-router-dom";
import shopVinylWall from "@/assets/shop-vinyl-wall.png";
import shopDeepPurple from "@/assets/shop-deep-purple.png";
import shopInterior1 from "@/assets/shop-interior-1.png";

interface GalleryItem {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
  link?: string;
}

const vinylItems: GalleryItem[] = [
  { src: shopVinylWall, alt: "Mur de vinyles chez Divinyl", title: "Notre sélection", subtitle: "Voir tout le catalogue →", link: "/catalogue" },
  { src: shopDeepPurple, alt: "Deep Purple — Made in Japan", title: "Éditions originales", subtitle: "Pressages rares et collectors →", link: "/editions-originales" },
  { src: shopInterior1, alt: "Intérieur de la boutique Divinyl", title: "La boutique", subtitle: "Venez fouiller dans nos bacs" },
];


const GalleryCard = ({ item }: { item: GalleryItem }) => {
  const content = (
    <>
      <img
        src={item.src}
        alt={item.alt}
        className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-110"
        loading="lazy"
      />
      <div className="absolute inset-0 bg-background/0 group-hover:bg-background/80 transition-all duration-500 flex items-end p-6">
        <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
          <h3 className="font-display text-xl font-bold text-foreground">{item.title}</h3>
          <p className={`text-sm font-body mt-1 ${item.link ? "text-accent font-medium" : "text-muted-foreground"}`}>{item.subtitle}</p>
        </div>
      </div>
    </>
  );

  if (item.link) {
    return (
      <Link to={item.link} className="group relative overflow-hidden rounded-md block shadow-sm hover:shadow-lg transition-shadow duration-500">
        {content}
      </Link>
    );
  }

  return (
    <div className="group relative overflow-hidden rounded-md cursor-pointer shadow-sm hover:shadow-lg transition-shadow duration-500">
      {content}
    </div>
  );
};

const GallerySection = () => {
  return (
    <>
      {/* Vinyles */}
      <section id="vinyles" className="relative py-24 bg-grain overflow-hidden">
        <div className="container mx-auto px-4 relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gradient-dark mb-4">Vinyles</h2>
            <p className="text-muted-foreground font-body max-w-md mx-auto">
              Une sélection pointue pour les amateurs de beau son et de belles pochettes.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 max-w-5xl mx-auto">
            {vinylItems.map((item) => (
              <GalleryCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>

    </>
  );
};

export default GallerySection;
