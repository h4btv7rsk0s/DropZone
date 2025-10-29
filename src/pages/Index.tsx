import Header from '@/components/Header';
import Hero from '@/components/Hero';
import Features from '@/components/Features';
import CreateAirdrop from '@/components/CreateAirdrop';
import AirdropList from '@/components/AirdropList';
import Footer from '@/components/Footer';

const Index = () => {
  return (
    <div className="min-h-screen">
      <Header />
      <main>
        <Hero />
        <Features />
        <CreateAirdrop />
        <AirdropList />
      </main>
      <Footer />
    </div>
  );
};

export default Index;
