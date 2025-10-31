import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';
import { Lock, CheckCircle, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CONTRACTS, ABIS } from '@/config/contracts';
import { initializeFHE, encryptAmount } from '@/lib/fhe';

const AirdropDashboard = () => {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [claimAmount, setClaimAmount] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [fheInitialized, setFheInitialized] = useState(false);

  // Check if user is owner
  const { data: owner } = useReadContract({
    address: CONTRACTS.ConfAirdrop,
    abi: ABIS.ConfAirdrop,
    functionName: 'owner',
  });

  const isOwner = address && owner && address.toLowerCase() === (owner as string).toLowerCase();

  // Initialize FHE on mount
  useEffect(() => {
    if (isConnected && !fheInitialized) {
      initializeFHE()
        .then(() => {
          setFheInitialized(true);
          console.log('[AirdropDashboard] FHE initialized');
        })
        .catch((error) => {
          console.error('[AirdropDashboard] FHE init failed:', error);
          toast.error('Failed to initialize FHE encryption');
        });
    }
  }, [isConnected, fheInitialized]);

  const handleClaim = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!claimAmount || isNaN(Number(claimAmount)) || Number(claimAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!fheInitialized) {
      toast.error('FHE not initialized. Please wait...');
      return;
    }

    setClaiming(true);

    try {
      const amount = BigInt(claimAmount);

      toast.info('Encrypting claim amount...');
      const { encryptedAmount, proof } = await encryptAmount(
        amount,
        CONTRACTS.ConfAirdrop,
        address
      );

      toast.info('Submitting claim transaction...');
      const hash = await writeContractAsync({
        address: CONTRACTS.ConfAirdrop,
        abi: ABIS.ConfAirdrop,
        functionName: 'claim',
        args: [encryptedAmount, proof],
      });

      toast.info('Waiting for confirmation...');
      const receipt = await publicClient!.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status === 'success') {
        const explorerUrl = `https://sepolia.etherscan.io/tx/${hash}`;
        toast.success(
          <div>
            <p>Claim successful!</p>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-500 hover:underline text-sm"
            >
              View on Etherscan →
            </a>
          </div>
        );
        setClaimAmount('');
      } else {
        toast.error('Transaction failed');
      }
    } catch (error: any) {
      console.error('[Claim] Error:', error);
      toast.error(error.message || 'Failed to claim');
    } finally {
      setClaiming(false);
    }
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
          {isOwner && (
            <div className="mt-4 p-3 bg-primary/10 rounded-lg border border-primary/30">
              <p className="text-sm text-primary font-semibold">
                👑 You are the contract owner
              </p>
            </div>
          )}
        </div>

        <div className="grid gap-6">
          {/* Wallet Info */}
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle>Connected Wallet</CardTitle>
              <CardDescription>Your wallet address on Sepolia</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="font-mono text-sm bg-secondary/50 p-4 rounded-lg break-all">
                {address}
              </div>
            </CardContent>
          </Card>

          {/* FHE Status */}
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle>FHE Encryption Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="flex items-center gap-2">
                {fheInitialized ? (
                  <>
                    <CheckCircle className="w-5 h-5 text-green-500" />
                    <span className="text-green-500">FHE Initialized</span>
                  </>
                ) : (
                  <>
                    <Loader2 className="w-5 h-5 animate-spin text-blue-500" />
                    <span className="text-blue-500">Initializing FHE...</span>
                  </>
                )}
              </div>
            </CardContent>
          </Card>

          {/* Claim Section */}
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle>Claim Your Airdrop</CardTitle>
              <CardDescription>
                Enter the amount you want to claim (encrypted on-chain)
              </CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div>
                  <Input
                    type="number"
                    placeholder="Enter amount to claim"
                    value={claimAmount}
                    onChange={(e) => setClaimAmount(e.target.value)}
                    disabled={claiming || !fheInitialized}
                  />
                  <p className="text-xs text-muted-foreground mt-2">
                    💡 Your claim amount will be encrypted before submission
                  </p>
                </div>
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleClaim}
                  disabled={claiming || !fheInitialized || !claimAmount}
                >
                  {claiming ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Processing Claim...
                    </>
                  ) : !fheInitialized ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin mr-2" />
                      Initializing FHE...
                    </>
                  ) : (
                    'Claim Airdrop'
                  )}
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Encrypted Handles (for debugging) */}
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Lock className="w-5 h-5 text-primary" />
                Encrypted Data (On-Chain)
              </CardTitle>
              <CardDescription>Raw encrypted handles stored on blockchain</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-3 text-xs">
                <div>
                  <p className="text-muted-foreground mb-1">Allocation Handle:</p>
                  <p className="font-mono bg-secondary/50 p-2 rounded break-all">
                    {allocationHandle?.toString() || 'No data'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Claimed Handle:</p>
                  <p className="font-mono bg-secondary/50 p-2 rounded break-all">
                    {claimedHandle?.toString() || 'No data'}
                  </p>
                </div>
                <div>
                  <p className="text-muted-foreground mb-1">Remaining Handle:</p>
                  <p className="font-mono bg-secondary/50 p-2 rounded break-all">
                    {remainingHandle?.toString() || 'No data'}
                  </p>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default AirdropDashboard;
