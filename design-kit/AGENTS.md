# Instructions for the build agent

You are building **Pagoblin**, a free, private, no ads, no signup PDF toolkit as a website and installable web app.

## Source of truth, in order
1. `tokens/` for every colour, font, radius and size. Never hardcode a value that exists there.
2. `BRAND.md` for tone, mascot rules and copy.
3. `screens/*.html` for layout. Match them closely. They are references, not production code.
4. `references/` is mood only. Do not copy those designs.

## Product rules (non negotiable)
- All PDF processing runs in the browser. User files must never be sent over the network. Set a strict CSP (`connect-src 'self'` plus the analytics host).
- Analytics: Plausible or Umami only. Never log file names, sizes or content.
- No ads, no account, no watermark, no daily limits on everyday tools.
- Work offline after install (PWA).

## Stack
Next.js and Tailwind (use `tokens/tailwind.config.js`), pdf-lib for merge, split, reorder, rotate, sign. PDF.js for previews and thumbnails. Ghostscript compiled to WebAssembly for compression, with a target size search (try quality levels until the file fits). Run heavy work in Web Workers. Workbox for the PWA. IndexedDB for saved flows. Payments later with Lemon Squeezy or Stripe.

## Build order
1. Shared file handling, upload screen, Welcome and Home.
2. Merge (proves the pipeline), then Split, Sign, Convert (PDF and images only).
3. Compress with target size, then Flows.
4. Done screen, PWA, SEO landing page per tool (for example "merge pdf free no upload"), website homepage.
5. Pro: batch, saved flows, OCR, Office conversion (needs a server, keep it clearly separate from the private tools).

## Design rules
- Dark first. Flat colour. Soft shapes. No gradients, glows, purple, emoji or stock art.
- Fonts: Bricolage Grotesque for display, DM Sans for body. Load from Google Fonts with fallbacks.
- Pip appears only where `BRAND.md` says. Use the SVGs in `assets/` as given.
- Primary buttons orange, text Ink. Touch targets at least 44 px. Visible focus ring in amber. Respect `prefers-reduced-motion`.
- Real `<button>` and `<a>` elements, labels on icon buttons, text contrast 4.5:1 or better.
- Copy comes from the screens and the voice rules. Do not invent stats, testimonials or prices. Use `[PRICE]` until told.

## Definition of done for each tool
Works on a phone and desktop, handles a 100 MB file without freezing the page (worker plus progress), shows a calm error for oversized files, never makes a network request with file data, and matches the matching screen in `screens/`.
