import { Button } from '@/components/ui/button';
import { Shield, Lock, Zap } from 'lucide-react';

const Hero = () => {
  const scrollToDashboard = () => {
    document.getElementById('dashboard')?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <section className="relative min-h-screen flex items-center justify-center overflow-hidden">
      {/* Background gradients */}
      <div className="absolute inset-0 bg-gradient-to-br from-primary/5 via-background to-accent/5" />
      <div className="absolute top-20 right-20 w-96 h-96 bg-primary/10 rounded-full blur-3xl animate-pulse" />
      <div className="absolute bottom-20 left-20 w-96 h-96 bg-accent/10 rounded-full blur-3xl animate-pulse delay-1000" />
      
      <div className="container mx-auto px-6 relative z-10 mt-20">
        <div className="max-w-4xl mx-auto text-center">
          <div className="mb-8 inline-block">
            <div className="text-8xl mb-4 animate-bounce">🪂</div>
          </div>
          
          <h1 className="text-6xl md:text-7xl font-bold mb-6 gradient-text">
            ConfAirdrop
          </h1>
          
          <p className="text-xl md:text-2xl text-foreground/70 mb-8 leading-relaxed">
            Privacy-First Airdrop Distribution with FHE Technology
          </p>
          
          <p className="text-lg text-foreground/60 mb-12 max-w-2xl mx-auto">
            Your allocation and claimed amounts are stored encrypted. No one can peek at your quota - 
            true privacy through Fully Homomorphic Encryption.
          </p>
          
          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-16">
            <Button size="lg" variant="hero" onClick={scrollToDashboard}>
              Get Started
            </Button>
            <Button size="lg" variant="outline">
              Learn More
            </Button>
          </div>
          
          {/* Feature highlights */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mt-16">
            <div className="glass-card p-6 rounded-2xl hover:scale-105 transition-transform duration-300">
              <Shield className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Encrypted Allocations</h3>
              <p className="text-sm text-muted-foreground">
                All quota data stored as ciphertext
              </p>
            </div>
            
            <div className="glass-card p-6 rounded-2xl hover:scale-105 transition-transform duration-300">
              <Lock className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">Zero Knowledge</h3>
              <p className="text-sm text-muted-foreground">
                External parties cannot view your balance
              </p>
            </div>
            
            <div className="glass-card p-6 rounded-2xl hover:scale-105 transition-transform duration-300">
              <Zap className="w-12 h-12 text-primary mx-auto mb-4" />
              <h3 className="text-lg font-semibold mb-2">FHE Powered</h3>
              <p className="text-sm text-muted-foreground">
                Secure computation on encrypted data
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Hero;
