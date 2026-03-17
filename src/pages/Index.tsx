import Navbar from "@/components/Navbar";
import HeroSection from "@/components/HeroSection";
import GallerySection from "@/components/GallerySection";
import EditionsOriginalesBanner from "@/components/EditionsOriginalesBanner";
import AboutSection from "@/components/AboutSection";
import ContactSection from "@/components/ContactSection";
import SellSection from "@/components/SellSection";
import Footer from "@/components/Footer";

const Index = () => {
  return (
    <div className="min-h-screen bg-background">
      <Navbar />
      <HeroSection />
      <GallerySection />
      <EditionsOriginalesBanner />
      <AboutSection />
      <SellSection />
      <ContactSection />
      <Footer />
    </div>
  );
};

export default Index;
