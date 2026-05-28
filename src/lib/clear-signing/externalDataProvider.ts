import type {
  ChainInfoResult,
  DescriptorAddressType,
  ExternalDataProvider,
} from '@ethereum-sourcify/clear-signing';
import { Contract, JsonRpcApiProvider } from 'ethers';

const ERC20_ABI = [
  'function name() view returns (string)',
  'function symbol() view returns (string)',
  'function decimals() view returns (uint8)',
];

const CONTRACT_TYPES = new Set<DescriptorAddressType>([
  'contract',
  'token',
  'collection',
]);
const EOA_TYPES = new Set<DescriptorAddressType>(['eoa', 'wallet']);

async function evaluateTypeMatch(
  provider: JsonRpcApiProvider,
  address: string,
  acceptedTypes: DescriptorAddressType[] | undefined,
): Promise<boolean> {
  if (acceptedTypes === undefined || acceptedTypes.length === 0) return true;
  const wantsContract = acceptedTypes.some((t) => CONTRACT_TYPES.has(t));
  const wantsEoa = acceptedTypes.some((t) => EOA_TYPES.has(t));
  if (wantsContract === wantsEoa) return true;
  try {
    const code = await provider.getCode(address);
    const isContract =
      code !== undefined &&
      code !== '0x' &&
      code !== '0x0' &&
      !code.startsWith('0xef0100');
    return wantsContract ? isContract : !isContract;
  } catch {
    return true;
  }
}

const chainInfoCache: Map<number, ChainInfoResult | null> = new Map();

async function fetchChainInfo(chainId: number): Promise<ChainInfoResult | null> {
  if (chainInfoCache.has(chainId)) return chainInfoCache.get(chainId)!;
  try {
    const res = await fetch(`https://chainid.network/chains.json`);
    if (!res.ok) {
      chainInfoCache.set(chainId, null);
      return null;
    }
    const all = (await res.json()) as Array<{
      chainId: number;
      name: string;
      nativeCurrency: { name: string; symbol: string; decimals: number };
    }>;
    const found = all.find((c) => c.chainId === chainId);
    if (!found) {
      chainInfoCache.set(chainId, null);
      return null;
    }
    const result: ChainInfoResult = {
      name: found.name,
      nativeCurrency: found.nativeCurrency,
    };
    chainInfoCache.set(chainId, result);
    return result;
  } catch {
    chainInfoCache.set(chainId, null);
    return null;
  }
}

export function createExternalDataProvider(
  chainProvider: JsonRpcApiProvider,
  mainnetProvider: JsonRpcApiProvider,
): ExternalDataProvider {
  return {
    // We intentionally return null here — Talaria's <AddressLink> applies the
    // generated friendly-name layer at render time, which gives the user full
    // control via the displayStyle setting. If we returned a friendly name
    // here, clear-signing would bake it into field.value and bypass that layer.
    resolveLocalName: async () => null,

    resolveEnsName: async (address, acceptedTypes) => {
      try {
        const ensName = await mainnetProvider.lookupAddress(address);
        if (ensName === null) return null;
        const typeMatch = await evaluateTypeMatch(chainProvider, address, acceptedTypes);
        return { name: ensName, typeMatch };
      } catch {
        return null;
      }
    },

    resolveToken: async (_chainId, tokenAddress) => {
      try {
        const contract = new Contract(tokenAddress, ERC20_ABI, chainProvider);
        const [name, symbol, decimals] = await Promise.all([
          contract.name() as Promise<string>,
          contract.symbol() as Promise<string>,
          contract.decimals() as Promise<bigint | number>,
        ]);
        return { name, symbol, decimals: Number(decimals) };
      } catch {
        return null;
      }
    },

    resolveNftCollectionName: async (_chainId, collectionAddress) => {
      try {
        const contract = new Contract(collectionAddress, ERC20_ABI, chainProvider);
        const name = (await contract.name()) as string;
        return { name };
      } catch {
        return null;
      }
    },

    resolveBlockTimestamp: async (_chainId, blockHeight) => {
      try {
        const block = await chainProvider.getBlock(Number(blockHeight));
        if (block === null) return null;
        return { timestamp: Number(block.timestamp) };
      } catch {
        return null;
      }
    },

    resolveChainInfo: async (chainId) => fetchChainInfo(chainId),
  };
}
