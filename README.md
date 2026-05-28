# Talaria

A clean, friendly EVM block-explorer + contract interaction tool — built around the
[Sourcify clear-signing](https://github.com/sourcifyeth/clear-signing) standard so
transactions read like sentences instead of hex blobs, and re-verified entirely in
the browser so you don't have to trust anyone's word.

**Live:** [talaria.castignoli.it](https://talaria.castignoli.it/)

## What it does

- **Point at any RPC** — public, private, or self-hosted. Stored locally.
- **Browse transactions** rendered via the **ERC-7730 clear-signing standard** — no
  raw calldata, no unlabeled hex. Lists too.
- **Sourcify v2 lookup** for verified contracts, with **client-side re-verification**:
  the browser downloads the right Solidity compiler via [web-solc](https://github.com/gnidan/web-solc),
  recompiles the source in a Web Worker, and bytecode-matches against the chain — so
  "verified" isn't a label you have to trust.
- **ERC-aware overview** for contracts: ERC-20 / ERC-721 / ERC-1155 / ERC-4626 detected
  via multicall probe, with a dedicated info card per standard.
- **Address pages** for any address (EOA / contract / EIP-7702 delegated EOA) with a
  type-appropriate avatar icon.
- **Read / Write tabs** for verified contracts — auto-rendered ABI forms, wallet
  signing via [Reown AppKit](https://reown.com/appkit) (supports MetaMask, Ledger,
  Trezor, WalletConnect, embedded wallets).
- **Identity hierarchy** everywhere addresses appear: ENS → token name → generated
  friendly name (`silly-panda-aa49`) → truncated hex.

## Stack

- Vite + React 19 + TypeScript
- Tailwind v4 + Radix UI primitives
- viem + ethers v6
- TanStack Query + Zustand
- [`@ethereum-sourcify/lib-sourcify`](https://www.npmjs.com/package/@ethereum-sourcify/lib-sourcify)
  for trustless re-verification
- [`@ethereum-sourcify/clear-signing`](https://www.npmjs.com/package/@ethereum-sourcify/clear-signing)
  for ERC-7730 rendering
- [`web-solc`](https://www.npmjs.com/package/web-solc) for in-browser Solidity
  compilation

## Develop

```bash
npm install
npm run dev
```

## Deploy

GitHub Actions builds + pushes to GitHub Pages on every push to `main`. See
[`.github/workflows/deploy.yml`](./.github/workflows/deploy.yml).

## License

MIT
