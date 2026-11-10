# Fixes in this build

- Compress: Ghostscript now runs from public/gs-worker.js (classic worker). Falls back to the flatten engine. Never returns a bigger file.
- Sign: decodes the signature without fetch(), which the CSP blocks.
- File picker: no longer resolves empty when the window regains focus. Whole drop zone is tappable.
- Phone top bar with sound toggle and settings (sticky, safe area aware).
- Welcome overlay z-index (z-101 added to tailwind.config.js).
- rounded-pill added to tailwind.config.js (was missing, buttons were square).
- bg-ink/92 changed to bg-ink/90.
- client.ts logs failed jobs to the console for easier debugging.

After pulling: run `npm install` (the postinstall copies Ghostscript to public/gs).

## Compress stuck at 2% (second round)

- Cause: it was working, not frozen. Each Ghostscript pass over a big file is slow and nothing reported progress inside a pass.
- Ghostscript progress is now read from the worker (page k of N). This build ignores the `print` option, so public/gs-worker.js replaces `console.log` before loading the glue.
- Smoother progress bar that never stalls or jumps to 100 early.
- Fewer passes: the search interpolates (size is roughly linear in dpi squared) and stops within 15% of the target. Max dpi is 180. A 356 page test went from 6+ passes to 3.
- Finished passes are reused for the final file instead of running the whole file again.
- A file already under the target is returned untouched, instantly.

## Settings toggles
- The switch was shrinking inside the flex row (no shrink-0), so the knob slid past the track. Fixed size 68x40, knob 28 px with even padding, shrink-0 added (components/ui/core.tsx).

## Laptop layouts, landing page, credit, PWA (round 3)

- Laptop layouts: App home is two columns (drop zone | tip + quick fixes), Tools is a 3 column grid, tool pages put the tool on the left and About/FAQ on the right (1024px and up). Phone layouts are unchanged. Tool pages now show a visible title.
- Landing page rebuilt to the design: hero with Pip, colour cards, comparison, public source section, install button, credit footer.
- Source link (https://github.com/Mutawakkil-Yusuf/Pagoblin) on the landing page header, hero, its own section, footer, About, Settings and the desktop nav. The old placeholder link in Settings is gone.
- Credit "Built and designed by Mutawakkil" with Instagram and X (itsmutawakkil) in the landing footer, About and Settings. Links live in `lib/links.ts`.
- PWA: the icons were never generated, so the app could not be installed. They are now committed (`public/icons`), the manifest gained shortcuts and screenshots, and installability reports no errors.
- The install event is captured early (inline script) so Install buttons work: landing page, desktop nav, Settings and the Done card.
- The service worker no longer downloads the 16 MB Ghostscript file on first visit. Engines are cached on first use, or from Settings, Work offline.
- `reloadOnOnline` is off, so coming back online never reloads the page and wipes a file in progress.
- `/gs-worker.js` is now cached, otherwise Compress failed offline.
- Offline pill ("Offline. Pip still works.").
- Tested with the server fully stopped: pages open, Merge and Compress (Ghostscript) finish and reach the Done page.
- Settings no longer shows the "Settings" heading twice.
