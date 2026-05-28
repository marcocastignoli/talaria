import { type FC } from 'react';
import { useParams } from 'react-router';
import { useClearSigningModel, type ClearSigningTxData } from './useClearSigningModel';
import { ClearSigningDisplay } from './ClearSigningDisplay';

interface ClearSigningProps {
  txData: ClearSigningTxData;
}

export const ClearSigning: FC<ClearSigningProps> = ({ txData }) => {
  const { chainId: chainIdParam } = useParams();
  const chainId = chainIdParam ? Number(chainIdParam) : undefined;
  const { data: model, isLoading, error } = useClearSigningModel(txData, chainId);

  if (isLoading) {
    return (
      <div className="text-sm text-[var(--color-fg-muted)]">
        Decoding transaction with ERC-7730…
      </div>
    );
  }
  if (error) {
    return (
      <div className="rounded-md border border-red-300 bg-red-50 dark:bg-red-950 dark:border-red-800 px-3 py-2 text-sm text-red-800 dark:text-red-200">
        {error instanceof Error ? error.message : 'Failed to format transaction'}
      </div>
    );
  }
  if (!model) return null;

  return (
    <ClearSigningDisplay
      model={model}
      to={txData.to ?? undefined}
      chainId={chainId}
    />
  );
};
