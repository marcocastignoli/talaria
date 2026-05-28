import { useState } from 'react';
import { useParams, useNavigate } from 'react-router';
import { isAddress, isHash } from 'viem';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export function ChainHome() {
  const { chainId } = useParams();
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [error, setError] = useState<string | null>(null);

  const onSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (!trimmed) return;
    if (isAddress(trimmed)) {
      navigate(`/chain/${chainId}/address/${trimmed}`);
      return;
    }
    if (isHash(trimmed)) {
      navigate(`/chain/${chainId}/tx/${trimmed}`);
      return;
    }
    setError('Enter a valid address (0x…40 hex) or transaction hash (0x…64 hex).');
  };

  return (
    <div className="flex flex-col gap-6">
      <Card>
        <CardHeader>
          <CardTitle>Look up</CardTitle>
          <CardDescription>
            Paste a transaction hash or contract address on chain {chainId}.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <form onSubmit={onSubmit} className="flex gap-2">
            <Input
              placeholder="0x…"
              value={query}
              onChange={(e) => {
                setQuery(e.target.value);
                setError(null);
              }}
            />
            <Button type="submit">Go</Button>
          </form>
          {error && <div className="mt-2 text-sm text-red-600">{error}</div>}
        </CardContent>
      </Card>
    </div>
  );
}
