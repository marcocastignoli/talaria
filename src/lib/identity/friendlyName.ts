import { keccak256, getAddress } from 'viem';
import friendlyWords from 'friendly-words';

const predicates: string[] = friendlyWords.predicates;
const objects: string[] = friendlyWords.objects;

export function friendlyNameFor(address: string): string {
  const checksummed = getAddress(address);
  const hash = keccak256(checksummed as `0x${string}`);
  const bytes = hexToByteArray(hash);
  const predicateIdx = ((bytes[0] << 8) | bytes[1]) % predicates.length;
  const objectIdx = ((bytes[2] << 8) | bytes[3]) % objects.length;
  const suffix = checksummed.slice(-4).toLowerCase();
  return `${predicates[predicateIdx]}-${objects[objectIdx]}-${suffix}`;
}

export function truncateAddress(address: string): string {
  if (!address.startsWith('0x') || address.length < 10) return address;
  return `${address.slice(0, 6)}…${address.slice(-4)}`;
}

function hexToByteArray(hex: string): Uint8Array {
  const clean = hex.startsWith('0x') ? hex.slice(2) : hex;
  const out = new Uint8Array(clean.length / 2);
  for (let i = 0; i < out.length; i++) {
    out[i] = parseInt(clean.slice(i * 2, i * 2 + 2), 16);
  }
  return out;
}
