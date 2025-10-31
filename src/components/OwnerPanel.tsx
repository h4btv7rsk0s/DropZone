import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useAccount, useReadContract, useWriteContract, usePublicClient } from 'wagmi';
import { useState } from 'react';
import { Shield, Loader2, Plus, Users, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { CONTRACTS, ABIS } from '@/config/contracts';
import { encryptAmount } from '@/lib/fhe';

interface BatchAllocation {
  address: string;
  amount: string;
}

const OwnerPanel = () => {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [recipientAddress, setRecipientAddress] = useState('');
  const [allocationAmount, setAllocationAmount] = useState('');
  const [allocating, setAllocating] = useState(false);
  const [freezing, setFreezing] = useState(false);
  const [batchMode, setBatchMode] = useState(false);
  const [batchAllocations, setBatchAllocations] = useState<BatchAllocation[]>([
    { address: '', amount: '' },
  ]);
  const [batchProcessing, setBatchProcessing] = useState(false);

  // Check if user is owner
  const { data: owner } = useReadContract({
    address: CONTRACTS.ConfAirdrop,
    abi: ABIS.ConfAirdrop,
    functionName: 'owner',
  });

  // Check if contract is frozen
  const { data: frozen, refetch: refetchFrozen } = useReadContract({
    address: CONTRACTS.ConfAirdrop,
    abi: ABIS.ConfAirdrop,
    functionName: 'frozen',
  });

  const isOwner = address && owner && address.toLowerCase() === (owner as string).toLowerCase();
  const isFrozen = frozen === true;

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

    if (isFrozen) {
      toast.error('Contract is frozen. Cannot set allocations.');
      return;
    }

    setAllocating(true);

    try {
      const amount = BigInt(allocationAmount);

      toast.info('Encrypting allocation amount...');
      const { encryptedAmount, proof } = await encryptAmount(
        amount,
        CONTRACTS.ConfAirdrop,
        address
      );

      toast.info('Submitting setAllocation transaction...');
      const hash = await writeContractAsync({
        address: CONTRACTS.ConfAirdrop,
        abi: ABIS.ConfAirdrop,
        functionName: 'setAllocation',
        args: [recipientAddress as `0x${string}`, encryptedAmount, proof],
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
      (item) => item.address && item.amount && !isNaN(Number(item.amount)) && Number(item.amount) > 0
    );

    if (validAllocations.length === 0) {
      toast.error('Please add at least one valid allocation');
      return;
    }

    if (isFrozen) {
      toast.error('Contract is frozen. Cannot set allocations.');
      return;
    }

    setBatchProcessing(true);

    try {
      const addresses = validAllocations.map((item) => item.address as `0x${string}`);

      toast.info(`Encrypting ${validAllocations.length} allocation amounts...`);

      // Encrypt all amounts
      const encryptedData = await Promise.all(
        validAllocations.map(async (item) => {
          const amount = BigInt(item.amount);
          return await encryptAmount(amount, CONTRACTS.ConfAirdrop, address);
        })
      );

      const encryptedAmounts = encryptedData.map((data) => data.encryptedAmount);
      const proof = encryptedData[0].proof; // Use first proof (should be same for batch)

      toast.info('Submitting batch allocation transaction...');
      const hash = await writeContractAsync({
        address: CONTRACTS.ConfAirdrop,
        abi: ABIS.ConfAirdrop,
        functionName: 'batchSetAllocation',
        args: [addresses, encryptedAmounts, proof],
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

  const handleFreeze = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (isFrozen) {
      toast.error('Contract is already frozen');
      return;
    }

    setFreezing(true);

    try {
      toast.info('Submitting freeze transaction...');
      const hash = await writeContractAsync({
        address: CONTRACTS.ConfAirdrop,
        abi: ABIS.ConfAirdrop,
        functionName: 'freeze',
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
            <p>Contract frozen successfully!</p>
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
        setTimeout(() => refetchFrozen(), 2000);
      } else {
        toast.error('Transaction failed');
      }
    } catch (error: any) {
      console.error('[Freeze] Error:', error);
      toast.error(error.message || 'Failed to freeze contract');
    } finally {
      setFreezing(false);
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

  if (!isConnected || !isOwner) {
    return null;
  }

  return (
    <section className="py-12 px-6 bg-primary/5">
      <div className="container mx-auto max-w-4xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Shield className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold gradient-text">Owner Control Panel</h2>
          </div>
          <p className="text-muted-foreground">
            Manage airdrop allocations with FHE encryption
          </p>
        </div>

        <div className="grid gap-6">
          {/* Contract Status */}
          <Card className="glass-card border-none">
            <CardHeader>
              <CardTitle>Contract Status</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="space-y-3">
                <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm font-medium">Contract Address:</span>
                  <span className="text-xs font-mono">{CONTRACTS.ConfAirdrop}</span>
                </div>
                <div className="flex justify-between items-center p-3 bg-secondary/30 rounded-lg">
                  <span className="text-sm font-medium">Status:</span>
                  <span className={`text-sm font-bold ${isFrozen ? 'text-red-500' : 'text-green-500'}`}>
                    {isFrozen ? '🔒 Frozen' : '✅ Active'}
                  </span>
                </div>
              </div>
            </CardContent>
          </Card>

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
                  Allocate encrypted airdrop tokens to a single address
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Recipient Address</label>
                    <Input
                      type="text"
                      placeholder="0x..."
                      value={recipientAddress}
                      onChange={(e) => setRecipientAddress(e.target.value)}
                      disabled={allocating || isFrozen}
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Allocation Amount</label>
                    <Input
                      type="number"
                      placeholder="Enter token amount"
                      value={allocationAmount}
                      onChange={(e) => setAllocationAmount(e.target.value)}
                      disabled={allocating || isFrozen}
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
                    disabled={allocating || isFrozen || !recipientAddress || !allocationAmount}
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
                      Allocate encrypted airdrop tokens to multiple addresses at once
                    </CardDescription>
                  </div>
                  <Button variant="outline" size="sm" onClick={addBatchRow} disabled={batchProcessing || isFrozen}>
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
                          disabled={batchProcessing || isFrozen}
                          className="flex-1"
                        />
                        <Input
                          type="number"
                          placeholder="Amount"
                          value={item.amount}
                          onChange={(e) => updateBatchRow(index, 'amount', e.target.value)}
                          disabled={batchProcessing || isFrozen}
                          className="w-32"
                        />
                        {batchAllocations.length > 1 && (
                          <Button
                            variant="outline"
                            size="icon"
                            onClick={() => removeBatchRow(index)}
                            disabled={batchProcessing || isFrozen}
                          >
                            ✕
                          </Button>
                        )}
                      </div>
                    ))}
                  </div>
                  <p className="text-xs text-muted-foreground">
                    💡 All amounts will be encrypted using FHE before storing on-chain
                  </p>
                  <Button
                    variant="hero"
                    size="lg"
                    className="w-full"
                    onClick={handleBatchSetAllocation}
                    disabled={batchProcessing || isFrozen}
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

          {/* Freeze Control */}
          <Card className="glass-card border-none border-red-500/20">
            <CardHeader>
              <CardTitle className="text-red-500">⚠️ Freeze Contract</CardTitle>
              <CardDescription>
                Once frozen, no more allocations can be set. This action is irreversible!
              </CardDescription>
            </CardHeader>
            <CardContent>
              <Button
                variant="destructive"
                size="lg"
                className="w-full"
                onClick={handleFreeze}
                disabled={freezing || isFrozen}
              >
                {freezing ? (
                  <>
                    <Loader2 className="w-4 h-4 animate-spin mr-2" />
                    Freezing Contract...
                  </>
                ) : isFrozen ? (
                  '🔒 Contract Already Frozen'
                ) : (
                  '🔒 Freeze Contract'
                )}
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </section>
  );
};

export default OwnerPanel;
