/** Ambient declarations for untyped browser-only engines and CSS side-effect imports. */

// GSAP-free CSS modules (Next handles real builds; TS just needs the module names).
declare module "*.css";

// Ghostscript compiled to WebAssembly, @jspawn/ghostscript-wasm.
// Runtime contract (verified against gs.mjs v0.0.2):
//   const mod = await GS({ locateFile }) ; mod.FS (MEMFS), mod.callMain(argv)
declare module "@jspawn/ghostscript-wasm" {
  export type GsFS = {
    mkdir: (path: string) => unknown;
    writeFile: (path: string, data: Uint8Array) => unknown;
    readFile: (path: string) => Uint8Array;
    chdir: (path: string) => void;
    unlink?: (path: string) => void;
  };
  export type GsModule = {
    FS: GsFS;
    callMain: (args: string[]) => number;
  };
  function GS(options?: { locateFile?: (file: string) => string }): Promise<GsModule>;
  export default GS;
}
