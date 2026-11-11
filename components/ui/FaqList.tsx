"use client";

/** FAQ accordion used by tool landing pages; one item open at a time.
 * Every answer stays in the DOM (collapsed with height/opacity) so the page
 * content matches the FAQPage schema and works without JavaScript. */
import { useState } from "react";
import { motion } from "motion/react";
import type { FAQItem } from "@/components/tools/ToolLanding";
import { springs } from "@/lib/motion";

export function FaqList({ items }: { items: FAQItem[] }) {
  const [open, setOpen] = useState<number | null>(0);
  return (
    <div className="mt-6 rounded-card-l bg-surface p-1">
      <h3 className="sr-only">Common questions</h3>
      {items.map((item, i) => {
        const isOpen = open === i;
        const panelId = `faq-p-${i}`;
        const btnId = `faq-b-${i}`;
        return (
          <div key={item.q} className="border-b border-line last:border-b-0">
            <button
              type="button"
              id={btnId}
              aria-expanded={isOpen}
              aria-controls={panelId}
              className="flex min-h-[56px] w-full items-center justify-between gap-4 px-4 text-left font-bold text-cream"
              onClick={() => setOpen(isOpen ? null : i)}
            >
              <span>{item.q}</span>
              <motion.span aria-hidden="true" animate={{ rotate: isOpen ? 45 : 0 }} transition={{ type: "spring", ...springs.snappy }} className="text-amber">
                +
              </motion.span>
            </button>
            <motion.div
              id={panelId}
              role="region"
              aria-labelledby={btnId}
              aria-hidden={!isOpen}
              initial={false}
              animate={{ height: isOpen ? "auto" : 0, opacity: isOpen ? 1 : 0 }}
              transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
              className="overflow-hidden"
            >
              <p className="px-4 pb-4 text-body leading-6 text-muted">{item.a}</p>
            </motion.div>
          </div>
        );
      })}
    </div>
  );
}
