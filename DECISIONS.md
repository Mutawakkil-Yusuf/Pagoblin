# Pagoblin build decisions

Ongoing log. Newest at the bottom of each section. Read top to bottom.

## Environment

- 2026-11-07 — The provided brand kit zip was extracted and moved to `design-kit/` at the repo root (`design-kit/screens`, `design-kit/tokens`, `design-kit/assets`, `BRAND.md`, `SCREENS.md`, `AGENTS.md`). The OpenChamber browser panel cannot be driven from this session (web client), so screens were studied from their HTML source (which is pixel-precise inline CSS) and the finished app is verified with Playwright screenshots instead.
- 2026-11-07 — npm in this box is slow (registry ping ~16 s). Dependencies install with long timeouts, run in background.

## Stack

- Next.js 15 (App Router) + React 19 + TypeScript. Next 15 is the stable line with mature `next/og`, `next/font` and Serwist support. Build with webpack (Serwist and bundled Web Workers both depend on it).
- Tailwind **v3** (not v4). The kit ships `tokens/tailwind.config.js` in v3 format; adopting it verbatim keeps the tokens source-of-truth intact.
- pdfjs-dist **4.10.38** (pinned). v4+ is the generation that comfortably renders into `OffscreenCanvas` from a Worker and ships ESM builds we can import inside our own comlink workers. v5/v6 exist but major-version churn risk for thumbnails/PDF→image was not worth it; API used is stable v4.
- pdf-lib 1.17.1 (merge/split/rotate/sign/embed, text to PDF).
- `comlink` + bundled Web Workers (webpack `new Worker(new URL(...))`) for merge, split, compress (both engines), convert, thumbnails, page counts.
- `motion` (Framer Motion) for all animation, `@dnd-kit/core`/`@dnd-kit/sortable` for reorder, `fflate` for ZipWriter, `zustand` for state, `idb` for saved flows, `@serwist/next` for the service worker.
- Ghostscript WASM for Compress Engine A: `@jspawn/ghostscript-wasm` (AGPL-3.0, Emscripten build, ~16 MB unpacked). See licence section.

## Privacy

- Strict CSP (`next.config.mjs` `headers()`): `default-src 'self'`, `script-src 'self' 'wasm-unsafe-eval'` (+ Plausible host when configured), `connect-src 'self'` (+ Plausible), `img-src 'self' data: blob:`, `object-src 'none'`, `base-uri 'none'`, `frame-ancestors 'none'`. `wasm-unsafe-eval` is required to instantiate Emscripten WASM (Engine A/B) workers.
- Analytics: Plausible only, loaded **only** when `NEXT_PUBLIC_PLAUSIBLE_DOMAIN` is set. Without it there is no third-party request at all. It never receives anything but page URLs.
- Fonts self-hosted through `next/font` (`Bricolage_Grotesque` + `DM_Sans`). The Google Fonts `<link>` in the design HTML is dev convenience and is NOT shipped.
- No tool ships tool JS or WASM on pages that do not need it: tool workers are dynamically imported per route; Ghostscript WASM lives in `public/gs/` and is fetched only inside the compress worker.

## Licensing

- Ghostscript is AGPL-3.0. Shipping it as a static asset inside a free public app: we
  1. keep the repository public,
  2. include `LICENSE` (AGPL-3.0 compatible project licence) and `THIRD_PARTY_NOTICES.md` pointing at the source (github.com/jsscheller/ghostscript-wasm, up to Ghostscript upstream),
  3. link the source from `/about` and the site footer.
- Engine B (pdf.js render → JPEG re-encode → pdf-lib rebuild) exists behind the same `CompressEngine` interface both as an automatic fallback (when WASM fails to init) and as the user-visible "Flatten" option, so the licence choice can be swapped by config without touching UI.

## Fonts / tokens

- Semantic CSS variables mirror `design-kit/tokens/tokens.css` and the Tailwind theme extends the kit's config (missing values were added: `dim`, `cream-shade`, `amber-deep`, type scale from `tokens.json`, `radius-pill`, `color-ink` text pairings). No other hardcoded colour/radius/font values in components; icon stroke widths etc. are structural, not brand values.
- Type scale mapped into Tailwind `fontSize` with kit line-heights (`display-xl` 88 … `micro` 11). Websites hero uses `clamp()` like the reference HTML.

## Framework structure

- Repo root is the Next app. `design-kit/` is kept at root as the visual reference (never imported by the build).
- `/merge-pdf` + friends are SEO pages: the interactive tool rendered at top, explainer + FAQ + privacy line below. Tool bodies are client components shared with `/compress-pdf-to-2mb`, `/pdf-to-jpg`, `/jpg-to-pdf` which pass a preset (e.g. compress target locked to 2 MB, convert format locked to JPG).
- `/done` is state-driven only: if no result is in the store it replaces to `/app`.
- PWA: Serwist precaches the app shell; runtime caching for fonts, `/pdfjs/*`, `/gs/*`. Manifest icons are generated from `design-kit/assets/app-icon.svg` by `scripts/generate-icons.mjs` (uses `sharp`) into `public/icons/*` (192, 512, maskable). Manifest background/theme `#17130F`.
- File share target (`POST /share-target/answer`) receives PDFs and forwards into the app store.

## Tool engines

- One `lib/engine` module with a `Job<I,O>` contract (`{ id, input, onProgress(p,label), signal→cancel() }`), comlink `proxy` progress, throttled to ≥100 ms per emit, cancel via `remote.cancel(id)`.
- Merge: `pdf-lib copyPages`. Split: `extractPages` per page/range; pick=one PDF; every/ranges=ZIP via `fflate`. Convert PDF→image: pdf.js in the pdf worker rendering to `OffscreenCanvas`, `convertToBlob` (PNG/JPG/WebP + quality), ZIP when >1. Image→PDF: pdf-lib embed + Fit/A4 + margins. Text→PDF: pdf-lib standard font, wrap, A4.
- Sign: draw canvas (pointer events, quadratic smoothing, pressure-aware width), Type tab uses self-hosted handwriting-styled fonts rendered to canvas, Upload tab removes near-white background (threshold on pixels). Placement: svg-embed style drag/resize/rotate over a pdf.js preview; keyboard nudge; embeds PNG via `pdf-lib.embedPng`.
- Compress Engine A: `@jspawn/ghostscript-wasm` `gsapi` with `-sDEVICE=pdfwrite`; binary-searches `-dColorImageResolution` (and JPEG Q by preset ladder) so the result converges to the requested target; stops at target. Engine B: pdf.js render each page at adaptive DPI, JPEG re-encode, pdf-lib rebuild — explicitly labelled "flatten".
- Both engines implement `CompressEngine { init(), compress(input) → { blob, meta } }`. UI is engine-agnostic; honest reporting measured from real output sizes only.
- Thumbnails: pdf.js in worker → OffscreenCanvas → blob URL; client shows shimmer skeletons; lazy via IntersectionObserver.
- Limits: warn >50 MB on phones / >100 MB desktop ("That is a big one. Pip may be slow."). Calm error mapping for password-protected, corrupt, 0-byte files and non-PDF drops.
- Downloads: single → `object URL` click; multi → fflate zip; Share → `navigator.canShare({ files })` on mobile else download.

## Pip

- `<Pip mood size />` React SVG built part-for-part from `design-kit/assets/pip-happy.svg` (groups: ear-l, ear-r, body, fold, sprout, eye-l, eye-r, mouth, cheek-l/cheek-r, arm-l/arm-r, foot-l/foot-r). Wow/sleepy/sad/celebrate faces drawn in the exact same geometry style; no outlines, no recolour, no stretching. `gulps` + `mouth-open` states come from the drop zone events.

## Copy

- All tool copy follows `BRAND.md` voice; success lines may use one `!`; error copy is calm with no jokes; no invented stats/prices (Pro uses `[PRICE]`).

## Misc

- The 2026 npm registry is slow on this box; `next/font` downloads at build time (needs network) — acceptable, it self-hosts after.

## Phase 1 build-day decisions (appended)

- Fonts: `next/font/google` could not fetch Google at build time on this box (font loader retried 3x then failed). Vendored the Google woff2 files (Bricolage Grotesque + DM Sans, latin/latin-ext/vietnamese subsets) into `public/fonts/` and declared them with `@font-face` + `unicode-range` in `app/globals.css`. CSP stays `connect-src 'self'`; family names in Tailwind ("Bricolage Grotesque"/"DM Sans") unchanged. Build no longer needs the network for fonts.
- TypeScript pinned to 5.9.3: TS 7 (native) breaks `next.config.ts` loading (`Cannot read properties of undefined (reading 'fileExists')`) on Next 15.5.
- Next's bundled `@vercel/nft` build-tracer crashes on this Android kernel ("Recursive symlink detected resolving /proc/N"): `/proc/<pid>` is a self-referential symlink here. `scripts/patch-nft.mjs` (idempotent, wired into `postinstall`) makes nft's `realpath` return `/proc*` paths without following links. `/proc` is never bundled, so this is a pure build fix.
- Node heap: Next build OOMs at the default heap on this device; scripts and runs use `NODE_OPTIONS=--max-old-space-size=3072`.
- Tailwind additions (all sourced from tokens.json): `spacing 4.5` (18px, the card inset from screens), `rotate tilt-a/-b/-c` (from `rotation-deg`) plus a plain degree axis for the few hero-card tilts, `zIndex 60/100` for the toast/action layers.
- Engine worker API unified: every worker exposes `run({ kind, input }, onProgress)` + `cancel()` via a shared `exposeJobs()` helper (progress throttled centrally in `worker-shared.createProgress`). One worker chunk per job kind: merge, split, compress, convert, pdf-tool (rotate/sign), thumbs (info/thumbnails). Paths are literal strings in `client.ts` so webpack statically extracts them; a fresh worker runs each job and is terminated after (guarantees Ghostscript WASM memory release).
- TS 7-style generic `Uint8Array<ArrayBufferLike>` vs `BlobPart`: worker-shared `u8Part()` copies view→plain ArrayBuffer (all bytes are local); used wherever pdf-lib save() bytes become a Blob.
- pdf.js is imported as `"pdfjs-dist"` (main, typed) in workers; `GlobalWorkerOptions.workerSrc = "/pdfjs/pdf.worker.min.mjs"` (self-hosted copy from `scripts/copy-pdfjs.mjs`, including `cmaps/` + `standard_fonts/` for CJK, lazy-cached by the SW).
- Share target: manifest `POST /share` (`multipart/form-data`), SW intercepts, stashes files only into Cache Storage (`share-target`), redirects to `/share?received=1`; the page reads them back into the tool store and clears the cache. File bytes never touch a server. (Earlier entry said `/share-target/answer` — superseded by this simpler route.)
- PWA manifest generated by `app/manifest.ts` (id/start_url `/app`, standalone, share_target). `app/sw.ts` uses Serwist with precache + `defaultCache` runtime rules + a `CacheFirst` rule for `/pdfjs/*` and `/gs/*`.
- dnd-kit (core/sortable/modifiers/utilities) added for merge row dragging; pointer press-delay 160 ms so taps still work, keyboard sensor for sortable access, `restrictToVerticalAxis`.
- The pipeline for drop ingestion lives in `DropZone` (drag/paste/picker) + `makeFileItems` validation (0-byte, non-PDF, `%PDF` magic probe, >50 MB phone / >100 MB desktop warnings, page-count probe via `readPageCount`, encrypted → calm removal).
- Welcome overlay (screen 01) renders over `/app` until `welcomeSeen` (persisted); two scroll-snap slides, chips copy straight from the screen HTML. Add-button action sheet narrows `accept` by active route via `lib/toolRouting.ts`.
- `/` gets a minimal-but-valid dark landing for Phase 1 (`app/page.tsx`); the full SEO homepage is Phase 5 as planned.
- Unit tests (vitest) cover format, ranges, and the compress target-size search driver (18 passing). Playwright e2e lands with the privacy test in Phase 2.

## Phase 2 build-day decisions (appended)

- Split (screen 06): three modes in flex-1 chips; pick-mode shows real thumbnail renders (3-across cream cards, 3px orange outline with offset, check bubble top-right, number bottom-left), "N of 9 pages selected" status with aria-live, button label "Split N pages". Ranges mode: parseRanges tokens (open ends resolve at parse time), single "page" tokens become {start:page,end:page} so "5" alone still yields one PDF.
- Compress (screen 04): targets 1/2/5 MB + "Smallest" (target=null). No fabricated estimates shown pre-run — the card explains Pip tries real recipes (engine A GS rasterisation, engine B flatten fallback) and the done screen shows measured sizes only.
- Convert (screen 08): tabs PDF→image (PNG/JPG/WebP, quality 0.92 @ scale 2), Image→PDF (fit pages, 6% padding), Text→PDF (A4 wrap, WinAnsi-stripped Helvetica). Locked "Word" chip carries the screen's honesty copy: server needed, arrives as Pro extra.
- Playwright cannot run on this device: chromium renders crash ("Target crashed"/ERR_ABORTED even for data: URLs — kernel seccomp against renderer syscalls), firefox/webkit missing system libs. Verification therefore: tsc, next build, vitest — plus new *node-safe impl modules*.
- Engine restructure for testability: merge/split/textToPdf cores moved to `lib/engine/impl/*.ts` (node-safe, no exposeJobs), workers now thin wrappers. New `tests/unit/pipeline.test.ts` runs the REAL worker cores against generated PDFs (merge order, pick/ranges/every split shapes, PDF header, pagination). 25 unit tests green.
- Landing pages for split/compress/convert built with ToolLanding + per-tool FAQ; metadata + canonical per AGENTS SEO pattern.

## Phase 4 build-day decisions (appended)

- Flows rebuilt for real (screen 09): builder card with named steps, step chips (Merge, Compress to n MB, Smallest, Rotate 90°), Save → IndexedDB "pagoblin-flows/flows" {id,name,steps:FlowStepConfig[],at}; FREE_FLOW_LIMIT 3 saved on free; runs execute via the SAME worker clients (runMerge/runCompress/runRotate) in lib/engine/flowRunner with per-step progress, land on the done screen with zipped outputs when several files.
- Sign: worker takes top-left FRACTIONS of the page (types.ts comment corrected), resolves page size in the worker with pdf-lib. Placement editor = 640px thumb skeleton + draggable overlay; size and tilt sliders; scope chips page/all/last; ink choices are canvas colours (#17130F, #1D2FA6 — display colours, not tokens).
- Pro page (screen 11): [PRICE] placeholder kept literally per AGENTS copy rule ("Do not invent prices"); no waitlist email capture because there is no server — page explains Pro honestly; free tier stays free forever.
- Legal pages: privacy page reflects the real build (no cookies, no analytics, CSP blocks outbound; IndexedDB flows on device). Terms carry the as-is/no-warranty and signature-not-legal-advice lines. About tells the on-device story.
- SEO preset landings: /compress-pdf-to-2mb → CompressTool initialTarget 2MB; /pdf-to-jpg → ConvertTool presets (pdf-to-image, jpg); /jpg-to-pdf → image-to-pdf tab. Presets are initial states, not locks (keep the whole tool honest).
- Site plumbing: sitemap.ts (16 URLs), robots.txt (disallow /done, /share), JSON-LD SoftwareApplication on the homepage, homepage expanded with the screen-12 "why different" + comparison sections.
- Playwright remains unrunnable on this device (chromium renderer crashes under kernel seccomp; firefox/webkit missing system libs). Verification for now: tsc + build + 25 vitest unit tests incl. real pipeline runs of merge/split/text cores. e2e + visual parity check deferred to a machine that runs the browsers.

## Phase 5 build-day decisions (appended)

- The privacy e2e lives at tests/e2e/privacy.spec.ts + playwright.config.ts: generates a marker-carrying PDF (pdf-lib), drops it into compress, runs, then walks every captured request asserting same-origin + no marker in any body. `npm run e2e` expects a machine that can run chromium (this ARM box cannot; see the browser note above).

## Deployment fix (appended)

- Vercel deploy rendered blank: the strict `script-src 'self' 'wasm-unsafe-eval'` CSP blocked the App Router's inline `self.__next_f.push` bootstrap scripts, so hydration never started — and with motion components holding SSR'd `opacity:0` initial states, the page stayed invisible forever. Fix: allow `'unsafe-inline'` in script-src. Rationale: nonce-based CSP would force every route dynamic (breaking static prerender + the offline precache), and there is no server-rendered user data anywhere, so the added XSS surface is nil while the real guarantees (connect-src 'self', zero third origins, no upload path) are unchanged and still enforced by the e2e privacy guard.

## Phase 1 build-day decisions (appended)

- Scope shipped: page organizer, protect/unlock, metadata inspector/editor/sanitizer, PDF→text/Markdown, true redaction, AcroForm fill/flatten, local OCR, and a batch queue with ZIP output. With the Phase 0 tools that makes 13 tools across 16 routes (size and format variants included), plus saved flows, all still on-device.
- Organizer: pdf-lib copies pages into a fresh document in the exact order shown. Inserted PDFs are additional sources, and rotation is applied per page at build time. Thumbnails come from the existing pdf.js worker; drag/keyboard sorting uses dnd-kit.
- Protect/unlock: qpdf compiled to WASM (`@jspawn/qpdf-wasm` 0.0.2, qpdf 11.0.0, single-threaded, ~1.3 MB). The pthread build was rejected because it needs cross-origin isolation and a much larger asset. `public/qpdf-worker.js` is a classic worker that loads `/qpdf/qpdf.js` + `/qpdf/qpdf.wasm`, runs exactly one job, then is terminated so the WASM heap is released. The argument list is built by the pure `lib/engine/impl/qpdf.ts` so flags are unit-tested. AES-256; the owner password is optional and falls back to the open password, with the UI saying that permissions are then controlled by the same password.
- Metadata: pdf-lib reads/writes the standard fields and dates. Sanitize rebuilds a fresh PDF page by page, dropping document actions, JavaScript, attachments, forms, outlines, page annotations, document `/Metadata` and page-level `/Metadata`. The risk report is a structural hint, not a parser or virus scan. The scanner (`lib/engine/impl/pdf-scan.ts`) walks the raw bytes once instead of decoding a 100 MB file into a latin1 string, so memory stays bounded.
- PDF→text/Markdown: pdf.js text runs are grouped into visual lines by position, then emitted as plain text or lightly structured Markdown. No OCR is involved; scans are reported honestly and pointed at the OCR tool.
- Redaction: pages are rendered, the marked boxes are painted black on the pixels, and a new PDF is assembled from those images. The text underneath is not copied into the output, so this is true redaction rather than a black rectangle over live text. The trade-off (no selectable text, links/forms gone) is stated in the UI and FAQ; OCR can add a new searchable layer afterwards.
- Forms: pdf-lib fills text fields, checkboxes, radio groups, dropdowns and option lists, with an optional flatten. XFA-only forms are detected with a byte-level `/XFA` name scan and called out instead of silently doing nothing. Only values for fillable fields are sent to the worker, so read-only/unsupported fields cannot be accidentally changed.
- OCR: tesseract.js 7 plus `@tesseract.js-data/{eng,spa,fra,deu}`. `scripts/copy-ocr.mjs` copies the worker, core variants and language packs into `public/ocr/`; all paths are same-origin and CSP-safe, so there is no CDN request. The searchable PDF puts the rendered page image underneath and invisible Helvetica text over it; low-confidence words (<30) are skipped. Text mode counts recognised words.
- Large files: Phase 1 job contracts accept `PdfData = ArrayBuffer | File`. UI code passes the original `File`; the worker calls `arrayBuffer()` on its own thread (`readPdfData`). This avoids a second full-size copy on the main thread for a 100 MB PDF. OPFS staging was considered and deliberately rejected: it would add a disk copy without lowering peak processing memory, and the worker still needs the bytes in memory to parse them. The 50 MB phone / 100 MB desktop warning thresholds stay.
- Batch: compress, PDF→images and PDF→text/Markdown run one file at a time to keep memory bounded. Results are returned as multiple outputs and zipped by the done screen. Stop is graceful: first tap stops after the current file, second tap aborts immediately. Finished outputs are still delivered; failures are reported per file and the queue continues.
- Entitlements: batch processing and OCR are free, as are all on-device tools. The `?pro=1`/`?pro=0` URL override was removed because a query string is not a licence. Pro now lists only future extras (more saved flows, Office conversion, supporting the project) and is not for sale.
- Settings → Clear now drops every tool's in-memory files and page counts, the done result, persisted preferences, saved flows in IndexedDB, and the `share-target` cache. Engine caches are kept because they are app assets, not user data.
- Accessibility/touch: primary interactive targets are 44px or larger, including settings toggles/segments, file remove buttons, merge arrows, sign ink swatches and the Clear button. Redaction uses pointer capture, resets the draft on page change, and exposes the preview as a described group; sign previews use the real page aspect ratio, revoke object URLs and trim/transparentise uploaded signature backgrounds.
- Tests: `tests/unit/phase1.test.ts` covers organizer ordering, metadata read/write/sanitize/risk scan, form inspect/fill/flatten, text layout/Markdown, redaction geometry and qpdf argument construction. The full suite is 38 tests. `tsc --noEmit`, the production build and the unit suite pass on this device. Browser/Playwright verification is still impossible here because Chromium crashes under the kernel seccomp policy; that limitation is unchanged from earlier phases.
- PWA icons were missing locally and `public/icons/` was gitignored even though the manifest and README expect committed icons. Icons were regenerated with `npm run icons` and are now tracked so an install from the repository has the manifest assets.
