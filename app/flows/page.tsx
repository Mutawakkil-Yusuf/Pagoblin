"use client";

/**
 * Flows (screen 09): build a chain, name it, save it (IndexedDB, device only),
 * drop PDFs, run once. Free users keep 3 saved flows (FREE_FLOW_LIMIT).
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { AppPage } from "@/components/nav/AppPage";
import { Pip } from "@/components/pip/Pip";
import { DropZone } from "@/components/ui/DropZone";
import { Button, Chip } from "@/components/ui/core";
import { IconClose } from "@/components/ui/Icons";
import {
  listFlows,
  saveFlow,
  deleteFlow,
  stepLabel,
  type SavedFlow,
} from "@/lib/store/flows";
import { isPro, FREE_FLOW_LIMIT } from "@/lib/entitlements";
import { runFlowSteps } from "@/lib/engine/flowRunner";
import type { FlowStepConfig } from "@/lib/engine/types";
import { useDoneStore, defaultHeadline } from "@/lib/store/done";
import { useToolFiles } from "@/lib/store/docs";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { toast } from "@/lib/store/toasts";

const STEP_OPTIONS: FlowStepConfig[] = [
  { type: "merge" },
  { type: "compress", target: 2 * 1024 * 1024 },
  { type: "compress", target: null },
  { type: "rotate", steps: [{ rotateBy: 90, pages: "all" }] },
];

export default function FlowsPage() {
  const [flows, setFlows] = useState<SavedFlow[] | null>(null);
  const [steps, setSteps] = useState<FlowStepConfig[]>([]);
  const [name, setName] = useState("");
  const [choosing, setChoosing] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");
  const setResult = useDoneStore((s) => s.setResult);
  const router = useRouter();
  const files = useToolFiles((s) => s.files.flows);
  const add = useToolFiles((s) => s.add);
  const clear = useToolFiles((s) => s.clear);
  const nameRef = useRef<HTMLInputElement | null>(null);

  useEffect(() => {
    void listFlows().then(setFlows);
  }, []);

  const refresh = async () => {
    setFlows(await listFlows());
  };

  const addStep = (step: FlowStepConfig) => {
    setSteps((s) => [...s, step]);
    setChoosing(false);
    sound.play("toggle-on");
    haptic("tap");
  };

  const saved = flows ?? [];
  const canSaveMore = isPro() || saved.length < FREE_FLOW_LIMIT;

  const persist = async () => {
    if (steps.length === 0) return;
    const flowName = name.trim() || `Flow ${new Date().toLocaleDateString()}`;
    if (!canSaveMore) {
      toast.error(`Free keeps ${FREE_FLOW_LIMIT} flows. Pip is happy to run yours now anyway.`);
      return;
    }
    await saveFlow({ id: `flow-${Date.now()}`, name: flowName, steps, at: Date.now() });
    await refresh();
    setSteps([]);
    setName("");
    sound.play("success");
    toast.success("Flow saved on this device.");
  };

  const run = async () => {
    if (steps.length === 0 || files.length === 0) {
      if (steps.length > 0) toast.info("Drop a PDF below, then press Run flow.");
      return;
    }
    setBusy(true);
    sound.startLoop("chew");
    try {
      const buffers = [];
      for (const f of files) buffers.push({ name: f.name, buffer: await f.file.arrayBuffer() });
      const out = await runFlowSteps(buffers, steps, (frac, label) => {
        setProgress(frac);
        setProgressLabel(label);
      });
      sound.stopLoop("chew");
      sound.play("success");
      haptic("success");
      setResult({
        id: `flow-${Date.now()}`,
        tool: "flow",
        headline: defaultHeadline("flow"),
        sentence:
          files.length === 1
            ? `${files[0].name}: ${steps.length} ${steps.length === 1 ? "step" : "steps"}, ${out.count} file${out.count === 1 ? "" : "s"} out.`
            : `${files.length} files: ${steps.length} ${steps.length === 1 ? "step" : "steps"}, ${out.count} out.`,
        beforeAfter: { count: out.count, pages: out.pages ?? undefined },
        outputs: out.outputs,
        zipped: out.count > 1,
        at: Date.now(),
      });
      setSteps([]);
      setName("");
      clear("flows");
      router.push("/done");
    } catch (e) {
      sound.stopLoop("chew");
      sound.play("error");
      haptic("error");
      toast.error("Something went wrong while running the flow. Try again.");
      console.error(e);
    } finally {
      setBusy(false);
    }
  };

  return (
    <AppPage width={720}>
      <div className="mt-10 flex items-start justify-between md:mt-6">
        <div>
          <h1 className="font-display text-h2 text-cream">Flows</h1>
          <p className="mt-1 max-w-[300px] text-body text-muted">Chain a few steps, run once. Saved on this device only.</p>
        </div>
        <Pip mood={busy ? "chewing" : "idle"} size={72} className="-mt-2" />
      </div>

      {/* Builder */}
      <div className="mt-6 rounded-card-l bg-surface p-4">
        <div className="flex items-center justify-between">
          <h2 className="font-display text-h3 font-extrabold">New flow</h2>
          <input
            ref={nameRef}
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="Name it, like Visa pack"
            aria-label="Flow name"
            className="w-[46%] rounded-card border-2 border-line bg-ink px-3 py-2 font-bold text-[13px] text-cream outline-none focus:border-amber"
          />
        </div>

        {steps.length === 0 ? (
          <p className="mt-3 text-body text-muted">Add a first step below.</p>
        ) : (
          <div className="mt-3 flex flex-col gap-1">
            {steps.map((s, i) => (
              <motion.div
                key={`${i}-${s.type}`}
                initial={{ opacity: 0, x: -8 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: i * 0.05 }}
                className="flex items-center justify-between rounded-card bg-ink px-4 py-3 font-bold text-cream"
              >
                <span>
                  <span className="tnum mr-3 text-amber">{i + 1}</span>
                  {stepLabel(s)}
                </span>
                <button
                  type="button"
                  aria-label={`Remove step ${i + 1}`}
                  className="flex h-[30px] w-[30px] items-center justify-center rounded-full text-muted hover:text-cream"
                  onClick={() => {
                    setSteps((arr) => arr.filter((_, j) => j !== i));
                    sound.play("pop");
                  }}
                >
                  <IconClose width={14} height={14} />
                </button>
              </motion.div>
            ))}
          </div>
        )}

        {choosing ? (
          <div className="mt-3 flex flex-wrap gap-2">
            {STEP_OPTIONS.map((s, i) => (
              <Chip key={i} label={stepLabel(s)} onClick={() => addStep(s)} />
            ))}
          </div>
        ) : (
          <button
            type="button"
            className="mt-3 flex w-full items-center justify-center gap-2 rounded-card border-2 border-dashed border-line py-3 font-bold text-cream"
            onClick={() => {
              setChoosing(true);
              sound.play("pop");
            }}
          >
            Add a step
          </button>
        )}

        <div className="mt-3 flex gap-2">
          <Button variant="ghost" className="flex-1" disabled={steps.length === 0 || !canSaveMore} onClick={() => void persist()}>
            Save
          </Button>
          <Button className="flex-1" disabled={steps.length === 0} onClick={() => void run()}>
            Run flow
          </Button>
        </div>
      </div>

      {/* Files for the run */}
      {busy ? (
        <div className="mt-6 rounded-card-l bg-surface p-6 text-center" role="status" aria-live="polite">
          <Pip mood="chewing" size={120} className="mx-auto" />
          <p className="mt-3 text-body text-muted">
            {progressLabel || "Working…"} {Math.round(progress * 100)}%
          </p>
        </div>
      ) : steps.length > 0 ? (
        <div className="mt-4">
          {files.length === 0 ? (
            <DropZone accept={["pdf"]} label="Add file" hint="Drop one or more PDFs for the flow." onFiles={(i) => { clear("flows"); add("flows", i); }} />
          ) : (
            <div className="flex items-center justify-between rounded-phone-chip bg-amber px-3.5 py-3 text-ink">
              <span className="min-w-0 flex-1 truncate font-bold text-[15px]">
                {files.length === 1 ? files[0].name : `${files.length} PDFs`}
              </span>
              <Button className="h-[40px]" onClick={() => void run()}>
                Run flow
              </Button>
              <button
                type="button"
                aria-label="Remove files"
                className="ml-2 flex h-[36px] w-[36px] items-center justify-center rounded-[18px] bg-ink/10"
                onClick={() => clear("flows")}
              >
                <IconClose width={16} height={16} />
              </button>
            </div>
          )}
        </div>
      ) : null}

      {/* Saved flows */}
      <h2 className="mt-8 font-display text-h3 font-extrabold">Saved flows</h2>
      {flows === null ? (
        <div className="mt-3 space-y-3">
          <div className="skeleton h-[84px] w-full" />
          <div className="skeleton h-[84px] w-full" />
        </div>
      ) : saved.length === 0 ? (
        <p className="mt-3 text-body text-muted">Nothing saved yet. Build one above and press Save.</p>
      ) : (
        <div className="mt-3 flex flex-col gap-3">
          {saved.map((f) => (
            <div key={f.id} className="flex items-center justify-between gap-3 rounded-card-l bg-surface p-4">
              <div className="min-w-0 flex-1">
                <div className="truncate font-bold text-cream">{f.name}</div>
                <div className="mt-1 truncate text-small text-muted">{f.steps.map(stepLabel).join(" → ")}</div>
              </div>
              {files.length > 0 ? (
                <Button
                  variant="ghost"
                  onClick={async () => {
                    setBusy(true);
                    sound.startLoop("chew");
                    try {
                      const buffers = [];
                      for (const fl of files) buffers.push({ name: fl.name, buffer: await fl.file.arrayBuffer() });
                      const out = await runFlowSteps(buffers, f.steps, (frac, label) => {
                        setProgress(frac);
                        setProgressLabel(label);
                      });
                      sound.stopLoop("chew");
                      sound.play("success");
                      setResult({
                        id: `flow-${Date.now()}`,
                        tool: "flow",
                        headline: defaultHeadline("flow"),
                        sentence: `${f.name}: ${out.count} file${out.count === 1 ? "" : "s"} out.`,
                        beforeAfter: { count: out.count, pages: out.pages ?? undefined },
                        outputs: out.outputs,
                        zipped: out.count > 1,
                        at: Date.now(),
                      });
                      clear("flows");
                      router.push("/done");
                    } catch (e) {
                      sound.stopLoop("chew");
                      sound.play("error");
                      toast.error("Something went wrong while running the flow. Try again.");
                      console.error(e);
                    } finally {
                      setBusy(false);
                    }
                  }}
                >
                  Run
                </Button>
              ) : null}
              <button
                type="button"
                aria-label={`Delete flow ${f.name}`}
                className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[18px] bg-line/60 text-muted"
                onClick={async () => {
                  await deleteFlow(f.id);
                  await refresh();
                  sound.play("pop");
                }}
              >
                <IconClose width={14} height={14} />
              </button>
            </div>
          ))}
          {!isPro() ? (
            <p className="text-small text-muted">Free keeps {FREE_FLOW_LIMIT} flows on this device. Pro keeps more.</p>
          ) : null}
        </div>
      )}

      <div className="mt-10 pb-6 text-center text-small text-muted">
        Flows live in IndexedDB on this device. Nothing syncs, nothing uploads.
      </div>
    </AppPage>
  );
}
