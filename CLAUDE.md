# CLAUDE.md

Instructions for Claude Code when working in this repo.

## What this is

**Talaria** — a clean, friendly EVM block-explorer + contract interaction tool.

Two ideas distinguish it from existing block explorers:

1. **ERC-7730 clear-signing everywhere.** Transactions render as sentences ("Send
   100 USDT to alice.eth") instead of decoded-but-unlabeled calldata. The Sourcify
   clear-signing registry provides per-contract descriptors; we just render them.
2. **Trustless client-side re-verification.** Sourcify says a contract is verified,
   but you don't have to trust that. The browser downloads the right Solidity
   compiler via [`web-solc`](https://www.npmjs.com/package/web-solc), recompiles
   the source in a Web Worker, and bytecode-matches against the chain.

The whole app is a PWA — no backend. The user brings their own RPC.

Production: https://talaria.castignoli.it/ (deployed via GH Pages on push to `main`).

## Stack

| Layer | Choice | Notes |
|---|---|---|
| Build | Vite + React 19 + TypeScript | |
| Styling | Tailwind v4 (`@tailwindcss/vite` plugin) | No PostCSS config; v4 reads `index.css` |
| UI primitives | Radix UI wrapped in shadcn-style components | Lives in `src/components/ui/` |
| Server cache | TanStack Query | All async fetches go through it |
| Local config | Zustand + `persist` middleware | Settings store at `src/lib/settings/` |
| Routing | react-router v7 (data router) | Tabs are URL-driven via `?tab=…` |
| Chain reads | viem (primary), ethers v6 (clear-signing only) | See gotcha below about multicall |
| Wallet | `@reown/appkit` + `wagmi` | Web component `<appkit-button>` in layout |
| Sourcify | `@ethereum-sourcify/lib-sourcify` + `web-solc` | Heavy chunk (~4 MB) — lazy-load candidate |
| Clear-signing | `@ethereum-sourcify/clear-signing` | ethers-based externalDataProvider |
| Source viewer | `@monaco-editor/react` | Lazy-loaded |
| PWA | `vite-plugin-pwa` | precache cap raised to 8 MiB in vite.config |
| Node shims | `vite-plugin-node-polyfills` | `crypto`/`buffer`/`stream`/`util` + globals |

## Folder layout

```
src/
  app/                       # router, layout, providers tree
    providers.tsx            # WagmiProvider > QueryClientProvider > ThemeBridge
    layout.tsx               # AppLayout (header w/ Connect Wallet + Settings)
    router.tsx               # createBrowserRouter; basename from import.meta.env.BASE_URL
  lib/
    rpc/                     # viem PublicClient + ethers JsonRpcProvider from settings store
    settings/                # Zustand persist store (rpcUrl, mainnetRpcUrl, tenderly, displayStyle, theme, …)
    identity/
      useAddressLabel.ts     # THE canonical address-to-label hook
      pickPrimaryLabel       # exported helper enforcing the label hierarchy
      friendlyName.ts        # deterministic adjective-noun-suffix generator (friendly-words)
      specialAddresses.ts    # 0x0, precompiles 0x1-0xa, 0xdEaD
      useAddressType.ts      # detects EOA / contract / EIP-7702 delegated
    erc/
      detect.ts              # useErcInterfaces — single multicall probing 165/4626/20
      useErc20Info.ts        # name/symbol/decimals/totalSupply
      useErc721Info.ts       # name/symbol/totalSupply
      useErc4626Info.ts      # asset/totalAssets/totalSupply/decimals
      format.ts              # formatTokenAmount with thousands separators
    sourcify/
      api.ts                 # Sourcify v2 client
      useContract.ts         # TanStack Query around fetchSourcifyContract
      useReVerification.ts   # the trustless re-verify pipeline + dwell-gated trigger
      solc.ts                # ISolidityCompiler impl backed by the Web Worker
    clear-signing/
      ClearSigning.tsx       # tx-detail full render
      ClearSigningDisplay.tsx # the renderer; ported from Otterscan
      ClearSigningSummary.tsx # compact one-liner for tx lists
      externalDataProvider.ts # ethers-based; resolveEnsName, resolveToken, …
      useClearSigningModel.ts # the shared format() hook
    transfers/
      useTokenTransfers.ts             # for EOA pages: from-or-to address filter
      useContractEmittedTransfers.ts   # for ERC-20/721 contracts: all events emitted by contract
    wallet/config.ts         # createAppKit + wagmi adapter (singleton at import time)
    time.ts                  # formatRelativeTime / formatAbsoluteTime
    cn.ts                    # clsx + tailwind-merge
  workers/
    solc.worker.ts           # web-solc in a dedicated Worker; per-version compiler cache
  components/
    ui/                      # Button, Input, Card, Tabs, Tooltip, Dialog, Label
    AddressLink.tsx          # THE canonical address renderer (uses useAddressLabel)
    AddressTypeAvatar.tsx    # type-aware avatar (Box/Coins/Image/Vault/Layers/User/UserCog)
    VerificationChip.tsx     # header chip; reflects Sourcify + live re-verify state
    Copy.tsx, HexValue.tsx, InfoRow.tsx, ExternalLink.tsx
    abi/
      AbiFunctionForm.tsx    # auto-renders ABI inputs; used by Read + Write tabs
      parseAbiInput.ts       # type-aware string → JS value (uint/int/address/bool/bytes/string)
  features/
    setup/                   # first-run wizard (validates RPC via eth_chainId)
    chain/                   # ChainHome (lookup card on /chain/:id)
    transaction/TxDetail.tsx
    address/
      AddressDetail.tsx      # tabs are URL-driven via ?tab=…
      Overview.tsx           # type row + ERC cards + balance + nonce
      Transactions.tsx       # branches: token-contract Transfer events vs address activity
      Source.tsx             # Monaco viewer
      Read.tsx, Write.tsx    # auto-rendered ABI functions
      Verification.tsx       # dual badges + match details + compilation + proxy
      cards/                 # per-ERC overview cards
    settings/Settings.tsx
  types/                     # ambient .d.ts (friendly-words, appkit-elements)
```

## Development

```bash
npm install --legacy-peer-deps   # required; see gotcha below
npm run dev                      # vite dev, http://localhost:5173
npm run build                    # tsc -b && vite build
npx tsc -b . --pretty false      # type-check only
npm run lint
```

Local Vite dev uses `base: '/'`. CI build for prod sets nothing (CNAME for custom
domain) — see `.github/workflows/deploy.yml`.

## Conventions

### Addresses → labels

**Always** render addresses through `<AddressLink address={…} />`. It uses
`useAddressLabel` + the user's `displayStyle` setting. The hierarchy is:

1. **Special** address (`0x0`, precompiles, `0xdEaD`) → fixed label like "Zero address"
2. **ENS** (reverse-resolved via mainnet RPC, regardless of current chain)
3. **Token name** (`name()` call result — ERC-20/721/4626)
4. **Friendly name** (deterministic, e.g. `silly-panda-aa49`)
5. **Truncated hex** (`0x1234…abcd`) — used in "raw" display style or last resort

For inline renders that can't use `<AddressLink>` (e.g. inside the tx-list's
ClearSigningSummary), use the same `pickPrimaryLabel(label, displayStyle)` helper
exported from `useAddressLabel.ts`.

`useAddressLabel` makes 3 parallel RPC calls per unique address (ENS + name +
symbol). TanStack Query caches by address forever. For EOAs the name/symbol probes
just reject — no UI cost.

### viem PublicClient is chainless

We don't pass `chain:` to `createPublicClient` because the user picks the RPC at
runtime. Consequence: viem doesn't know contract addresses like Multicall3.

When using `client.multicall()` you MUST pass:

```ts
multicallAddress: '0xcA11bde05977b3631167028862bE2a173976CA11'
```

(canonical CREATE2 deployment, identical on every major EVM chain).

ENS lookups use a separate `useMainnetViemClient()` that DOES set `chain: mainnet`,
so viem can find the ENS registry.

### Sourcify URL construction

`new URL('/v2/contract/…', 'https://sourcify.dev/server')` **drops the `/server`
path**. Use string concat (`base.replace(/\/$/,'') + '/v2/…'`) — see `lib/sourcify/api.ts`.

### URL-driven tabs

`@radix-ui/react-tabs` ignores JS-dispatched click events (security: checks
`event.isTrusted`). Don't try to script tab switches; control them via search
params (`?tab=transactions`). Bonus: deep links survive reload.

### lib-sourcify Logger

`lib-sourcify` ships with a Pino logger that breaks in the browser. Override it
once at module load in `app/providers.tsx`:

```ts
setLibSourcifyLogger({ logLevel: 2, setLevel(l){ this.logLevel = l }, log(level, msg){ … } });
```

### Web Worker for solc

Use the Vite-native pattern in `lib/sourcify/solc.ts`:

```ts
new Worker(new URL('../../workers/solc.worker.ts', import.meta.url), { type: 'module' });
```

Worker keeps a per-version `Promise<WebSolc>` cache via `fetchAndLoadSolc(version)`
(NOT `fetchSolc`, which returns just the source string).

### `erasableSyntaxOnly: true` in tsconfig

Bans parameter properties — `constructor(public field: string)` won't compile.
Assign manually:

```ts
class AbiParseError extends Error {
  field: string;
  constructor(field: string, msg: string) { super(msg); this.field = field; }
}
```

### Re-verification UX

`useReVerifyEnabled(address)` controls when re-verification fires:
- **Dwell-gated**: defaults to 5s of dwell on the address page (`reverifyDwellMs`
  setting, configurable 0–30s)
- **Intent bypass**: if `?tab=source|read|write|verification` is in the URL, fires
  immediately

States surfaced by `<VerificationChip>` in the header:
- Checking → Sourcify request in flight
- Not verified → Sourcify says no
- Verifying locally → in browser compile + bytecode compare
- Verified (full / partial) → both Sourcify and local agree
- Bytecode mismatch → red; Write button hard-blocked in `features/address/Write.tsx`
- Re-verify failed → amber; user can proceed at their own risk

### ERC detection

`useErcInterfaces(address)` is one multicall probing:
- `supportsInterface(0x80ac58cd)` → ERC-721
- `supportsInterface(0xd9b67a26)` → ERC-1155
- `asset()` returns address → ERC-4626
- `decimals()` returns number → ERC-20 (only counted if neither 721 nor 1155)

ERC-4626 also implies ERC-20; Overview shows both cards stacked.

The same hook drives:
- Overview cards
- `AddressTypeAvatar` icon choice (in `AddressDetail.tsx` via `enhancedType`)
- `Transactions.tsx` branch (token-contract vs address-activity)

### Transactions tab branching

In `features/address/Transactions.tsx`:
- **ERC-20 / ERC-4626 contract** → `useContractEmittedTransfersInfinite(addr, 'erc20')`
  → all Transfer events emitted by the contract, paginated
- **ERC-721 contract** → same hook with `kind='erc721'` (different event ABI:
  `tokenId` indexed, no data field)
- **EOA / other** → `useTokenTransfers(addr)` — Transfer events with the address
  as from-or-to topic, direction-based rendering

Both views use 5-block chunks (~60s on mainnet) to stay under common RPC log-per-response
caps (QuickNode is 20k). Pagination via `useInfiniteQuery`; UI shows 5 rows
initially with manual "Load more" — **never** auto-loop multiple fetches per click,
that's what caused the "counter ticking" bug.

## Critical gotchas (things that have bitten this codebase)

1. **Sourcify URL with `new URL()`** — drops the `/server` path segment. Use string concat.
2. **`client.multicall()` needs `multicallAddress`** explicitly because the client has no chain.
3. **ENS needs `chain: mainnet`** on the viem client — use `useMainnetViemClient`.
4. **npm install needs `--legacy-peer-deps`** because Reown / wagmi pull TypeScript >=5.9 as optional peer and we're on 5.8.
5. **`--legacy-peer-deps` can remove unrelated packages.** It silently dropped `@radix-ui/react-tooltip` once. After installing with that flag, re-check that all your direct deps still resolve.
6. **Vite HMR misses non-component file changes** sometimes (hooks, utils). Hard reload if behavior contradicts the code.
7. **Radix Tabs ignore JS clicks.** Don't try to script tab switches.
8. **`erasableSyntaxOnly: true`** bans parameter properties.
9. **lib-sourcify's Pino logger** breaks the browser bundle — override early in `providers.tsx`.
10. **`vite-plugin-pwa` precache cap** is 2 MiB by default. The lib-sourcify + viem + ethers chunk is ~4 MB. We bumped to 8 MiB. Proper fix: code-split lib-sourcify behind the Verification tab.
11. **`base` for GitHub Pages** comes from `process.env.VITE_BASE_URL` in `vite.config.ts` (`?? '/'`). Custom-domain deploys (current setup) leave it `'/'`. Project-page URL would need `'/talaria/'`.

## Deploy

GitHub Actions (`.github/workflows/deploy.yml`) builds on every push to `main` and
deploys to GitHub Pages. The `public/CNAME` file pins the custom domain.

To move to a different domain:
1. Edit `public/CNAME` (or delete it for `marcocastignoli.github.io/talaria/`).
2. If using the project-page URL, set `VITE_BASE_URL: /talaria/` in the workflow's
   build step.

## When extending

- **New address-related feature** → check if `useAddressLabel` already exposes what
  you need. Don't duplicate ENS / name lookups.
- **New on-chain read** → batch via `client.multicall()` (remember `multicallAddress`).
- **New ERC standard** → add to `lib/erc/detect.ts` probe + an `useErcNNNInfo.ts`
  hook + a card under `features/address/cards/` + wire into `Overview.tsx` and
  `AddressTypeAvatar.tsx`.
- **New tab on address page** → add `<TabsTrigger value="…">` + `<TabsContent>` in
  `AddressDetail.tsx`. URL-driven by default (`?tab=…`). Add the value to
  `INTENT_TABS` in `useReVerification.ts` if it should bypass the dwell timer.
- **New address-page row in Overview** → put it in `features/address/Overview.tsx`
  (the general card) OR a new `cards/Erc…Card.tsx` if it's ERC-specific.
