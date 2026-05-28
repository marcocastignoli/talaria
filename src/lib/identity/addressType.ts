import type { Address, PublicClient } from 'viem';

export type AddressType = 'eoa' | 'contract' | 'delegated';
export type EnhancedAddressType =
  | AddressType
  | 'erc20'
  | 'erc721'
  | 'erc1155'
  | 'erc4626';

export interface AddressTypeInfo {
  type: AddressType;
  delegateTarget?: Address;
}

const EIP_7702_PREFIX = '0xef0100';

export async function detectAddressType(
  client: PublicClient,
  address: Address,
): Promise<AddressTypeInfo> {
  const code = await client.getCode({ address });
  if (!code || code === '0x' || code === '0x0') {
    return { type: 'eoa' };
  }
  const lower = code.toLowerCase();
  // EIP-7702 designator: 0xef0100 + 20-byte delegate (total 23 bytes / 46 hex + 0x).
  if (lower.startsWith(EIP_7702_PREFIX) && lower.length === 2 + 6 + 40) {
    const delegateTarget = (`0x${lower.slice(8)}`) as Address;
    return { type: 'delegated', delegateTarget };
  }
  return { type: 'contract' };
}

export const typeMeta: Record<EnhancedAddressType, { label: string; sentence: string }> = {
  eoa: {
    label: 'EOA',
    sentence: 'Externally owned account, controlled by a private key.',
  },
  contract: {
    label: 'Contract',
    sentence: 'Smart contract, controlled by code deployed on-chain.',
  },
  delegated: {
    label: 'Delegated EOA',
    sentence:
      'Externally owned account that has authorized a contract to act on its behalf via EIP-7702.',
  },
  erc20: {
    label: 'ERC-20 Token',
    sentence: 'Fungible token contract — same value per unit, divisible by decimals.',
  },
  erc721: {
    label: 'ERC-721 NFT',
    sentence: 'Non-fungible token collection — each token has a unique ID.',
  },
  erc1155: {
    label: 'ERC-1155 multi-token',
    sentence: 'Multi-token contract — per-id balances and batch transfers in one contract.',
  },
  erc4626: {
    label: 'ERC-4626 Vault',
    sentence: 'Tokenized vault — deposits an underlying asset for yield-bearing shares.',
  },
};
