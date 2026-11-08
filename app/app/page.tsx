"use client";

import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { AppPage } from "@/components/nav/AppPage";
import { Pip } from "@/components/pip/Pip";
import { DropZone } from "@/components/ui/DropZone";
import { makeFileItems, type FileItem } from "@/lib/files";
import { useToolFiles } from "@/lib/store/docs";
import { springs, riseIn } from "@/lib/motion";
import { Welcome } from "@/components/welcome/Welcome";

export default function AppHome() {
  const add = useToolFiles((s) => s.add);
  const router = useRouter();

  const onFiles = async (items: FileItem[]) => {
    add("home", items);
    // One file: straight to tools to pick a job. Many: merge is the obvious first move.
    router.push(items.length > 1 ? "/merge-pdf" : "/app/tools");
  };

  return (
    <AppPage width={720}>
      <div className="relative">
        <Pip mood="happy" size={64} className="absolute right-0 top-2 hidden rotate-8 md:block" />
        <div className="mt-14 max-w-[215px] md:mt-16 md:max-w-none">
          <h1 className="font-display text-h2 tracking-[-1px] text-cream">Hey, I&apos;m Pip!</h1>
          <p className="mt-2 text-[18px] font-bold leading-6 text-cream">What are we fixing today?</p>
        </div>
      </div>

      <div className="mx-auto mt-14 max-w-md md:mt-16">
        <DropZone accept={["pdf"]} onFiles={onFiles} variant="hero" />
      </div>

      {/* Tip card with the amber card fanned behind, one tilted moment per screen */}
      <motion.section
        className="relative mx-auto mt-16 h-[150px] max-w-md md:mx-0"
        {...riseIn(20)}
      >
        <div className="absolute inset-0 rounded-card bg-amber" style={{ transform: "rotate(-3deg)" }} aria-hidden="true" />
        <motion.div
          className="absolute inset-0 rounded-card bg-cream p-5 text-ink"
          animate={{ y: [0, -1.5, 0] }}
          transition={{ duration: 4.5, repeat: Infinity, ease: "easeInOut" }}
        >
          <h2 className="font-display text-[22px] font-extrabold leading-6 tracking-[-0.02em]">Portal says max 2 MB?</h2>
          <p className="mt-1.5 w-[230px] text-body leading-5 md:w-full">Squeeze any PDF to the size it asks for.</p>
          <button
            type="button"
            className="absolute bottom-4 right-4 flex h-[44px] items-center gap-2 rounded-pill bg-orange px-4.5 font-bold text-[15px] text-ink"
            onClick={() => router.push("/compress-pdf")}
          >
            Try it
            <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
              <path d="M5 12h14M13 6l6 6-6 6" />
            </svg>
          </button>
        </motion.div>
      </motion.section>

      {/* Quick fixes carousel */}
      <div className="mt-14">
        <h2 className="font-display text-h3 text-cream">Quick fixes</h2>
        <div className="mt-3 flex snap-x gap-3 overflow-x-auto pb-4 no-scrollbar">
          <QuickFix
            href="/merge-pdf"
            title="Merge files"
            tag="Drag to order"
            bg="bg-amber"
            tilt={-6}
          />
          <QuickFix href="/split-pdf" title="Split pages" tag="Pick ranges" bg="bg-peach" tilt={5} />
          <QuickFix href="/sign-pdf" title="Sign" tag="Draw or type" bg="bg-sky" tilt={-4} />
          <QuickFix href="/compress-pdf" title="Compress" tag="Hit a target" bg="bg-orange" tilt={4} />
          <QuickFix href="/convert-pdf" title="Convert" tag="PDF and images" bg="bg-peach" tilt={-5} />
          <QuickFix href="/flows" title="Flows" tag="Chain steps" bg="bg-sky" tilt={3} />
        </div>
      </div>
      <Welcome />
    </AppPage>
  );
}

function QuickFix(props: { href: string; title: string; tag: string; bg: string; tilt: number }) {
  return (
    <motion.a
      href={props.href}
      className="w-[150px] flex-none snap-start rounded-phone-chip bg-cream p-2 text-ink"
      whileHover={{ y: -3 }}
      whileTap={{ scale: 0.97 }}
      transition={{ type: "spring", ...springs.snappy }}
    >
      <div className={`relative h-[100px] overflow-hidden rounded-thumb ${props.bg}`}>
        <div
          className="absolute left-[44px] top-[18px] w-[62px] rotate-[-6deg] rounded-[10px] border border-cream-shade bg-white p-2.5"
          style={{ transform: `rotate(${props.tilt}deg)` }}
          aria-hidden="true"
        >
          <div className="h-[5px] w-[60%] rounded-[3px] bg-ink" />
          <div className="mt-[7px] h-1 rounded-[2px] bg-[#E6DCCB]" />
          <div className="mt-[5px] h-1 w-[70%] rounded-[2px] bg-[#E6DCCB]" />
        </div>
      </div>
      <div className="mx-1 mb-1 mt-2.5 font-bold text-[15px]">{props.title}</div>
      <div className="mx-1 mb-1">
        <span className="rounded-[10px] bg-peach px-2 py-[3px] text-[11px] font-bold">{props.tag}</span>
      </div>
    </motion.a>
  );
}
