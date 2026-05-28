export interface SpecialAddress {
  name: string;
  description?: string;
}

// Keys are normalized lowercase (no checksum). Look up with address.toLowerCase().
export const SPECIAL_ADDRESSES: Record<string, SpecialAddress> = {
  '0x0000000000000000000000000000000000000000': {
    name: 'Zero address',
    description:
      'Mint/burn marker — token transfers from 0x0 are mints; transfers to 0x0 are burns.',
  },
  '0x000000000000000000000000000000000000dead': {
    name: 'Burn address',
    description: 'Common burn address — tokens sent here are considered destroyed.',
  },
  '0x0000000000000000000000000000000000000001': { name: 'ECRecover precompile' },
  '0x0000000000000000000000000000000000000002': { name: 'SHA-256 precompile' },
  '0x0000000000000000000000000000000000000003': { name: 'RIPEMD-160 precompile' },
  '0x0000000000000000000000000000000000000004': { name: 'Identity precompile' },
  '0x0000000000000000000000000000000000000005': { name: 'ModExp precompile' },
  '0x0000000000000000000000000000000000000006': { name: 'ecAdd precompile' },
  '0x0000000000000000000000000000000000000007': { name: 'ecMul precompile' },
  '0x0000000000000000000000000000000000000008': { name: 'ecPairing precompile' },
  '0x0000000000000000000000000000000000000009': { name: 'Blake2F precompile' },
  '0x000000000000000000000000000000000000000a': { name: 'Point evaluation precompile' },
};

export function lookupSpecialAddress(address: string): SpecialAddress | null {
  return SPECIAL_ADDRESSES[address.toLowerCase()] ?? null;
}
