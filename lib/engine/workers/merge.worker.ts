/** Merge worker: copy pages from each PDF in order into one new document. */
import { PDFDocument } from "pdf-lib";
import type { MergeInput, MergeOutput } from "../types";
import { assertNotCancelled, exposeJobs, resetCancel, u8Part } from "../worker-shared";

async function main(input: MergeInput, onProgress: (p: number, label?: string) => void): Promise<MergeOutput> {
  resetCancel();
  const out = await PDFDocument.create();
  let pages = 0;
  for (let i = 0; i < input.files.length; i++) {
    const f = input.files[i];
    assertNotCancelled();
    let src: PDFDocument;
    try {
      src = await PDFDocument.load(f.buffer, { ignoreEncryption: false });
    } catch (e) {
      const msg = e instanceof Error ? e.message : String(e);
      if (/password|encrypt/i.test(msg)) {
        const err = new Error("password-protected");
        err.name = "PasswordError";
        throw err;
      }
      throw e;
    }
    const indices = src.getPageIndices();
    const copied = await out.copyPages(src, indices);
    copied.forEach((p) => out.addPage(p));
    pages += indices.length;
    onProgress((i + 1) / input.files.length, `Stirring in ${f.name}`);
  }
  const bytes = await out.save({ useObjectStreams: true });
  onProgress(1, "Done");
  return { blob: new Blob([u8Part(bytes)], { type: "application/pdf" }), pages };
}

exposeJobs({ merge: (input, p) => main(input as MergeInput, p) });
