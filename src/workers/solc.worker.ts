/// <reference lib="webworker" />
import { fetchAndLoadSolc, type WebSolc } from 'web-solc';

interface RequestMessage {
  id: number;
  version: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  input: any;
}

interface ResponseMessage {
  id: number;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  output?: any;
  error?: string;
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  errors?: any[];
}

const compilerCache = new Map<string, Promise<WebSolc>>();

function getCompiler(version: string): Promise<WebSolc> {
  let cached = compilerCache.get(version);
  if (!cached) {
    cached = fetchAndLoadSolc(version);
    compilerCache.set(version, cached);
  }
  return cached;
}

self.addEventListener('message', async (event: MessageEvent<RequestMessage>) => {
  const { id, version, input } = event.data;
  const reply = (msg: ResponseMessage) => (self as unknown as Worker).postMessage(msg);
  try {
    const solc = await getCompiler(version);
    const output = await solc.compile(input);
    reply({ id, output });
  } catch (e) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const err = e as any;
    reply({
      id,
      error: err?.message ?? String(e),
      errors: err?.errors,
    });
  }
});
