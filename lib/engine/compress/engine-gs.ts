/**
 * Engine A: Ghostscript compiled to WebAssembly.
 * Each trial runs a fresh Ghostscript instance via callMain over MEMFS (the
 * runtime contract of @jspawn/ghostscript-wasm). The job client terminates the
 * worker after each job, releasing all WASM memory; per-trial instances are
 * dropped for garbage collection.
 *
 * Ghostscript is AGPL-3.0. Source: https://github.com/jsscheller/ghostscript-wasm
 * (up to https://ghostscript.com). Linked from /about and the footer.
 *
 * @license AGPL-3.0-or-later https://www.gnu.org/licenses/agpl-3.0.html
 */
import GS from "@jspawn/ghostscript-wasm";
import type { CompressEngine } from "./engine-types";

type GsModule = Awaited<ReturnType<typeof GS>>;

export const GS_WASM_URL = "/gs/gs.wasm";

async function instance(): Promise<GsModule> {
  return GS({
    locateFile: (file: string) => (file.endsWith(".wasm") ? GS_WASM_URL : `/gs/${file}`),
  });
}

function gsArgs(fileName: string, outName: string, dpi: number): string[] {
  return [
    "-dSAFER",
    "-dBATCH",
    "-dNOPAUSE",
    "-dQUIET",
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
    `-sOutputFile=${outName}`,
    fileName,
  ];
}

/** Run one Ghostscript pass at a given dpi. Returns the output bytes. */
export async function runGsOnce(
  input: ArrayBuffer,
  fileName: string,
  dpi: number,
  signalCheck?: () => void,
): Promise<Uint8Array | null> {
  const mod = await instance();
  try {
    signalCheck?.(); // between bootstrap and render
    const fs = mod.FS;
    fs.mkdir("/work");
    const inPath = `/work/${fileName}`;
    fs.writeFile(inPath, new Uint8Array(input));
    const outPath = "/work/out.pdf";
    mod.callMain(gsArgs(inPath, outPath, dpi));
    signalCheck?.();
    try {
      const out = fs.readFile(outPath);
      // Copy out of MEMFS before the module is dropped.
      return new Uint8Array(out);
    } catch {
      return null;
    }
  } finally {
    void mod; // instance dropped; worker termination releases the real memory
  }
}

export const gsCompressEngine: CompressEngine = {
  id: "gs",
  label: "Squeeze",
  async availability() {
    // The wasm exists as a static asset; real availability is proven on first trial.
    return true;
  },
  async attempt(inputBytes, fileName, dpi, signalCheck) {
    const bytes = await runGsOnce(inputBytes, fileName, dpi, signalCheck);
    if (!bytes) return { size: -1, bytes: null };
    return { size: bytes.byteLength, bytes };
  },
};

export { gsArgs };
