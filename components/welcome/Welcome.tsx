"use client";

/**
 * Welcome overlay (screen 01): two scroll-snap slides over the home screen.
 * Shows once; the settings chip "Skip" or Let's go marks welcomeSeen.
 * Reduced motion: no bounce, plain fades.
 */
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion, useReducedMotion } from "motion/react";
import { Pip } from "@/components/pip/Pip";
import { useSettings } from "@/lib/store/settings";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { springs } from "@/lib/motion";

const SLIDES = [
  {
    file: "Invoice march.pdf",
    size: "2.1 MB",
    headline: "Hi! I'm Pip.",
    sub: "I chew PDFs. Stay a while.",
  },
] as const;

export function Welcome() {
  const seen = useSettings((s) => s.welcomeSeen);
  const markSeen = useSettings((s) => s.markWelcomeSeen);
  const reduce = !!useReducedMotion();
  const router = useRouter();
  const pagerRef = useRef<HTMLDivElement>(null);
  const [page, setPage] = useState(0);

  if (seen) return null;

  const finish = (href?: string) => {
    markSeen();
    if (href) {
      sound.play("pop");
      router.push(href);
    }
  };

  return (
    <div className="fixed inset-0 z-101 bg-ink">
      <div
        ref={pagerRef}
        className="pager no-scrollbar flex h-full snap-x snap-mandatory overflow-x-auto"
        onScroll={(e) => {
          const el = e.currentTarget;
          setPage(Math.round(el.scrollLeft / el.clientWidth));
        }}
      >
        {/* Slide 1: greeting with the marching-invoice file chip */}
        <div className="flex h-full w-full flex-none snap-center flex-col items-center justify-center px-page-x text-center">
          <Pip mood="happy" size={200} />
          <motion.div
            className="mt-8 flex items-center gap-2 rounded-pill border border-line bg-surface px-4 py-2"
            animate={reduce ? undefined : { y: [0, -3, 0], x: [0, 4, 0] }}
            transition={{ duration: 2.2, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2.2" strokeLinecap="round" aria-hidden="true">
              <path d="M7 3h7l4 4v13a1 1 0 01-1 1H7a1 1 0 01-1-1V4a1 1 0 011-1z" />
              <path d="M14 3v4h4" />
            </svg>
            <span className="text-small font-bold text-cream">{SLIDES[0].file}</span>
            <span className="text-small text-muted">{SLIDES[0].size}</span>
          </motion.div>
          <h1 className="mt-8 font-display text-h1 text-cream">{SLIDES[0].headline}</h1>
          <p className="mt-2 text-body-l text-muted">{SLIDES[0].sub}</p>
          <div className="mt-10 flex items-center gap-3">
            <button
              type="button"
              className="min-h-[52px] rounded-pill bg-orange px-8 font-display text-[17px] font-extrabold text-ink"
              onClick={() => {
                sound.play("gulp");
                haptic("tap");
                pagerRef.current?.scrollTo({ left: pagerRef.current.clientWidth, behavior: reduce ? "auto" : "smooth" });
              }}
            >
              Show me around
            </button>
          </div>
          <div className="mt-6 flex gap-1.5" aria-hidden="true">
            {[0, 1].map((i) => (
              <span key={i} className={`h-[7px] w-[7px] rounded-full ${page === i ? "bg-amber" : "bg-line"}`} />
            ))}
          </div>
        </div>

        {/* Slide 2: the promise */}
        <div className="flex h-full w-full flex-none snap-center flex-col items-center justify-center px-page-x text-center">
          <motion.div
            className="relative flex h-[64px] w-[64px] items-center justify-center rounded-pill border-[3px] border-dashed border-amber"
            animate={reduce ? undefined : { rotate: [0, 10, -10, 0] }}
            transition={{ duration: 2.4, repeat: Infinity, ease: "easeInOut" }}
          >
            <svg width="26" height="26" viewBox="0 0 24 24" fill="none" stroke="var(--amber)" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M12 5l1.6 4.9L19 11l-5.4 1.1L12 17l-1.6-4.9L5 11l5.4-1.1z" />
            </svg>
          </motion.div>
          <h1 className="mt-8 max-w-[320px] font-display text-h1 text-cream">Stay for PDFs. Not for signups.</h1>
          <ul className="mt-6 space-y-3 text-left">
            <li className="flex items-start gap-3 text-body text-cream">
              <Dot /> Free tools, no watermark, no daily limits.
            </li>
            <li className="flex items-start gap-3 text-body text-cream">
              <Dot /> Nothing uploaded. Your files never leave this device.
            </li>
            <li className="flex items-start gap-3 text-body text-cream">
              <Dot /> Works offline once Pip has moved in.
            </li>
          </ul>
          <motion.button
            type="button"
            className="mt-10 min-h-[58px] rounded-pill bg-orange px-10 font-display text-[18px] font-extrabold text-ink"
            whileTap={reduce ? undefined : { scale: 0.96 }}
            transition={{ type: "spring", ...springs.snappy }}
            onClick={() => finish("/app")}
          >
            Let&apos;s go
          </motion.button>
        </div>
      </div>
    </div>
  );
}

function Dot() {
  return (
    <span aria-hidden="true" className="mt-[7px] h-[8px] w-[8px] flex-none rounded-full bg-amber" />
  );
}
