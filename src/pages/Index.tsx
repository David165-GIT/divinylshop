import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import GallerySection from "@/components/GallerySection";
import AboutSection from "@/components/AboutSection";
import ContactSection from "@/components/ContactSection";
import SellSection from "@/components/SellSection";
import Footer from "@/components/Footer";
import ChristmasOverlay from "@/components/ChristmasOverlay";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <ChristmasOverlay />
      <Navbar />
      <HeroSection />
      <GallerySection />
      <AboutSection />
      <SellSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
