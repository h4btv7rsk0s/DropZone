import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { useAccount, useReadContract } from 'wagmi';
import { useState, useEffect } from 'react';
import { Gift, Users, Calendar, Crown, CheckCircle, XCircle } from 'lucide-react';
import { CONTRACTS, ABIS } from '@/config/contracts';
import AirdropManager from './AirdropManager';
import AirdropClaim from './AirdropClaim';

interface AirdropData {
  id: number;
  creator: string;
  name: string;
  description: string;
  createdAt: bigint;
  active: boolean;
}

const AirdropList = () => {
  const { address, isConnected } = useAccount();
  const [airdrops, setAirdrops] = useState<AirdropData[]>([]);
  const [selectedAirdrop, setSelectedAirdrop] = useState<number | null>(null);
  const [viewMode, setViewMode] = useState<'list' | 'manage' | 'claim'>('list');

  // Read all airdrop IDs
  const { data: airdropIds } = useReadContract({
    address: CONTRACTS.AirdropFactory,
    abi: ABIS.AirdropFactory,
    functionName: 'getAllAirdropIds',
  });

  // Fetch airdrop details
  useEffect(() => {
    const fetchAirdrops = async () => {
      if (!airdropIds || airdropIds.length === 0) {
        setAirdrops([]);
        return;
      }

      const promises = (airdropIds as bigint[]).map(async (id) => {
        try {
          const response = await fetch(
            `https://ethereum-sepolia-rpc.publicnode.com`,
            {
              method: 'POST',
              headers: { 'Content-Type': 'application/json' },
              body: JSON.stringify({
                jsonrpc: '2.0',
                id: 1,
                method: 'eth_call',
                params: [
                  {
                    to: CONTRACTS.AirdropFactory,
                    data: `0x4b53b35a${id.toString(16).padStart(64, '0')}`, // airdrops(uint256)
                  },
                  'latest',
                ],
              }),
            }
          );

          const json = await response.json();
          if (json.result) {
            // Decode the result (simplified - in production use proper ABI decoder)
            const data = json.result.slice(2);
            const creator = '0x' + data.slice(24, 64);

            return {
              id: Number(id),
              creator,
              name: `Airdrop #${id}`,
              description: 'Loading...',
              createdAt: BigInt(0),
              active: true,
            };
          }
        } catch (error) {
          console.error(`Failed to fetch airdrop ${id}:`, error);
        }
        return null;
      });

      const results = await Promise.all(promises);
      const validAirdrops = results.filter((a): a is AirdropData => a !== null);
      setAirdrops(validAirdrops.reverse()); // Show newest first
    };

    fetchAirdrops();
  }, [airdropIds]);

  const formatDate = (timestamp: bigint) => {
    if (timestamp === BigInt(0)) return 'Recently';
    const date = new Date(Number(timestamp) * 1000);
    return date.toLocaleDateString();
  };

  const isCreator = (creatorAddr: string) => {
    return address && creatorAddr.toLowerCase() === address.toLowerCase();
  };

  if (viewMode === 'manage' && selectedAirdrop !== null) {
    return (
      <AirdropManager
        airdropId={selectedAirdrop}
        onBack={() => {
          setViewMode('list');
          setSelectedAirdrop(null);
        }}
      />
    );
  }

  if (viewMode === 'claim' && selectedAirdrop !== null) {
    return (
      <AirdropClaim
        airdropId={selectedAirdrop}
        onBack={() => {
          setViewMode('list');
          setSelectedAirdrop(null);
        }}
      />
    );
  }

  return (
    <section className="py-12 px-6">
      <div className="container mx-auto max-w-6xl">
        <div className="text-center mb-8">
          <div className="flex items-center justify-center gap-2 mb-4">
            <Gift className="w-8 h-8 text-primary" />
            <h2 className="text-3xl font-bold gradient-text">All Airdrops</h2>
          </div>
          <p className="text-muted-foreground">
            Browse and claim from available airdrop campaigns
          </p>
        </div>

        {!isConnected ? (
          <Card className="glass-card border-none">
            <CardContent className="text-center py-12">
              <p className="text-muted-foreground">
                Connect your wallet to view airdrops
              </p>
            </CardContent>
          </Card>
        ) : airdrops.length === 0 ? (
          <Card className="glass-card border-none">
            <CardContent className="text-center py-12">
              <Gift className="w-16 h-16 text-muted-foreground/50 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No Airdrops Yet</p>
              <p className="text-muted-foreground">
                Be the first to create an airdrop campaign!
              </p>
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6 md:grid-cols-2 lg:grid-cols-3">
            {airdrops.map((airdrop) => (
              <Card key={airdrop.id} className="glass-card border-none hover:shadow-lg transition-shadow">
                <CardHeader>
                  <div className="flex items-start justify-between mb-2">
                    <CardTitle className="text-xl">
                      {airdrop.name}
                    </CardTitle>
                    {airdrop.active ? (
                      <CheckCircle className="w-5 h-5 text-green-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-red-500" />
                    )}
                  </div>
                  <CardDescription className="line-clamp-2">
                    {airdrop.description}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-4">
                  <div className="space-y-2 text-sm">
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Users className="w-4 h-4" />
                      <span className="font-mono text-xs">
                        {airdrop.creator.slice(0, 6)}...{airdrop.creator.slice(-4)}
                      </span>
                      {isCreator(airdrop.creator) && (
                        <Crown className="w-4 h-4 text-yellow-500" />
                      )}
                    </div>
                    <div className="flex items-center gap-2 text-muted-foreground">
                      <Calendar className="w-4 h-4" />
                      <span>{formatDate(airdrop.createdAt)}</span>
                    </div>
                  </div>

                  <div className="flex gap-2">
                    {isCreator(airdrop.creator) ? (
                      <Button
                        variant="default"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedAirdrop(airdrop.id);
                          setViewMode('manage');
                        }}
                      >
                        <Crown className="w-4 h-4 mr-1" />
                        Manage
                      </Button>
                    ) : (
                      <Button
                        variant="hero"
                        size="sm"
                        className="flex-1"
                        onClick={() => {
                          setSelectedAirdrop(airdrop.id);
                          setViewMode('claim');
                        }}
                      >
                        <Gift className="w-4 h-4 mr-1" />
                        View & Claim
                      </Button>
                    )}
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        )}
      </div>
    </section>
  );
};

export default AirdropList;
