import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';
import { ArrowLeft, Gift, Loader2, Eye, EyeOff } from 'lucide-react';
import { toast } from 'sonner';
import { CONTRACTS, ABIS } from '@/config/contracts';
import { encryptAmount, decryptAmount, initializeFHE } from '@/lib/fhe';

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
  const [decryptedAllocation, setDecryptedAllocation] = useState<string | null>(null);
  const [decryptedClaimed, setDecryptedClaimed] = useState<string | null>(null);
  const [decrypting, setDecrypting] = useState(false);
  const [fheInitialized, setFheInitialized] = useState(false);
  const [showEncrypted, setShowEncrypted] = useState(false);

  // Read encrypted handles
  const { data: allocationHandle, refetch: refetchAllocation } = useReadContract({
    address: CONTRACTS.AirdropFactory,
    abi: ABIS.AirdropFactory,
    functionName: 'getMyAllocation',
    args: [BigInt(airdropId)],
  });

  const { data: claimedHandle, refetch: refetchClaimed } = useReadContract({
    address: CONTRACTS.AirdropFactory,
    abi: ABIS.AirdropFactory,
    functionName: 'getMyClaimed',
    args: [BigInt(airdropId)],
  });

  // Initialize FHE on mount
  useEffect(() => {
    if (isConnected && !fheInitialized) {
      initializeFHE()
        .then(() => {
          setFheInitialized(true);
          toast.success('FHE SDK initialized');
        })
        .catch((error) => {
          console.error('FHE init failed:', error);
          toast.error('Failed to initialize FHE SDK');
        });
    }
  }, [isConnected, fheInitialized]);

  // Auto-decrypt when data available
  useEffect(() => {
    if (fheInitialized && address && allocationHandle && claimedHandle) {
      handleDecrypt();
    }
  }, [fheInitialized, address, allocationHandle, claimedHandle]);

  const handleDecrypt = async () => {
    if (!address || !allocationHandle || !claimedHandle) return;

    setDecrypting(true);
    try {
      const allocBigInt = await decryptAmount(
        allocationHandle as string,
        CONTRACTS.AirdropFactory,
        address
      );
      setDecryptedAllocation(allocBigInt.toString());

      const claimedBigInt = await decryptAmount(
        claimedHandle as string,
        CONTRACTS.AirdropFactory,
        address
      );
      setDecryptedClaimed(claimedBigInt.toString());

      toast.success('Decrypted successfully!');
    } catch (error: any) {
      console.error('[Decrypt] Error:', error);
      toast.error('Failed to decrypt: ' + error.message);
    } finally {
      setDecrypting(false);
    }
  };

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
        toast.success('Claim successful!');
        setClaimAmount('');
        setTimeout(() => {
          refetchAllocation();
          refetchClaimed();
          handleDecrypt();
        }, 2000);
      }
    } catch (error: any) {
      console.error('[Claim] Error:', error);
      toast.error(error.message || 'Failed to claim');
    } finally {
      setClaiming(false);
    }
  };

  const calculateRemaining = () => {
    if (decryptedAllocation && decryptedClaimed) {
      return (BigInt(decryptedAllocation) - BigInt(decryptedClaimed)).toString();
    }
    return '0';
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
            {/* Allocation Status */}
            <Card className="glass-card border-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <CardTitle>Your Allocation</CardTitle>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setShowEncrypted(!showEncrypted)}
                  >
                    {showEncrypted ? (
                      <><EyeOff className="w-4 h-4 mr-2" />Hide Raw</>
                    ) : (
                      <><Eye className="w-4 h-4 mr-2" />Show Raw</>
                    )}
                  </Button>
                </div>
                <CardDescription>Encrypted amounts (FHE)</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {decrypting ? (
                    <div className="text-center py-8">
                      <Loader2 className="w-8 h-8 animate-spin text-primary mx-auto mb-2" />
                      <p className="text-sm text-muted-foreground">Decrypting...</p>
                    </div>
                  ) : decryptedAllocation !== null ? (
                    <>
                      <div className="grid grid-cols-3 gap-4">
                        <div className="text-center p-4 bg-primary/5 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Total</p>
                          <p className="text-2xl font-bold">{decryptedAllocation}</p>
                        </div>
                        <div className="text-center p-4 bg-green-500/5 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Claimed</p>
                          <p className="text-2xl font-bold text-green-600">
                            {decryptedClaimed}
                          </p>
                        </div>
                        <div className="text-center p-4 bg-blue-500/5 rounded-lg">
                          <p className="text-sm text-muted-foreground mb-1">Remaining</p>
                          <p className="text-2xl font-bold text-blue-600">
                            {calculateRemaining()}
                          </p>
                        </div>
                      </div>

                      {showEncrypted && (
                        <div className="space-y-2 p-4 bg-secondary/20 rounded-lg text-xs font-mono">
                          <div>
                            <span className="text-muted-foreground">Allocation Handle:</span>
                            <br />
                            <span className="break-all">{allocationHandle as string}</span>
                          </div>
                          <div>
                            <span className="text-muted-foreground">Claimed Handle:</span>
                            <br />
                            <span className="break-all">{claimedHandle as string}</span>
                          </div>
                        </div>
                      )}
                    </>
                  ) : (
                    <div className="text-center py-8">
                      <Button onClick={handleDecrypt} disabled={decrypting}>
                        {decrypting ? (
                          <>
                            <Loader2 className="w-4 h-4 animate-spin mr-2" />
                            Decrypting...
                          </>
                        ) : (
                          <>
                            <Eye className="w-4 h-4 mr-2" />
                            Decrypt Allocation
                          </>
                        )}
                      </Button>
                    </div>
                  )}
                </div>
              </CardContent>
            </Card>

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
