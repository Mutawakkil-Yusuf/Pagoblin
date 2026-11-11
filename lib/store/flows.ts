"use client";

/**
 * Saved flows: IndexedDB "pagoblin-flows", store "flows" — device-only, like
 * every other artefact in Pagoblin. Flow steps reuse the engine step configs.
 */
import { openDB, type IDBPDatabase } from "idb";
import type { FlowStepConfig } from "@/lib/engine/types";

export type SavedFlow = { id: string; name: string; steps: FlowStepConfig[]; at: number };

let dbPromise: Promise<IDBPDatabase> | null = null;

async function db(): Promise<IDBPDatabase | null> {
  if (!dbPromise) {
    dbPromise = openDB("pagoblin-flows", 1, {
      upgrade(d) {
        if (!d.objectStoreNames.contains("flows")) d.createObjectStore("flows", { keyPath: "id" });
      },
    }).catch(() => null as unknown as IDBPDatabase);
  }
  try {
    return await dbPromise;
  } catch {
    return null;
  }
}

export async function listFlows(): Promise<SavedFlow[]> {
  const d = await db();
  if (!d) return [];
  try {
    const all = (await d.getAll("flows")) as SavedFlow[];
    return all.sort((a, b) => b.at - a.at);
  } catch {
    return [];
  }
}

export async function saveFlow(flow: SavedFlow): Promise<void> {
  const d = await db();
  if (!d) return;
  await d.put("flows", flow);
}

export async function deleteFlow(id: string): Promise<void> {
  const d = await db();
  if (!d) return;
  await d.delete("flows", id);
}

/** Remove every saved flow from this device (Settings → Clear). */
export async function clearFlows(): Promise<void> {
  const d = await db();
  if (!d) return;
  try {
    await d.clear("flows");
  } catch {
    /* IndexedDB unavailable: nothing was saved here anyway */
  }
}

/** Human label for a step, also used by the flow runner and the SEO page. */
export function stepLabel(step: FlowStepConfig): string {
  switch (step.type) {
    case "merge":
      return "Merge";
    case "compress":
      return step.target ? `Compress to ${Math.round(step.target / (1024 * 1024))} MB` : "Compress, smallest";
    case "rotate":
      return "Rotate 90°";
    case "rename":
      return `Rename “${step.stem}”`;
    default:
      return "Step";
  }
}
