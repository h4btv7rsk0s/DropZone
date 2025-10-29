import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccount } from 'wagmi';
import { useState } from 'react';
import { Lock, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';

const AirdropDashboard = () => {
  const { address, isConnected } = useAccount();
  const [claiming, setClaiming] = useState(false);
  const [claimed, setClaimed] = useState(false);

  // Mock encrypted data - in real implementation, this would come from FHE contract
  const encryptedAllocation = "0x7f8e9d2a1b3c4d5e6f...";
  const encryptedClaimed = "0x1a2b3c4d5e6f7a8b9c...";
  
  const handleClaim = async () => {
    setClaiming(true);
    
    // Simulate claiming process
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    setClaimed(true);
    setClaiming(false);
    toast.success('Airdrop claimed successfully!', {
      description: 'Your tokens have been transferred to your wallet.',
    });
  };

  if (!isConnected) {
    return (
      <section id="dashboard" className="py-20 px-6">
        <div className="container mx-auto max-w-4xl">
          <Card className="glass-card border-none">
            <CardContent className="pt-12 pb-12 text-center">
              <Lock className="w-16 h-16 text-muted-foreground mx-auto mb-4" />
              <h3 className="text-2xl font-semibold mb-2">Connect Your Wallet</h3>
              <p className="text-muted-foreground">
                Please connect your wallet to view your encrypted airdrop allocation
              </p>
            </CardContent>
          </Card>
        </div>
      </section>
    );
  }

  return (
    <section id="dashboard" className="py-20 px-6">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-12">
          <h2 className="text-4xl font-bold mb-4 gradient-text">Your Airdrop Dashboard</h2>
          <p className="text-muted-foreground">
            All data is encrypted using FHE - Your privacy is guaranteed
          </p>
        </div>

        <div className="grid gap-6">
          {/* Wallet Info */}
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle>Connected Wallet</CardTitle>
              <CardDescription>Your wallet address</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm bg-secondary/50 p-4 rounded-lg break-all">
                {address}
              </div>
            </CardContent>
          </Card>

          {/* Encrypted Allocation */}
          <Card className="glass-card border-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                <CardTitle>Encrypted Allocation</CardTitle>
              </div>
              <CardDescription>Your total airdrop quota (encrypted)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Ciphertext:</p>
                  <p className="font-mono text-sm break-all">{encryptedAllocation}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  <span>Only decryptable by authorized parties</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Encrypted Claimed Amount */}
          <Card className="glass-card border-none">
            <CardHeader>
              <div className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                <CardTitle>Encrypted Claimed Amount</CardTitle>
              </div>
              <CardDescription>Tokens already claimed (encrypted)</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="bg-secondary/50 p-4 rounded-lg">
                  <p className="text-xs text-muted-foreground mb-2">Ciphertext:</p>
                  <p className="font-mono text-sm break-all">{encryptedClaimed}</p>
                </div>
                <div className="flex items-center gap-2 text-sm text-muted-foreground">
                  <Lock className="w-4 h-4" />
                  <span>Protected by FHE encryption</span>
                </div>
              </div>
            </CardContent>
          </Card>

          {/* Claim Action */}
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle>Claim Your Airdrop</CardTitle>
              <CardDescription>
                Claim your allocated tokens securely
              </CardDescription>
            </CardHeader>
            <CardContent>
              {claimed ? (
                <div className="flex items-center justify-center gap-3 py-8 text-green-600">
                  <CheckCircle className="w-8 h-8" />
                  <span className="text-lg font-semibold">Successfully Claimed!</span>
                </div>
              ) : (
                <Button 
                  variant="hero" 
                  size="lg" 
                  className="w-full"
                  onClick={handleClaim}
                  disabled={claiming}
                >
                  {claiming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      Processing Claim...
                    </>
                  ) : (
                    'Claim Airdrop'
                  )}
                </Button>
              )}
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AirdropDashboard;
