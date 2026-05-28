import type { ISolidityCompiler } from '@ethereum-sourcify/lib-sourcify';
import type { SolidityJsonInput, SolidityOutput } from '@ethereum-sourcify/compilers-types';

interface PendingEntry {
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  resolve: (v: any) => void;
  reject: (e: Error) => void;
}

let worker: Worker | null = null;
let nextId = 0;
const pending = new Map<number, PendingEntry>();

function getWorker(): Worker {
  if (worker) return worker;
  worker = new Worker(
    new URL('../../workers/solc.worker.ts', import.meta.url),
    { type: 'module' },
  );
  worker.addEventListener('message', (event) => {
    const { id, output, error, errors } = event.data as {
      id: number;
      output?: unknown;
      error?: string;
      errors?: unknown[];
    };
    const entry = pending.get(id);
    if (!entry) return;
    pending.delete(id);
    if (error) {
      const err = new Error(error);
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      (err as any).errors = errors;
      entry.reject(err);
    } else {
      entry.resolve(output);
    }
  });
  worker.addEventListener('error', (e) => {
    console.error('[solc-worker] error', e);
  });
  return worker;
}

export const solc: ISolidityCompiler = {
  async compile(version: string, input: SolidityJsonInput): Promise<SolidityOutput> {
    const w = getWorker();
    const id = nextId++;
    return new Promise<SolidityOutput>((resolve, reject) => {
      pending.set(id, { resolve, reject });
      w.postMessage({ id, version, input });
    });
  },
};
