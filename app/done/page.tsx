"use client";

/**
 * Done screen (10): Pip celebrating, confetti in brand colours, real before and
 * after numbers, privacy line, Download, Share, Start another. Driven by state.
 */
import { useEffect, useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { AppPage } from "@/components/nav/AppPage";
import { Pip } from "@/components/pip/Pip";
import { useDoneStore, defaultHeadline } from "@/lib/store/done";
import { deliverResult, shareOrDownload, type OutputBlob } from "@/lib/deliver";
import { formatBytes } from "@/lib/format";
import { Button } from "@/components/ui/core";
import { IconDownload, IconShare } from "@/components/ui/Icons";
import { confettiColors } from "@/lib/motion";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { useSettings } from "@/lib/store/settings";
import { InstallCard } from "@/components/ui/InstallCard";

export default function DoneScreen() {
  const store = useDoneStore();
  const result = useDoneStore((s) => s.result);
  const router = useRouter();
  const reduce = !!useReducedMotion();
  const soundOn = useSettings((s) => s.soundOn);
  void soundOn;

  useEffect(() => {
    // /done is not a URL people share; no state means no done.
    if (!result) router.replace("/app");
  }, [result, router]);

  const [busyName, setBusyName] = useState<string | null>(null);

  const outputs: OutputBlob[] = useMemo(
    () => (result?.outputs ?? []).map((o) => ({ blob: o.blob, name: o.name })),
    [result],
  );

  useEffect(() => {
    if (result) {
      sound.play("success");
      haptic("success");
    }
  }, [result?.id]);

  if (!result) return <div className="min-h-dvh bg-ink" />;
  const ba = result.beforeAfter;
  const shrinking = ba.before != null && ba.after != null && ba.before !== ba.after;

  return (
    <AppPage chrome width={480} title="Done">
      <div className="relative mt-6 overflow-hidden">
        <Confetti reduce={reduce} />
        <div className="relative flex justify-center">
          <div className="-rotate-4">
            <Pip mood="celebrate" size={200} />
          </div>
        </div>
      </div>

      <h1 className="mt-2 text-center font-display text-[40px] font-extrabold tracking-[-1px] text-cream">
        {result.headline || defaultHeadline(result.tool)}
      </h1>
      <p className="mx-auto mt-3 max-w-[340px] text-center text-body-l leading-6 text-muted">{result.sentence}</p>

      <div className="mx-auto mt-5 flex justify-center">
        <div className="inline-flex items-center gap-2 rounded-[20px] bg-surface px-4 py-2.5 text-small text-cream">
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
            <rect x="5" y="4" width="14" height="17" rx="2" />
            <path d="M9 9h6M9 13h6" />
          </svg>
          Nothing was uploaded. Not one byte.
        </div>
      </div>

      {shrinking ? (
        <div className="mx-auto mt-6 max-w-[360px] rounded-card-l bg-cream p-5 text-ink">
          <div className="flex items-center justify-between text-small">
            <span>Size</span>
            <span className="font-bold">
              saved {Math.max(0, Math.round(((ba.before! - ba.after!) / ba.before!) * 100))}%
            </span>
          </div>
          <div className="tnum mt-1 font-display text-[28px] font-extrabold tracking-[-0.5px]">
            <CountUp to={ba.before!} /> → <CountUp to={ba.after!} />
          </div>
          <div className="mt-3 h-[10px] overflow-hidden rounded-pill bg-cream-shade">
            <motion.div
              className="h-full rounded-pill bg-orange"
              initial={{ width: "100%" }}
              animate={{ width: `${Math.max(6, (ba.after! / ba.before!) * 100)}%` }}
              transition={{ type: "spring", stiffness: 180, damping: 22, delay: 0.3 }}
            />
          </div>
        </div>
      ) : null}

      <div className="mt-8 flex flex-col gap-3">
        <Button
          variant="primary"
          className="w-full"
          onClick={async () => {
            setBusyName("down");
            try {
              const name = await deliverResult(outputs, result.tool, "pdf");
              setBusyName(null);
            } catch {
              setBusyName(null);
            }
          }}
        >
          {busyName === "down" ? "Packing…" : (
            <>
              <IconDownload /> Download
            </>
          )}
        </Button>
        <Button
          variant="surface"
          className="w-full"
          onClick={async () => {
            try {
              await shareOrDownload(outputs, "pagoblin-output.zip");
            } catch (e) {
              if ((e as Error)?.name === "AbortError") return;
              await deliverResult(outputs, result.tool, "pdf");
            }
          }}
        >
          <IconShare /> Share
        </Button>
        <Button
          variant="ghost"
          className="w-full underline underline-offset-4"
          onClick={() => {
            store.clear();
            router.push("/app/tools");
          }}
        >
          Start another
        </Button>
      </div>

      <InstallCard />
    </AppPage>
  );
}

/** Animated, tabular number counters: counts down from before-size feel. */
function CountUp({ to }: { to: number }) {
  const [v, setV] = useState(to);
  useEffect(() => {
    let raf = 0;
    const t0 = performance.now();
    const dur = 900;
    const from = to * 1.6;
    const tick = (t: number) => {
      const k = Math.min(1, (t - t0) / dur);
      const eased = 1 - Math.pow(1 - k, 3);
      setV(from + (to - from) * eased);
      if (k < 1) raf = requestAnimationFrame(tick);
      else setV(to);
    };
    const mq = window.matchMedia("(prefers-reduced-motion: reduce)");
    if (mq.matches) {
      setV(to);
      return;
    }
    raf = requestAnimationFrame(tick);
    return () => cancelAnimationFrame(raf);
  }, [to]);
  return <span>{formatBytes(v)}</span>;
}

/**
 * Confetti burst in brand colours from behind Pip: ~90 particles, 1.6 s,
 * gravity + slight spin. Off in reduced motion.
 */
function Confetti({ reduce }: { reduce: boolean }) {
  const bits = useMemo(() => {
    if (reduce) return [];
    return Array.from({ length: 84 }, (_, i) => ({
      id: i,
      x: Math.random() * 100,
      delay: Math.random() * 0.25,
      dur: 1.1 + Math.random() * 0.6,
      w: 6 + Math.random() * 8,
      h: 8 + Math.random() * 8,
      r: Math.random() * 220 - 110,
      color: confettiColors[i % confettiColors.length],
      round: Math.random() > 0.5,
    }));
  }, [reduce]);
  if (reduce) return null;

  return (
    <div aria-hidden="true" className="pointer-events-none absolute inset-x-0 top-6 z-0 h-[420px] overflow-hidden">
      {bits.map((b) => (
        <motion.span
          key={b.id}
          className="absolute top-2/5"
          style={{ left: `${b.x}%`, width: b.w, height: b.h, borderRadius: b.round ? 999 : 3, background: b.color }}
          initial={{ y: -30, opacity: 0, rotate: 0 }}
          animate={{ y: 420, opacity: [0, 1, 1, 0], rotate: b.r, x: (Math.random() - 0.5) * 60 }}
          transition={{ duration: b.dur + 0.4, delay: b.delay, ease: [0.2, 0.7, 0.4, 1], opacity: { times: [0, 0.08, 0.7, 1] } }}
        />
      ))}
    </div>
  );
}

void AnimatePresence;
