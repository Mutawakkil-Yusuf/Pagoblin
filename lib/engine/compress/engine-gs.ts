/**
 * Engine A: Ghostscript compiled to WebAssembly.
 * Each trial runs in its own classic worker (public/gs-worker.js) over MEMFS and is
 * terminated afterwards, which releases all WASM memory.
 *
 * Ghostscript is AGPL-3.0. Source: https://github.com/jsscheller/ghostscript-wasm
 * (up to https://ghostscript.com). Linked from /about and the footer.
 *
 * @license AGPL-3.0-or-later https://www.gnu.org/licenses/agpl-3.0.html
 */
import type { CompressEngine } from "./engine-types";

/** Classic worker in /public (committed). It loads /gs/gs.js and /gs/gs.wasm, which
 * `npm run postinstall` copies out of node_modules. */
export const GS_WORKER_URL = "/gs-worker.js";

function gsArgs(inPath: string, outPath: string, dpi: number): string[] {
  return [
    "-dSAFER",
    "-dBATCH",
    "-dNOPAUSE",
    "-sDEVICE=pdfwrite",
    "-dCompatibilityLevel=1.5",
    "-dDownsampleColorImages=true",
    `-dColorImageResolution=${dpi}`,
    "-dColorImageDownsampleType=/Average",
    "-dDownsampleGrayImages=true",
    `-dGrayImageResolution=${dpi}`,
    "-dDownsampleMonoImages=true",
    "-dMonoImageResolution=300",
    "-dEmbedAllFonts=true",
    "-dSubsetFonts=true",
    "-dDetectDuplicateImages=true",
    "-dCompressStreams=true",
    `-sOutputFile=${outPath}`,
    inPath,
  ];
}

type GsReply = { ok: boolean; bytes?: Uint8Array; error?: string; progress?: boolean; page?: number; total?: number };

/** Run one Ghostscript pass at a given dpi in a fresh worker. */
export async function runGsOnce(
  input: ArrayBuffer,
  fileName: string,
  dpi: number,
  signalCheck?: () => void,
  onPage?: (page: number, total: number) => void,
): Promise<Uint8Array | null> {
  void fileName; // fixed in-memory names avoid trouble with spaces and unicode
  signalCheck?.();
  const worker = new Worker(GS_WORKER_URL);
  try {
    const reply = await new Promise<GsReply>((resolve, reject) => {
      worker.onmessage = (e: MessageEvent<GsReply>) => {
        if (e.data.progress) {
          onPage?.(e.data.page ?? 0, e.data.total ?? 0);
          return;
        }
        resolve(e.data);
      };
      worker.onerror = (e) => reject(new Error(e.message || "Ghostscript worker failed to start"));
      const copy = input.slice(0);
      worker.postMessage({ input: copy, args: gsArgs("/work/in.pdf", "/work/out.pdf", dpi) }, [copy]);
    });
    signalCheck?.();
    if (!reply.ok || !reply.bytes) throw new Error(reply.error || "Ghostscript trial failed");
    return reply.bytes;
  } finally {
    worker.terminate();
  }
}

export const gsCompressEngine: CompressEngine = {
  id: "gs",
  label: "Squeeze",
  async availability() {
    // The wasm exists as a static asset; real availability is proven on first trial.
    return true;
  },
  async attempt(inputBytes, fileName, dpi, signalCheck, onPage) {
    const bytes = await runGsOnce(inputBytes, fileName, dpi, signalCheck, onPage);
    if (!bytes) return { size: -1, bytes: null };
    return { size: bytes.byteLength, bytes };
  },
};

export { gsArgs };
