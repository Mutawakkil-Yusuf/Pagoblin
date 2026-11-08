# Pagoblin

Free, private, offline-first PDF toolkit. No ads, no accounts, no watermarks, no
server upload — every job runs in your browser, often in a Web Worker, with a
Content-Security-Policy that forbids outbound network connections.

Pip is the goblin who does the chewing.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v3
- `motion/react` for animation, `zustand` for state, `idb` for device-saved
  flows, `@dnd-kit/*` inside merge
- PDF work: `pdf-lib` (merge/split/sign/placements), `pdf.js` (rasterising,
  thumbnails), `@jspawn/ghostscript-wasm` (engine A for compress), plus a
  pdf compress "flatten" engine B fallback
- Sound: Web Audio, all synthesised (`lib/sound.ts`)
- PWA: Serwist (`app/sw.ts`) with precache + engine-asset first-cache + OS
  share target (`POST /share`)

## Layout

| path | what |
| --- | --- |
| `app/` | routes: website (`/`, tool landings, `/pro`, legal), app (`/app`, tools, `/done`, `/settings`, `/share`, `/flows`) |
| `components/tools/` | per-tool clients (MergeTool, SplitTool, CompressTool, ConvertTool, SignTool, ToolLanding, ThumbGrid) |
| `lib/engine/` | job client + per-kind workers (`workers/*.ts`, thin wrappers) and node-safe cores in `impl/` |
| `lib/store/` | zustand stores (files, done, toasts, pip, settings) + IndexedDB flows |
| `design-kit/` | source of truth: screens, tokens, assets, copy rules |
| `public/fonts/` | vendored Bricolage Grotesque + DM Sans woff2 (self-hosted, CSP-safe) |
| `public/pdfjs/`, `public/gs/` | copied from node_modules by `postinstall` |
| `public/icons/` | generated from `design-kit/assets/app-icon.svg` by `npm run icons` |

## Commands

```sh
npm install        # posts-install copies pdfjs + ghostscript assets, patches nft
npm run build      # production build (NODE_OPTIONS heap flag recommended on small boxes)
npm start          # serve the production build
npm run lint       # tsc --noEmit
npm run test       # vitest unit tests (incl. real merge/split/text pipeline tests)
npm run e2e        # playwright — needs a machine that can run chromium
npm run icons      # regenerate PWA icons from the kit's app-icon.svg
```

On ARM/small-memory machines run builds with
`NODE_OPTIONS=--max-old-space-size=3072` (see `DECISIONS.md`).

## Privacy guarantee (the whole point)

- Strict CSP in `next.config.ts`: `connect-src 'self'`, no third-party origins,
  `wasm-unsafe-eval` only for the engines.
- Fonts and every asset are self-hosted or precached by the service worker.
- Files are read into tab memory, processed, and handed back via download or
  the OS share sheet. There is no upload code path.
- `tests/e2e/privacy.spec.ts` enforces it where chromium can run: it embeds a
  unique marker in a generated PDF, runs the compress tool, and asserts no
  request ever leaves the origin or carries the marker.

See `DECISIONS.md` for every inference and workaround (Android-kernel nft
patch, TS version pin, self-hosted fonts, worker literal-URL bundling).
