import { MapPin, Clock, Phone, Mail } from "lucide-react";

const ContactSection = () => {
  return (
    <section id="contact" className="py-24 bg-secondary bg-grain">
      <div className="container mx-auto px-4">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-display font-bold text-gradient-gold mb-4">Contact</h2>
          <p className="text-muted-foreground font-body max-w-md mx-auto">
            Passez nous voir en boutique ou contactez-nous pour toute question.
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-8 max-w-3xl mx-auto">
          <div className="space-y-6">
            <div className="flex items-start gap-4">
              <MapPin className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-display font-bold text-foreground">Adresse</h3>
                <p className="text-sm text-muted-foreground font-body">
                  123 Rue du Vinyle<br />
                  75011 Paris
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Clock className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-display font-bold text-foreground">Horaires</h3>
                <p className="text-sm text-muted-foreground font-body">
                  Mardi – Samedi : 11h – 19h<br />
                  Dimanche : 14h – 18h<br />
                  Lundi : Fermé
                </p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Phone className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-display font-bold text-foreground">Téléphone</h3>
                <p className="text-sm text-muted-foreground font-body">01 23 45 67 89</p>
              </div>
            </div>

            <div className="flex items-start gap-4">
              <Mail className="w-5 h-5 text-primary mt-1 flex-shrink-0" />
              <div>
                <h3 className="font-display font-bold text-foreground">Email</h3>
                <p className="text-sm text-muted-foreground font-body">contact@divinyl.fr</p>
              </div>
            </div>
          </div>

          <div className="bg-card border border-border rounded-sm p-8">
            <h3 className="font-display text-xl font-bold text-foreground mb-4">Envoyez-nous un message</h3>
            <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
              <input
                type="text"
                placeholder="Votre nom"
                className="w-full bg-muted border border-border rounded-sm px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <input
                type="email"
                placeholder="Votre email"
                className="w-full bg-muted border border-border rounded-sm px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors"
              />
              <textarea
                rows={4}
                placeholder="Votre message"
                className="w-full bg-muted border border-border rounded-sm px-4 py-3 text-sm font-body text-foreground placeholder:text-muted-foreground focus:outline-none focus:border-primary transition-colors resize-none"
              />
              <button
                type="submit"
                className="w-full px-6 py-3 bg-primary text-primary-foreground font-body font-semibold rounded-sm tracking-wide uppercase text-sm hover:brightness-110 transition-all duration-300"
              >
                Envoyer
              </button>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default ContactSection;
