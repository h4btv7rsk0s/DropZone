import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { useState } from 'react';
import { ArrowLeft, Lock, Loader2, Plus, Users } from 'lucide-react';
import { toast } from 'sonner';
import { CONTRACTS, ABIS } from '@/config/contracts';
import { encryptAmount, initializeFHE } from '@/lib/fhe';

interface AirdropManagerProps {
  airdropId: number;
  onBack: () => void;
}

interface BatchAllocation {
  address: string;
  amount: string;
}

const AirdropManager = ({ airdropId, onBack }: AirdropManagerProps) => {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [recipientAddress, setRecipientAddress] = useState('');
  const [allocationAmount, setAllocationAmount] = useState('');
  const [allocating, setAllocating] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchAllocations, setBatchAllocations] = useState<BatchAllocation[]>([
    { address: '', amount: '' },
  ]);
  const [batchProcessing, setBatchProcessing] = useState(false);
  const [fheInitialized, setFheInitialized] = useState(false);

  // Initialize FHE on mount
  useState(() => {
    if (isConnected && !fheInitialized) {
      initializeFHE()
        .then(() => setFheInitialized(true))
        .catch((error) => {
          console.error('FHE init failed:', error);
          toast.error('Failed to initialize FHE SDK');
        });
    }
  });

  const handleSetAllocation = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!recipientAddress || !allocationAmount) {
      toast.error('Please enter recipient address and amount');
      return;
    }

    if (isNaN(Number(allocationAmount)) || Number(allocationAmount) <= 0) {
      toast.error('Please enter a valid amount');
      return;
    }

    if (!fheInitialized) {
      toast.error('FHE SDK not initialized yet');
      return;
    }

    setAllocating(true);

    try {
      const amount = BigInt(allocationAmount);

      toast.info('Encrypting allocation amount...');
      const { encryptedAmount, proof } = await encryptAmount(
        amount,
        CONTRACTS.AirdropFactory,
        address
      );

      toast.info('Submitting setAllocation transaction...');
      const hash = await writeContractAsync({
        address: CONTRACTS.AirdropFactory,
        abi: ABIS.AirdropFactory,
        functionName: 'setAllocation',
        args: [BigInt(airdropId), recipientAddress as `0x${string}`, encryptedAmount, proof],
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
            <p>Allocation set for {recipientAddress}!</p>
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
        setRecipientAddress('');
        setAllocationAmount('');
      } else {
        toast.error('Transaction failed');
      }
    } catch (error: any) {
      console.error('[SetAllocation] Error:', error);
      toast.error(error.message || 'Failed to set allocation');
    } finally {
      setAllocating(false);
    }
  };

  const handleBatchSetAllocation = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    const validAllocations = batchAllocations.filter(
      (item) =>
        item.address &&
        item.amount &&
        !isNaN(Number(item.amount)) &&
        Number(item.amount) > 0
    );

    if (validAllocations.length === 0) {
      toast.error('Please add at least one valid allocation');
      return;
    }

    if (!fheInitialized) {
      toast.error('FHE SDK not initialized yet');
      return;
    }

    // Check if all amounts are the same
    const firstAmount = validAllocations[0].amount;
    const allSame = validAllocations.every((item) => item.amount === firstAmount);

    if (!allSame) {
      toast.error('Batch allocation requires all amounts to be the same');
      return;
    }

    setBatchProcessing(true);

    try {
      const addresses = validAllocations.map((item) => item.address as `0x${string}`);
      const amount = BigInt(firstAmount);

      toast.info(`Encrypting allocation amount...`);
      const { encryptedAmount, proof } = await encryptAmount(
        amount,
        CONTRACTS.AirdropFactory,
        address
      );

      toast.info('Submitting batch allocation transaction...');
      const hash = await writeContractAsync({
        address: CONTRACTS.AirdropFactory,
        abi: ABIS.AirdropFactory,
        functionName: 'batchSetAllocation',
        args: [BigInt(airdropId), addresses, encryptedAmount, proof],
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
            <p>Batch allocation set for {validAllocations.length} addresses!</p>
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
        setBatchAllocations([{ address: '', amount: '' }]);
      } else {
        toast.error('Transaction failed');
      }
    } catch (error: any) {
      console.error('[BatchSetAllocation] Error:', error);
      toast.error(error.message || 'Failed to set batch allocation');
    } finally {
      setBatchProcessing(false);
    }
  };

  const addBatchRow = () => {
    setBatchAllocations([...batchAllocations, { address: '', amount: '' }]);
  };

  const updateBatchRow = (index: number, field: 'address' | 'amount', value: string) => {
    const updated = [...batchAllocations];
    updated[index][field] = value;
    setBatchAllocations(updated);
  };

  const removeBatchRow = (index: number) => {
    if (batchAllocations.length > 1) {
      setBatchAllocations(batchAllocations.filter((_, i) => i !== index));
    }
  };

  return (
    <section className="py-12 px-6">
      <div className="container mx-auto max-w-4xl">
        <Button variant="outline" size="sm" onClick={onBack} className="mb-6">
          <ArrowLeft className="w-4 h-4 mr-2" />
          Back to List
        </Button>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold gradient-text mb-2">
            Manage Airdrop #{airdropId}
          </h2>
          <p className="text-muted-foreground">
            Set encrypted allocations for recipients
          </p>
        </div>

        <div className="grid gap-6">
          {/* Mode Toggle */}
          <Card className="glass-card border-none">
            <CardContent className="pt-6">
              <div className="flex gap-3">
                <Button
                  variant={!batchMode ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setBatchMode(false)}
                >
                  Single Allocation
                </Button>
                <Button
                  variant={batchMode ? 'default' : 'outline'}
                  className="flex-1"
                  onClick={() => setBatchMode(true)}
                >
                  <Users className="w-4 h-4 mr-2" />
                  Batch Allocation
                </Button>
              </div>
            </CardContent>
          </Card>

          {/* Single Allocation */}
          {!batchMode && (
            <Card className="glass-card border-none">
              <CardHeader>
                <CardTitle>Set Allocation</CardTitle>
                <CardDescription>
                  Allocate encrypted tokens to a single address
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Recipient Address (Public)
                    </label>
                    <Input
                      type="text"
                      placeholder="0x..."
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      disabled={allocating}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Allocation Amount (will be encrypted)
                    </label>
                    <Input
                      type="number"
                      placeholder="Enter token amount"
                      value={allocationAmount}
                      onChange={(e) => setAllocationAmount(e.target.value)}
                      disabled={allocating}
                    />
                    <p className="text-xs text-muted-foreground mt-2">
                      💡 Amount will be encrypted using FHE before storing on-chain
                    </p>
                  </div>
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handleSetAllocation}
                    disabled={allocating || !recipientAddress || !allocationAmount || !fheInitialized}
                  >
                    {allocating ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processing...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Set Encrypted Allocation
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {/* Batch Allocation */}
          {batchMode && (
            <Card className="glass-card border-none">
              <CardHeader>
                <div className="flex items-center justify-between">
                  <div>
                    <CardTitle>Batch Set Allocations</CardTitle>
                    <CardDescription>
                      Set same amount for multiple addresses
                    </CardDescription>
                  </div>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={addBatchRow}
                    disabled={batchProcessing}
                  >
                    <Plus className="w-4 h-4 mr-1" />
                    Add Row
                  </Button>
                </div>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="space-y-3">
                    {batchAllocations.map((item, index) => (
                      <div key={index} className="flex gap-2">
                        <Input
                          type="text"
                          placeholder="0x..."
                          value={item.address}
                          onChange={(e) => updateBatchRow(index, 'address', e.target.value)}
                          disabled={batchProcessing}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={item.amount}
                          onChange={(e) => updateBatchRow(index, 'amount', e.target.value)}
                          disabled={batchProcessing}
                          className="w-32"
                        />
                        {batchAllocations.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeBatchRow(index)}
                            disabled={batchProcessing}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 All recipients will receive the same encrypted amount
                  </p>
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handleBatchSetAllocation}
                    disabled={batchProcessing || !fheInitialized}
                  >
                    {batchProcessing ? (
                      <>
                        <Loader2 className="w-4 h-4 animate-spin mr-2" />
                        Processing Batch...
                      </>
                    ) : (
                      <>
                        <Lock className="w-4 h-4 mr-2" />
                        Set Batch Allocations
                      </>
                    )}
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </section>
  );
};

export default AirdropManager;
