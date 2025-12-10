import Navbar from '@/components/Landing/Navbar';
import Hero from '@/components/Landing/Hero';
import Features from '@/components/Landing/Features';
import HowItWorks from '@/components/Landing/HowItWorks';
import Footer from '@/components/Landing/Footer';

const Landing = () => {
  return (
    <div className="min-h-screen">
      <Navbar />
      <main className="pt-16">
        <Hero />
        <Features />
        <HowItWorks />
      </main>
      <Footer />
    </div>
  );
};

export default Landing;
