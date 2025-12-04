import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { useState, useEffect } from 'react';
import { Rocket, Loader2, Plus, Trash2, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { CONTRACTS, ABIS } from '@/config/contracts';
import { encryptAmount, initializeFHE } from '@/lib/fhe';

interface Recipient {
  address: string;
  amount: string;
}

const CreateAirdrop = () => {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [recipients, setRecipients] = useState<Recipient[]>([
    { address: '', amount: '' },
    { address: '', amount: '' },
    { address: '', amount: '' },
  ]);
  const [creating, setCreating] = useState(false);
  const [fheInitialized, setFheInitialized] = useState(false);

  // Initialize FHE on mount
  useEffect(() => {
    if (isConnected && !fheInitialized) {
      initializeFHE()
        .then(() => {
          setFheInitialized(true);
          console.log('✅ FHE SDK initialized');
        })
        .catch((error) => {
          console.error('FHE init failed:', error);
          toast.error('Failed to initialize FHE SDK');
        });
    }
  }, [isConnected, fheInitialized]);

  const addRecipient = () => {
    setRecipients([...recipients, { address: '', amount: '' }]);
  };

  const removeRecipient = (index: number) => {
    if (recipients.length > 1) {
      setRecipients(recipients.filter((_, i) => i !== index));
    }
  };

  const updateRecipient = (index: number, field: 'address' | 'amount', value: string) => {
    const updated = [...recipients];
    updated[index][field] = value;
    setRecipients(updated);
  };

  const handleCreate = async () => {
    if (!isConnected || !address) {
      toast.error('Please connect your wallet');
      return;
    }

    if (!name.trim()) {
      toast.error('Please enter airdrop name');
      return;
    }

    if (!description.trim()) {
      toast.error('Please enter airdrop description');
      return;
    }

    if (!fheInitialized) {
      toast.error('FHE SDK not initialized yet, please wait...');
      return;
    }

    // Validate recipients
    const validRecipients = recipients.filter(
      (r) => r.address.trim() && r.amount.trim() && !isNaN(Number(r.amount)) && Number(r.amount) > 0
    );

    if (validRecipients.length === 0) {
      toast.error('Please add at least one valid recipient');
      return;
    }

    setCreating(true);

    try {
      // Step 1: Encrypt all amounts with FHE
      toast.info(`Encrypting ${validRecipients.length} allocations with FHE...`);

      const encryptedData: Array<{
        address: `0x${string}`;
        encryptedAmount: `0x${string}`;
        proof: `0x${string}`;
      }> = [];

      for (let i = 0; i < validRecipients.length; i++) {
        const recipient = validRecipients[i];
        // Convert to integer (euint64 max: 18446744073709551615)
        const amount = BigInt(recipient.amount);

        toast.info(`[${i + 1}/${validRecipients.length}] Encrypting ${recipient.amount} for ${recipient.address.slice(0, 6)}...`);

        try {
          const encrypted = await encryptAmount(
            amount,
            CONTRACTS.AirdropFactory,
            address
          );

          encryptedData.push({
            address: recipient.address as `0x${string}`,
            encryptedAmount: encrypted.encryptedAmount,
            proof: encrypted.proof,
          });

          console.log(`[CreateAirdrop] Encrypted [${i + 1}/${validRecipients.length}]:`, {
            address: recipient.address,
            original: amount.toString(),
            encrypted: encrypted.encryptedAmount,
            proofLength: encrypted.proof.length
          });
        } catch (error: any) {
          toast.error(`FHE encryption failed for recipient ${i + 1}: ${error.message}`);
          throw error;
        }
      }

      toast.success(`✅ All allocations encrypted with FHE!`);

      // Step 2: Create airdrop with all allocations in ONE transaction
      toast.info('Creating airdrop with all allocations in single transaction...');

      const addresses = encryptedData.map(d => d.address);
      const encryptedAmounts = encryptedData.map(d => d.encryptedAmount);
      const proofs = encryptedData.map(d => d.proof);

      const createHash = await writeContractAsync({
        address: CONTRACTS.AirdropFactory,
        abi: ABIS.AirdropFactory,
        functionName: 'createAirdropWithAllocations',
        args: [name, description, addresses, encryptedAmounts, proofs],
      });

      toast.info('Waiting for confirmation...');
      const createReceipt = await publicClient!.waitForTransactionReceipt({
        hash: createHash,
        confirmations: 1,
      });

      const explorerUrl = `https://sepolia.etherscan.io/tx/${createHash}`;

      if (createReceipt.status !== 'success') {
        toast.error(
          <div>
            <p>Transaction failed on-chain</p>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline text-sm"
            >
              View on Etherscan →
            </a>
          </div>
        );
        return;
      }

      // Extract airdropId from logs
      const airdropCreatedEvent = createReceipt.logs.find(
        (log: any) => log.topics[0] === '0xafdc45283a1359e9d002fa0a065b5fc3f4f2e2e88569d419b6c6aadaac7eb074'
      );

      if (!airdropCreatedEvent) {
        toast.error(
          <div>
            <p>Could not get airdrop ID from transaction</p>
            <a
              href={explorerUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="text-blue-400 hover:underline text-sm"
            >
              View on Etherscan →
            </a>
          </div>
        );
        return;
      }

      const airdropId = BigInt(airdropCreatedEvent.topics[1] || '0');

      toast.success(
        <div>
          <p>🎉 Airdrop #{airdropId.toString()} created with {validRecipients.length} FHE-encrypted allocations!</p>
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

      // Reset form
      setName('');
      setDescription('');
      setRecipients([{ address: '', amount: '' }, { address: '', amount: '' }, { address: '', amount: '' }]);

      // Reload page after 2 seconds
      setTimeout(() => window.location.reload(), 2000);

    } catch (error: any) {
      console.error('[CreateAirdrop] Error:', error);
      toast.error(error.message || 'Failed to create airdrop');
    } finally {
      setCreating(false);
    }
  };

  const validCount = recipients.filter(
    (r) => r.address.trim() && r.amount.trim() && !isNaN(Number(r.amount)) && Number(r.amount) > 0
  ).length;

  return (
    <section className="py-12 px-6 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto max-w-3xl">
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Rocket className="w-8 h-8 text-primary" />
              <CardTitle className="text-3xl font-bold gradient-text">Create Airdrop</CardTitle>
            </div>
            <CardDescription className="text-base">
              Launch your own confidential airdrop with recipient allocations
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Connect your wallet to create an airdrop
                </p>
              </div>
            ) : !fheInitialized ? (
              <div className="text-center py-8">
                <Loader2 className="w-12 h-12 animate-spin text-primary mx-auto mb-4" />
                <p className="text-muted-foreground">Initializing FHE SDK...</p>
              </div>
            ) : (
              <div className="space-y-6">
                {/* Basic Info */}
                <div className="space-y-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Airdrop Name *
                    </label>
                    <Input
                      type="text"
                      placeholder="e.g., Project Alpha Token Drop"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      disabled={creating}
                      maxLength={100}
                    />
                  </div>

                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Description *
                    </label>
                    <Textarea
                      placeholder="Describe your airdrop campaign..."
                      value={description}
                      onChange={(e) => setDescription(e.target.value)}
                      disabled={creating}
                      rows={3}
                      maxLength={500}
                    />
                    <p className="text-xs text-muted-foreground mt-1">
                      {description.length}/500 characters
                    </p>
                  </div>
                </div>

                {/* Recipients */}
                <div className="border-t pt-6">
                  <div className="flex items-center justify-between mb-4">
                    <div>
                      <h3 className="font-semibold">Recipients ({validCount} valid)</h3>
                      <p className="text-sm text-muted-foreground">
                        Add addresses (public) and encrypted amounts (FHE)
                      </p>
                    </div>
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={addRecipient}
                      disabled={creating}
                    >
                      <Plus className="w-4 h-4 mr-1" />
                      Add
                    </Button>
                  </div>

                  <div className="space-y-3 max-h-96 overflow-y-auto">
                    {recipients.map((recipient, index) => (
                      <div key={index} className="flex gap-2 items-start p-3 bg-secondary/20 rounded-lg">
                        <div className="flex-1 space-y-2">
                          <Input
                            type="text"
                            placeholder="0x... (recipient address)"
                            value={recipient.address}
                            onChange={(e) => updateRecipient(index, 'address', e.target.value)}
                            disabled={creating}
                            className="font-mono text-xs"
                          />
                          <Input
                            type="number"
                            step="1"
                            placeholder="Amount in tokens (integer only, max: 18446744073709551615)"
                            value={recipient.amount}
                            onChange={(e) => updateRecipient(index, 'amount', e.target.value)}
                            disabled={creating}
                          />
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => removeRecipient(index)}
                          disabled={creating || recipients.length === 1}
                        >
                          <Trash2 className="w-4 h-4 text-red-500" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>

                {/* Privacy Info */}
                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <Lock className="w-4 h-4" />
                    Privacy Features
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✅ Addresses are stored publicly</li>
                    <li>✅ Amounts are encrypted with FHE before storing</li>
                    <li>✅ Only recipients can decrypt and view their amounts</li>
                    <li>✅ Everything created in a single blockchain transaction</li>
                  </ul>
                </div>

                {/* Create Button */}
                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleCreate}
                  disabled={creating || !name.trim() || !description.trim() || validCount === 0}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Encrypting & Creating...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5 mr-2" />
                      Create Airdrop with {validCount} Recipients
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  Amounts are FHE-encrypted locally, then airdrop + allocations created in ONE transaction
                </p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </section>
  );
};

export default CreateAirdrop;
