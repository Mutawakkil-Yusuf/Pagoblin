# Pagoblin

Free, private, offline-first PDF toolkit. No ads, no accounts, no watermarks, no
server upload — every job runs in your browser, often in a Web Worker, with a
Content-Security-Policy that forbids outbound network connections.

Pip is the goblin who does the chewing.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript + Tailwind v3
- `motion/react` for animation, `zustand` for state, `idb` for device-saved
  flows, `@dnd-kit/*` inside merge and the page organizer
- PDF work: `pdf-lib` (merge/split/organise, metadata, forms, signatures,
  text/OCR PDF assembly), `pdf.js` (rasterising, thumbnails, text extraction),
  `@jspawn/ghostscript-wasm` (engine A for compress), plus a PDF compress
  "flatten" engine B fallback, `@jspawn/qpdf-wasm` (AES encryption/unlock),
  and `tesseract.js` (local OCR)
- Sound: Web Audio, all synthesised (`lib/sound.ts`)
- PWA: Serwist (`app/sw.ts`) with precache + engine-asset first-cache + OS
  share target (`POST /share`)

## Layout

| path | what |
| --- | --- |
| `app/` | routes: website (`/`, 16 tool pages for 13 tools plus size/format variants, `/pro`, legal), app (`/app`, tools, `/done`, `/settings`, `/share`, `/flows`) |
| `components/tools/` | per-tool clients (merge, split, organise, compress, convert, sign, protect, metadata, PDF→text, redact, forms, OCR, batch) plus shared ToolLanding/ToolParts/ThumbGrid |
| `lib/engine/` | job client + per-kind workers (`workers/*.ts`, thin wrappers) and node-safe cores in `impl/`; `ocr.ts` drives tesseract.js |
| `lib/store/` | zustand stores (files, done, toasts, pip, settings) + IndexedDB flows |
| `design-kit/` | source of truth: screens, tokens, assets, copy rules |
| `public/fonts/` | vendored Bricolage Grotesque + DM Sans woff2 (self-hosted, CSP-safe) |
| `public/pdfjs/`, `public/gs/`, `public/qpdf/`, `public/ocr/` | copied from node_modules by `postinstall` (gitignored) |
| `public/qpdf-worker.js` | classic worker that loads qpdf's WASM and runs one job per worker |
| `public/icons/` | generated from `design-kit/assets/app-icon.svg` by `npm run icons` (committed) |
| `tests/unit/` | vitest suites for format/ranges, the real merge/split/text cores, and Phase 1 engines |

## Commands

```sh
npm install        # postinstall copies pdfjs, ghostscript, qpdf and OCR assets; patches nft
npm run build      # production build (NODE_OPTIONS heap flag recommended on small boxes)
npm start          # serve the production build
npm run lint       # tsc --noEmit
npm run test       # vitest unit tests (incl. real engine cores and Phase 1 engines)
npm run e2e        # playwright — needs a machine that can run chromium
npm run icons      # regenerate committed PWA icons from the kit's app-icon.svg
```

On ARM/small-memory machines run builds with
`NODE_OPTIONS=--max-old-space-size=3072` (see `DECISIONS.md`).

## Privacy guarantee (the whole point)

- Strict CSP in `next.config.ts`: `connect-src 'self'`, no third-party origins,
  `wasm-unsafe-eval` only for the engines.
- Fonts, OCR language packs and every engine are self-hosted or cached by the
  service worker. No CDN is involved, including for OCR.
- Files are read into tab memory, processed, and handed back via download or
  the OS share sheet. Large PDFs are passed to workers as the original `File`
  reference, so the main thread does not make a second full-size copy.
- There is no upload code path. Protect/unlock runs qpdf WASM locally, and OCR
  runs tesseract.js locally.
- `tests/e2e/privacy.spec.ts` enforces it where chromium can run: it embeds a
  unique marker in a generated PDF, runs the compress tool, and asserts no
  request ever leaves the origin or carries the marker.

See `DECISIONS.md` for every inference and workaround (Android-kernel nft
patch, TS version pin, self-hosted fonts, worker literal-URL bundling, and the
Phase 1 file-to-worker decision).


## PWA and offline

- Installable: manifest at `/manifest.webmanifest`, icons in `public/icons/` (committed; regenerate with `npm run icons` after changing `design-kit/assets/app-icon.svg`), install screenshots in `public/screenshots/`.
- The service worker (`app/sw.ts`, built to `public/sw.js`) precaches the app shell and every route. The heavy engines (`/gs`, `/pdfjs`, `/qpdf`, `/ocr`, about 45 MB) are cached the first time a tool uses them, or on demand with Settings, Work offline.
- Client navigations (for example to `/done`) are cached too, so a finished result is never lost offline.
- Test offline for real: `npm run build && npm start`, open the app, then stop the server and reload.

## Links

Repo, Instagram and X live in `lib/links.ts`.
