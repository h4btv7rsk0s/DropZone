import { Shield, Eye, FileKey, Database, Lock, Zap } from 'lucide-react';

const Features = () => {
  const features = [
    {
      icon: Shield,
      title: "FHE Technology",
      description: "Fully Homomorphic Encryption allows computation on encrypted data without decryption"
    },
    {
      icon: Eye,
      title: "Privacy First",
      description: "No one can view your allocation amount - true privacy by design"
    },
    {
      icon: FileKey,
      title: "Encrypted Storage",
      description: "All quota and claim data stored as ciphertext on-chain"
    },
    {
      icon: Database,
      title: "Transparent Verification",
      description: "Verify airdrop distribution without revealing individual allocations"
    },
    {
      icon: Lock,
      title: "Secure Claims",
      description: "Claim your tokens with cryptographic proof of eligibility"
    },
    {
      icon: Zap,
      title: "Efficient Operations",
      description: "Optimized FHE operations for fast and cost-effective transactions"
    }
  ];

  return (
    <section id="features" className="py-20 px-6 relative">
      <div className="absolute inset-0 bg-gradient-to-b from-background via-primary/5 to-background" />
      
      <div className="container mx-auto relative z-10">
        <div className="text-center mb-16">
          <h2 className="text-4xl md:text-5xl font-bold mb-4 gradient-text">
            Why ConfAirdrop?
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Revolutionary privacy-preserving airdrop distribution powered by cutting-edge FHE technology
          </p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <div 
                key={index}
                className="glass-card p-8 rounded-2xl hover:scale-105 transition-all duration-300 hover:shadow-[0_0_30px_rgba(74,159,232,0.2)]"
              >
                <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-primary to-accent flex items-center justify-center mb-6">
                  <Icon className="w-7 h-7 text-white" />
                </div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-muted-foreground leading-relaxed">{feature.description}</p>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
};

export default Features;
