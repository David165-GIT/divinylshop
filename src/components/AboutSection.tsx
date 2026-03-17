import { Disc3, Headphones, Heart } from "lucide-react";

const features = [
  {
    icon: Disc3,
    title: "Passion du vinyle",
    description: "Chaque disque est sélectionné avec soin pour sa qualité sonore et sa rareté.",
  },
  {
    icon: Headphones,
    title: "Expertise Hi-Fi",
    description: "Conseils personnalisés pour construire votre système d'écoute idéal.",
  },
  {
    icon: Heart,
    title: "Amour du son",
    description: "Nous partageons avec vous la magie du son analogique depuis des années.",
  },
];

const AboutSection = () => {
  return (
    <section id="apropos" className="py-24 bg-grain">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gradient-gold mb-4">À propos</h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto">
            Divinyl, c'est une boutique née de la passion pour la musique et le beau matériel.
            Venez fouiller dans nos bacs et découvrir des pépites sonores.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="text-center p-8 rounded-sm bg-card border border-border hover:border-primary/30 transition-colors duration-300"
            >
              <feature.icon className="w-10 h-10 text-primary mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground font-body">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
