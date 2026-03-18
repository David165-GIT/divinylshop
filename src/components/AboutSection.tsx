import { Disc3, Headphones, Heart, Star } from "lucide-react";
import paoloImg from "@/assets/paolo-boutique.png";

const features = [
  {
    icon: Disc3,
    title: "Passion du vinyle",
    description: "Sélection pointue de vinyles rares, pressages originaux et collectors dans tous les styles : rock, jazz, soul, funk, classique…",
  },
  {
    icon: Headphones,
    title: "Hi-Fi Vintage",
    description: "Platines, amplis à tubes, enceintes… Du matériel vintage révisé et prêt à jouer pour une écoute authentique.",
  },
  {
    icon: Heart,
    title: "Conseil & passion",
    description: "Un accueil chaleureux et des conseils personnalisés pour trouver le disque ou l'appareil qu'il vous faut.",
  },
];

const AboutSection = () => {
  return (
    <section id="apropos" className="py-24 bg-grain">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gradient-dark mb-4">À propos</h2>
          <p className="text-muted-foreground font-body max-w-lg mx-auto">
            Divinyl, c'est un disquaire indépendant à Nemours (77), né de la passion pour
            la musique et le beau matériel. Venez fouiller dans nos bacs et découvrir des pépites sonores.
          </p>
          <div className="flex items-center justify-center gap-1 mt-4">
            {[...Array(5)].map((_, i) => (
              <Star key={i} className="w-5 h-5 text-accent fill-accent" />
            ))}
            <span className="text-sm text-muted-foreground font-body ml-2">5/5 — 52 avis</span>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 max-w-4xl mx-auto">
          {features.map((feature) => (
            <div
              key={feature.title}
              className="text-center p-8 rounded-md bg-card border border-border hover:border-accent/40 hover:shadow-md transition-all duration-300"
            >
              <feature.icon className="w-10 h-10 text-accent mx-auto mb-4" />
              <h3 className="font-display text-xl font-bold text-foreground mb-2">{feature.title}</h3>
              <p className="text-sm text-muted-foreground font-body leading-relaxed">{feature.description}</p>
            </div>
          ))}
        </div>
      </div>
    </section>
  );
};

export default AboutSection;
