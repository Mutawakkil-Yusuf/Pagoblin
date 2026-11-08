/**
 * Flow runner: executes saved steps over a set of files, on the device,
 * by calling the same worker clients the single tools use. Progress is
 * reported per step with honest fractions.
 */
import { runMerge, runCompress, runRotate } from "@/lib/engine/client";
import type { FlowStepConfig } from "@/lib/engine/types";
import type { DoneBlob } from "@/lib/store/done";

function stemOf(name: string): string {
  return name.replace(/\.pdf$/i, "");
}

export type FlowProgress = (frac: number, label: string) => void;

export async function runFlowSteps(
  files: { name: string; buffer: ArrayBuffer }[],
  steps: FlowStepConfig[],
  onProgress: FlowProgress,
): Promise<{ outputs: DoneBlob[]; count: number; pages: number | null }> {
  let blobs: { blob: Blob; name: string }[] = files.map((f) => ({ blob: new Blob([f.buffer], { type: "application/pdf" }), name: f.name }));
  let pages: number | null = null;

  for (let i = 0; i < steps.length; i++) {
    const step = steps[i];
    const base = (frac: number, label: string) => onProgress((i + frac) / steps.length, label);
    base(0, stepLabel2(step));

    if (step.type === "merge") {
      const buffers = [];
      for (const b of blobs) buffers.push({ name: b.name, buffer: await b.blob.arrayBuffer() });
      const out = await runMerge({ files: buffers }, { onProgress: (p) => base(p, "Merging") });
      pages = out.pages;
      blobs = [{ blob: out.blob, name: "merged.pdf" }];
    } else if (step.type === "compress") {
      const next: typeof blobs = [];
      for (let j = 0; j < blobs.length; j++) {
        const b = blobs[j];
        const out = await runCompress(
          {
            file: await b.blob.arrayBuffer(),
            fileName: b.name,
            target: step.target ?? null,
            engine: "auto",
          },
          { onProgress: (p) => base((j + p) / blobs.length, `Squeezing ${b.name}`) },
        );
        next.push({ blob: out.blob, name: `${stemOf(b.name)}-squeezed.pdf` });
      }
      blobs = next;
    } else if (step.type === "rotate") {
      const next: typeof blobs = [];
      for (let j = 0; j < blobs.length; j++) {
        const b = blobs[j];
        const out = await runRotate(
          { file: await b.blob.arrayBuffer(), steps: step.steps },
          { onProgress: (p) => base((j + p) / blobs.length, `Rotating ${b.name}`) },
        );
        next.push({ blob: out.blob, name: `${stemOf(b.name)}-rotated.pdf` });
      }
      blobs = next;
    } else if (step.type === "rename") {
      blobs = blobs.map((b, j) => ({
        blob: b.blob,
        name: blobs.length === 1 ? `${step.stem}.pdf` : `${step.stem}-${j + 1}.pdf`,
      }));
    }
    base(1, stepLabel2(step));
  }

  const outputs: DoneBlob[] = blobs.map((b) => ({ blob: b.blob, name: b.name }));
  return { outputs, count: blobs.length, pages };
}

// Label without importing the store (keeps this module usable anywhere).
function stepLabel2(step: FlowStepConfig): string {
  switch (step.type) {
    case "merge":
      return "Merging";
    case "compress":
      return step.target ? `Squeezing to ${Math.round(step.target / (1024 * 1024))} MB` : "Squeezing";
    case "rotate":
      return "Rotating";
    case "rename":
      return "Renaming";
    default:
      return "Working";
  }
}
