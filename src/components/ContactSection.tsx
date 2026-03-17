import { MapPin, Clock, Phone, Facebook, ExternalLink } from "lucide-react";
import shopFacadePhoto from "@/assets/shop-facade-photo.png";

const ContactSection = () => {
  return (
    <section id="contact" className="py-24 bg-secondary bg-grain">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gradient-dark mb-4">Nous trouver</h2>
          <p className="text-muted-foreground font-body max-w-md mx-auto">
            Passez nous voir en boutique à Nemours ou retrouvez-nous sur Facebook !
          </p>
        </div>

        <div className="max-w-5xl mx-auto grid grid-cols-1 md:grid-cols-2 gap-12 items-center">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-display font-bold text-foreground">Adresse</h3>
                <p className="text-sm text-muted-foreground font-body">
                  35 Rue Gautier 1er<br />
                  77140 Nemours
                </p>
                <a
                  href="https://maps.google.fr/maps?f=q&source=s_q&hl=fr&geocode=&q=48.265996,2.696041"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1 text-xs text-accent font-body mt-1 hover:underline"
                >
                  Voir sur Google Maps <ExternalLink className="w-3 h-3" />
                </a>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Clock className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-display font-bold text-foreground">Horaires</h3>
                <div className="text-sm text-muted-foreground font-body space-y-0.5">
                  <p>Mardi – Vendredi : 10h–13h / 15h–19h</p>
                  <p>Samedi : 10h–13h / 15h–19h</p>
                  <p>Dimanche & Lundi : Fermé</p>
                </div>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Phone className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-display font-bold text-foreground">Téléphone</h3>
                <p className="text-sm text-muted-foreground font-body">Appelez-nous en boutique</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Facebook className="w-5 h-5 text-accent mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-display font-bold text-foreground">Facebook</h3>
                <a
                  href="https://www.facebook.com/divinyl.shop/"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-accent font-body hover:underline"
                >
                  @divinyl.shop
                </a>
                <p className="text-xs text-muted-foreground font-body mt-0.5">
                  Arrivages, nouveautés et actus en temps réel
                </p>
              </div>
            </div>
          </div>

          <div className="rounded-md overflow-hidden shadow-lg">
            <img
              src={shopFacadePhoto}
              alt="Façade de la boutique Divinyl à Nemours"
              className="w-full h-auto object-cover"
              loading="lazy"
            />
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
  );
};

export default ContactSection;
