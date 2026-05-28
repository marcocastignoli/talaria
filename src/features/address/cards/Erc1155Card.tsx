import { Layers } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export function Erc1155Card() {
  return (
    <Card>
      <CardHeader className="pb-2">
        <CardTitle className="flex items-center gap-2">
          <Layers size={14} className="text-[var(--color-accent)]" />
          ERC-1155 multi-token
        </CardTitle>
      </CardHeader>
      <CardContent className="text-sm text-[var(--color-fg-muted)] pb-4">
        Multi-token contract — supports per-id balances and batch transfers. Token-level
        info is per-id; query specific token IDs via the Read tab.
      </CardContent>
    </Card>
  );
}
