import vinylCrate from "@/assets/vinyl-crate.jpg";
import vinylSpinning from "@/assets/vinyl-spinning.jpg";
import vinylStack from "@/assets/vinyl-stack.jpg";
import hifiVintage from "@/assets/hifi-vintage.jpg";
import tubeAmp from "@/assets/tube-amp.jpg";

interface GalleryItem {
  src: string;
  alt: string;
  title: string;
  subtitle: string;
}

const vinylItems: GalleryItem[] = [
  { src: vinylCrate, alt: "Bac à vinyles", title: "Arrivages récents", subtitle: "Rock, Jazz, Soul, Funk…" },
  { src: vinylSpinning, alt: "Vinyle en rotation", title: "Éditions originales", subtitle: "Pressages rares et collectors" },
  { src: vinylStack, alt: "Pile de vinyles", title: "Sélection du moment", subtitle: "Nos coups de cœur" },
];

const hifiItems: GalleryItem[] = [
  { src: hifiVintage, alt: "Platine vintage", title: "Platines vinyles", subtitle: "Thorens, Technics, Dual…" },
  { src: tubeAmp, alt: "Ampli à tubes", title: "Amplificateurs à tubes", subtitle: "Le son chaud et authentique" },
];

const GalleryCard = ({ item }: { item: GalleryItem }) => (
  <div className="group relative overflow-hidden rounded-sm cursor-pointer">
    <img
      src={item.src}
      alt={item.alt}
      className="w-full aspect-square object-cover transition-transform duration-700 group-hover:scale-110"
      loading="lazy"
    />
    <div className="absolute inset-0 bg-background/0 group-hover:bg-background/70 transition-all duration-500 flex items-end p-6">
      <div className="translate-y-4 opacity-0 group-hover:translate-y-0 group-hover:opacity-100 transition-all duration-500">
        <h3 className="font-display text-xl font-bold text-primary">{item.title}</h3>
        <p className="text-sm text-foreground/70 font-body mt-1">{item.subtitle}</p>
      </div>
    </div>
  </div>
);

const GallerySection = () => {
  return (
    <>
      {/* Vinyles Section */}
      <section id="vinyles" className="py-24 bg-grain">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gradient-gold mb-4">Vinyles</h2>
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

      {/* Hi-Fi Section */}
      <section id="hifi" className="py-24 bg-secondary bg-grain">
        <div className="container mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-display font-bold text-gradient-gold mb-4">Hi-Fi Vintage</h2>
            <p className="text-muted-foreground font-body max-w-md mx-auto">
              Du matériel d'exception pour une écoute authentique et chaleureuse.
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 max-w-4xl mx-auto">
            {hifiItems.map((item) => (
              <GalleryCard key={item.title} item={item} />
            ))}
          </div>
        </div>
      </section>
    </>
  );
};

export default GallerySection;
