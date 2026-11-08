"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { DesktopNav, AppChrome } from "@/components/nav/Chrome";
import { IconBack } from "@/components/ui/Icons";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

/**
 * Shared app page scaffold. Same tokens for both layouts:
 * - phone: full-bleed single column, floating pill nav bottom left, round add
 *   button bottom right (bottom padding leaves room for them).
 * - desktop (768px+): DesktopNav on top, centred 480-720px column.
 */
export function AppPage(props: {
  title?: string;
  /** Route for the back chip; also turns the title into a centred header row. */
  back?: string;
  children: ReactNode;
  width?: 480 | 720;
  /** Renders the floating add button + pill nav. */
  chrome?: boolean;
}) {
  const { title, back, children, width = 480, chrome = true } = props;
  useEffect(() => {
    document.title = title ? `${title} · Pagoblin` : "Pagoblin";
  }, [title]);
  return (
    <div className="min-h-dvh">
      <DesktopNav />
      {back ? (
        <>
          <div className="mx-auto flex max-w-[720px] items-center px-page-x pt-5 md:hidden">
            <Link
              href={back}
              aria-label="Back"
              onClick={() => {
                sound.play("pop");
                haptic("tap");
              }}
              className="flex h-[46px] w-[46px] items-center justify-center rounded-[23px] border-2 border-line bg-surface text-cream"
            >
              <IconBack />
            </Link>
            {title ? (
              <h1 className="flex-1 text-center font-display text-h3 text-cream">{title}</h1>
            ) : null}
            <span aria-hidden="true" className="h-[46px] w-[46px]" />
          </div>
          {/* desktop keeps a simpler header */}
          {title ? (
            <h1 className="mx-auto mt-8 hidden max-w-[720px] px-page-x font-display text-h2 text-cream md:block">
              {title}
            </h1>
          ) : null}
        </>
      ) : null}
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className={`mx-auto w-full px-page-x pb-40 md:pb-20 ${width === 480 ? "max-w-[480px]" : "max-w-[720px]"} ${
          back ? "md:pt-6" : ""
        }`}
      >
        {children}
        {chrome ? <div className="h-16" /> : null}
      </motion.main>
      {chrome ? <AppChrome /> : null}
    </div>
  );
}
