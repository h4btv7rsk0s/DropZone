import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';
import { ArrowLeft, Gift, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CONTRACTS, ABIS } from '@/config/contracts';
import { encryptAmount, initializeFHE } from '@/lib/fhe';

interface AirdropClaimProps {
  airdropId: number;
  onBack: () => void;
}

const AirdropClaim = ({ airdropId, onBack }: AirdropClaimProps) => {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [claimAmount, setClaimAmount] = useState('');
  const [claiming, setClaiming] = useState(false);
  const [fheInitialized, setFheInitialized] = useState(false);

  // Initialize FHE on mount
  useEffect(() => {
    if (isConnected && !fheInitialized) {
      initializeFHE()
        .then(() => {
          setFheInitialized(true);
          console.log('FHE SDK initialized');
        })
        .catch((error) => {
          console.error('FHE init failed:', error);
          toast.error('Failed to initialize FHE SDK');
        });
    }
  }, [isConnected, fheInitialized]);

  const handleClaim = async () => {
    if (!claimAmount || !fheInitialized) return;

    setClaiming(true);
    try {
      const amount = BigInt(claimAmount);

      toast.info('Encrypting claim amount...');
      const { encryptedAmount, proof } = await encryptAmount(
        amount,
        CONTRACTS.AirdropFactory,
        address!
      );

      toast.info('Submitting claim...');
      const hash = await writeContractAsync({
        address: CONTRACTS.AirdropFactory,
        abi: ABIS.AirdropFactory,
        functionName: 'claim',
        args: [BigInt(airdropId), encryptedAmount, proof],
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
      }
    } catch (error: any) {
      console.error('[Claim] Error:', error);
      toast.error(error.message || 'Failed to claim');
    } finally {
      setClaiming(false);
    }
  };

  return (
    <section className="py-12 px-6">
      <div className="container mx-auto max-w-3xl">
        <Button variant="outline" size="sm" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>

        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-2">
            <Gift className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold gradient-text">
              Airdrop #{airdropId}
            </h2>
          </div>
          <p className="text-muted-foreground">View and claim your allocation</p>
        </div>

        {!isConnected ? (
          <Card className="glass-card border-none">
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">Connect your wallet to view allocation</p>
            </CardContent>
          </Card>
        ) : !fheInitialized ? (
          <Card className="glass-card border-none">
            <CardContent className="text-center py-12">
              <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
              <p className="text-muted-foreground">Initializing FHE SDK...</p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {/* Claim Interface */}
            <Card className="glass-card border-none">
              <CardHeader>
                <CardTitle>Claim Tokens</CardTitle>
                <CardDescription>
                  Submit encrypted claim request
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Claim Amount (will be encrypted)
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter amount to claim"
                      value={claimAmount}
                      onChange={(e) => setClaimAmount(e.target.value)}
                      disabled={claiming}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 You can only claim up to your remaining allocation
                    </p>
                  </div>
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handleClaim}
                    disabled={claiming || !claimAmount || !fheInitialized}
                  >
                    {claiming ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processing Claim...
                      </>
                    ) : (
                      <>
                        <Gift className="w-4 h-4 mr-2" />
                        Claim Tokens
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          </div>
        )}
      </div>
    </section>
  );
};

export default AirdropClaim;
