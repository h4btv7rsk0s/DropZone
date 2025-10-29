import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import OwnerPanel from '@/components/OwnerPanel';
import AirdropDashboard from '@/components/AirdropDashboard';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <OwnerPanel />
        <AirdropDashboard />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
