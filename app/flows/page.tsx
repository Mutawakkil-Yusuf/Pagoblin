"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { openDB, type IDBPDatabase } from "idb";
import { motion } from "motion/react";
import { AppPage } from "@/components/nav/AppPage";
import { Pip } from "@/components/pip/Pip";
import { isPro, FREE_FLOW_LIMIT } from "@/lib/entitlements";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

/**
 * Flows (screen 09). V1: saved chains list from IndexedDB, hand-built today;
 * the builder lands with Phase 3. Flow shape is settled now so the builder
 * can't break the list:
 *   db "pagoblin-flows" store "flows" { id, name, steps: string[], at }
 */
export type SavedFlow = { id: string; name: string; steps: string[]; at: number };

const STEPS_PREVIEW = ["Merge", "Compress to 2 MB", "Rename"] as const;

async function flowsDb(): Promise<IDBPDatabase | null> {
  try {
    return await openDB("pagoblin-flows", 1, {
      upgrade(db) {
        if (!db.objectStoreNames.contains("flows")) db.createObjectStore("flows", { keyPath: "id" });
      },
    });
  } catch {
    return null;
  }
}

export default function FlowsPage() {
  const [flows, setFlows] = useState<SavedFlow[] | null>(null);

  useEffect(() => {
    void (async () => {
      const db = await flowsDb();
      if (!db) {
        setFlows([]);
        return;
      }
      const all = (await db.getAll("flows")) as SavedFlow[];
      all.sort((a, b) => b.at - a.at);
      setFlows(all);
    })();
  }, []);

  return (
    <AppPage width={480}>
      <div className="mt-10 flex items-start justify-between md:mt-6">
        <div>
          <h1 className="font-display text-h2 text-cream">Flows</h1>
          <p className="mt-1 max-w-[300px] text-body text-muted">Chain a few steps, run once. Saved on this device only.</p>
        </div>
        <Pip mood="idle" size={72} className="-mt-2" />
      </div>

      {flows === null ? (
        <div className="mt-8 space-y-3">
          <div className="skeleton h-[84px] w-full" />
          <div className="skeleton h-[84px] w-full" />
        </div>
      ) : flows.length === 0 ? (
        <div className="mt-10">
          <div className="justify-center text-center">
            <Pip mood="sleepy" size={124} className="mx-auto" />
          </div>
          <p className="mt-4 text-center text-body text-muted">No flows yet. When the builder is ready, Pip starts with this one:</p>
          <div className="mx-auto mt-5 w-full max-w-[320px] rounded-card-l bg-surface p-4">
            <div className="flex flex-col items-stretch gap-1">
              {STEPS_PREVIEW.map((s, i) => (
                <motion.div
                  key={s}
                  initial={{ opacity: 0, x: -8 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: i * 0.08 }}
                  className="flex items-center justify-between rounded-card bg-ink px-4 py-3 font-bold text-cream"
                >
                  <span>
                    <span className="mr-3 tnum text-amber">{i + 1}</span>
                    {s}
                  </span>
                  {i < STEPS_PREVIEW.length - 1 ? (
                    <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
                      <path d="M12 4v16M6 14l6 6 6-6" />
                    </svg>
                  ) : (
                    <span className="text-small text-muted">→ PDF</span>
                  )}
                </motion.div>
              ))}
            </div>
            <p className="mt-3 text-center text-small text-muted">The builder ships in the next update.</p>
          </div>
        </div>
      ) : (
        <div className="mt-8 flex flex-col gap-3">
          {flows.slice(0, isPro() ? 99 : FREE_FLOW_LIMIT).map((f) => (
            <div key={f.id} className="rounded-card-l bg-surface p-4">
              <div className="font-bold text-cream">{f.name}</div>
              <div className="mt-1 text-small text-muted">{f.steps.join(" → ")}</div>
            </div>
          ))}
        </div>
      )}

      <div className="mt-10 flex justify-center">
        <Link
          href="/app/tools"
          className="min-h-[52px] rounded-pill border-2 border-line bg-surface px-7 font-bold text-cream"
          onClick={() => {
            sound.play("pop");
            haptic("tap");
          }}
        >
          Pick a PDF for a flow
        </Link>
      </div>
    </AppPage>
  );
}
