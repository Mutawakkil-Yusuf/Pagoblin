"use client";

import { useEffect, type ReactNode } from "react";
import Link from "next/link";
import { motion } from "motion/react";
import { DesktopNav, AppChrome, HeaderActions, MiniMark } from "@/components/nav/Chrome";
import { IconBack } from "@/components/ui/Icons";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

const MAX_W = {
  480: "max-w-[480px]",
  720: "max-w-[720px]",
  wide: "max-w-[1120px]",
  tool: "max-w-[1120px]",
} as const;

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
  /** 480 and 720 are single columns; "wide" and "tool" give laptop layouts room (phone is unchanged). */
  width?: 480 | 720 | "wide" | "tool";
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
      {/* Phone top bar: back or brand on the left, sound and settings on the right */}
      <div className="sticky top-0 z-30 bg-ink/90 backdrop-blur md:hidden">
        <div className="mx-auto flex max-w-[720px] items-center px-page-x pb-2 pt-[max(16px,env(safe-area-inset-top))]">
          <div className="w-[100px]">
            {back ? (
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
            ) : (
              <Link href="/" aria-label="Pagoblin home" className="flex h-[46px] items-center">
                <MiniMark />
              </Link>
            )}
          </div>
          <div className="min-w-0 flex-1 text-center">
            {back && title ? <h1 className="truncate font-display text-h3 text-cream">{title}</h1> : null}
          </div>
          <div className="flex w-[100px] justify-end">
            <HeaderActions />
          </div>
        </div>
      </div>
      {back && title ? (
        <h1 className={`mx-auto mt-8 hidden w-full px-page-x font-display text-h2 text-cream md:block md:px-8 ${MAX_W[width]}`}>{title}</h1>
      ) : null}
      <motion.main
        initial={{ opacity: 0, y: 16 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.22, ease: [0.22, 1, 0.36, 1] }}
        className={`mx-auto w-full px-page-x pb-40 md:px-8 md:pb-20 ${MAX_W[width]} ${
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
