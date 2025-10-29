import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { useAccount, useWriteContract, usePublicClient } from 'wagmi';
import { useState } from 'react';
import { Rocket, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { CONTRACTS, ABIS } from '@/config/contracts';

const CreateAirdrop = () => {
  const { address, isConnected } = useAccount();
  const { writeContractAsync } = useWriteContract();
  const publicClient = usePublicClient();

  const [name, setName] = useState('');
  const [description, setDescription] = useState('');
  const [creating, setCreating] = useState(false);

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

    setCreating(true);

    try {
      toast.info('Creating airdrop...');
      const hash = await writeContractAsync({
        address: CONTRACTS.AirdropFactory,
        abi: ABIS.AirdropFactory,
        functionName: 'createAirdrop',
        args: [name, description],
      });

      toast.info('Waiting for confirmation...');
      const receipt = await publicClient!.waitForTransactionReceipt({
        hash,
        confirmations: 1,
      });

      if (receipt.status === 'success') {
        // Extract airdropId from logs
        const airdropCreatedEvent = receipt.logs.find(
          (log: any) => log.topics[0] === '0xafdc45283a1359e9d002fa0a065b5fc3f4f2e2e88569d419b6c6aadaac7eb074'
        );

        if (airdropCreatedEvent) {
          const airdropId = BigInt(airdropCreatedEvent.topics[1] || '0').toString();
          toast.success(`Airdrop #${airdropId} created successfully!`);
        } else {
          toast.success('Airdrop created successfully!');
        }

        setName('');
        setDescription('');

        // Reload page after 2 seconds
        setTimeout(() => window.location.reload(), 2000);
      } else {
        toast.error('Transaction failed');
      }
    } catch (error: any) {
      console.error('[CreateAirdrop] Error:', error);
      toast.error(error.message || 'Failed to create airdrop');
    } finally {
      setCreating(false);
    }
  };

  return (
    <section className="py-12 px-6 bg-gradient-to-br from-primary/5 to-secondary/5">
      <div className="container mx-auto max-w-2xl">
        <Card className="glass-card border-none shadow-xl">
          <CardHeader className="text-center">
            <div className="flex items-center justify-center gap-2 mb-2">
              <Rocket className="w-8 h-8 text-primary" />
              <CardTitle className="text-3xl font-bold gradient-text">Create Airdrop</CardTitle>
            </div>
            <CardDescription className="text-base">
              Launch your own confidential airdrop campaign with FHE encryption
            </CardDescription>
          </CardHeader>
          <CardContent>
            {!isConnected ? (
              <div className="text-center py-8">
                <p className="text-muted-foreground mb-4">
                  Connect your wallet to create an airdrop
                </p>
              </div>
            ) : (
              <div className="space-y-6">
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
                  <p className="text-xs text-muted-foreground mt-1">
                    Choose a memorable name for your airdrop
                  </p>
                </div>

                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Description *
                  </label>
                  <Textarea
                    placeholder="Describe your airdrop campaign, eligibility criteria, etc."
                    value={description}
                    onChange={(e) => setDescription(e.target.value)}
                    disabled={creating}
                    rows={4}
                    maxLength={500}
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    {description.length}/500 characters
                  </p>
                </div>

                <div className="bg-primary/5 border border-primary/20 rounded-lg p-4">
                  <h4 className="font-semibold mb-2 flex items-center gap-2">
                    <span>🔐</span>
                    Privacy Features
                  </h4>
                  <ul className="text-sm space-y-1 text-muted-foreground">
                    <li>✅ Recipient addresses are public (明文)</li>
                    <li>✅ Allocation amounts are encrypted with FHE (加密)</li>
                    <li>✅ Only recipients can view their amounts</li>
                    <li>✅ Claims are submitted with encrypted amounts</li>
                  </ul>
                </div>

                <Button
                  variant="hero"
                  size="lg"
                  className="w-full"
                  onClick={handleCreate}
                  disabled={creating || !name.trim() || !description.trim()}
                >
                  {creating ? (
                    <>
                      <Loader2 className="w-5 h-5 animate-spin mr-2" />
                      Creating Airdrop...
                    </>
                  ) : (
                    <>
                      <Rocket className="w-5 h-5 mr-2" />
                      Create Airdrop
                    </>
                  )}
                </Button>

                <p className="text-xs text-center text-muted-foreground">
                  After creation, you can set allocations for recipients
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
