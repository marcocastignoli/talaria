import { isAddress } from 'viem';

export class AbiParseError extends Error {
  field: string;
  constructor(field: string, message: string) {
    super(message);
    this.field = field;
  }
}

/**
 * Convert a user string to the proper JS/viem type for an ABI input.
 * Throws AbiParseError with the field name on bad input.
 */
export function parseAbiInput(type: string, name: string, raw: string): unknown {
  const trimmed = raw.trim();
  if (trimmed === '') throw new AbiParseError(name, 'Required');

  // Array types — accept JSON
  if (type.endsWith(']')) {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      throw new AbiParseError(name, `Invalid JSON array: ${(e as Error).message}`);
    }
  }

  // Tuple — accept JSON
  if (type.startsWith('tuple')) {
    try {
      return JSON.parse(trimmed);
    } catch (e) {
      throw new AbiParseError(name, `Invalid JSON tuple: ${(e as Error).message}`);
    }
  }

  if (type === 'address') {
    if (!isAddress(trimmed)) throw new AbiParseError(name, 'Invalid address');
    return trimmed as `0x${string}`;
  }

  if (type === 'bool') {
    if (trimmed === 'true' || trimmed === '1') return true;
    if (trimmed === 'false' || trimmed === '0') return false;
    throw new AbiParseError(name, 'Use "true" or "false"');
  }

  if (type === 'string') return trimmed;

  if (type.startsWith('bytes')) {
    const v = trimmed.startsWith('0x') ? trimmed : `0x${trimmed}`;
    if (!/^0x[0-9a-fA-F]*$/.test(v)) throw new AbiParseError(name, 'Invalid hex');
    return v as `0x${string}`;
  }

  if (type.startsWith('uint') || type.startsWith('int')) {
    try {
      return BigInt(trimmed);
    } catch {
      throw new AbiParseError(name, 'Invalid integer');
    }
  }

  // Fallback: pass-through
  return trimmed;
}

/**
 * Render an ABI output value as a UI-friendly string.
 */
export function formatAbiResult(value: unknown): string {
  if (value === null || value === undefined) return '—';
  if (typeof value === 'bigint') return value.toString();
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (typeof value === 'string') return value;
  if (Array.isArray(value)) return JSON.stringify(value, replacer, 2);
  if (typeof value === 'object') return JSON.stringify(value, replacer, 2);
  return String(value);
}

function replacer(_key: string, value: unknown) {
  return typeof value === 'bigint' ? value.toString() : value;
}
