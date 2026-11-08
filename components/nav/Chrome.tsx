"use client";

/** Floating pill nav (phone) + round add button, action sheet, desktop top nav.
 * The active pill slides between items with a shared layoutId. */
import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { AnimatePresence, LayoutGroup, motion } from "motion/react";
import { useState } from "react";
import { IconFlows, IconHome, IconPlus, IconTools, IconGear, IconSoundOff, IconSoundOn } from "@/components/ui/Icons";
import { useSettings } from "@/lib/store/settings";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { springs } from "@/lib/motion";
import { pickFiles, makeFileItems, type FileKind } from "@/lib/files";
import { addFilesToTool, ACTIVE_TOOL_KINDS, activeToolForPath } from "@/lib/toolRouting";

const NAV_ITEMS = [
  { href: "/app", label: "Home", icon: IconHome },
  { href: "/app/tools", label: "Tools", icon: IconTools },
  { href: "/flows", label: "Flows", icon: IconFlows },
] as const;

export function AppChrome() {
  const pathname = usePathname();
  const isDesktopLayout = false; // replaced by CSS-driven rendering in both navs
  void isDesktopLayout;
  return (
    <>
      <PhoneNav pathname={pathname} />
      <AddButton />
    </>
  );
}

function activeFor(pathname: string): string {
  if (pathname.startsWith("/app/tools")) return "/app/tools";
  if (pathname.startsWith("/flows")) return "/flows";
  return "/app";
}

function PhoneNav({ pathname }: { pathname: string }) {
  const active = activeFor(pathname);
  const soundOn = useSettings((s) => s.soundOn);
  const setSoundOn = useSettings((s) => s.setSoundOn);
  return (
    <nav
      aria-label="App sections"
      className="md:hidden fixed bottom-[10px] left-[10px] z-40 flex items-center gap-0.5 rounded-[36px] border border-line bg-surface px-1.5 py-1.5 shadow-pop"
    >
      <LayoutGroup id="phone-nav">
        {NAV_ITEMS.map(({ href, label, icon: Icon }) => {
          const isActive = active === href;
          return (
            <Link
              key={href}
              href={href}
              aria-label={label}
              aria-current={isActive ? "page" : undefined}
              onClick={() => {
                sound.play("pop");
                haptic("tap");
              }}
              className="relative flex h-[50px] w-[50px] items-center justify-center rounded-[25px]"
            >
              {isActive && (
                <motion.span
                  layoutId="phone-nav-pill"
                  className="absolute inset-0 rounded-[25px] bg-amber"
                  transition={{ type: "spring", stiffness: 420, damping: 32 }}
                />
              )}
              <span className={`relative z-10 ${isActive ? "text-ink" : "text-muted"}`}>
                <Icon />
              </span>
            </Link>
          );
        })}
      </LayoutGroup>
      {/* divider + sound + settings, always reachable on phone */}
      <span aria-hidden="true" className="mx-1 h-[26px] w-px bg-line" />
      <button
        type="button"
        aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
        aria-pressed={soundOn}
        className="flex h-[50px] w-[44px] items-center justify-center rounded-[25px] text-muted"
        onClick={() => {
          setSoundOn(!soundOn);
          sound.play(soundOn ? "toggle-off" : "toggle-on");
          haptic("tap");
        }}
      >
        {soundOn ? <IconSoundOn /> : <IconSoundOff />}
      </button>
      <Link
        href="/settings"
        aria-label="Settings"
        aria-current={pathname.startsWith("/settings") ? "page" : undefined}
        className={`flex h-[50px] w-[44px] items-center justify-center rounded-[25px] ${
          pathname.startsWith("/settings") ? "bg-amber text-ink" : "text-muted"
        }`}
        onClick={() => {
          sound.play("pop");
          haptic("tap");
        }}
      >
        <IconGear />
      </Link>
    </nav>
  );
}

/** Round orange add button; rotates 90° when the action sheet opens. */
function AddButton() {
  const [open, setOpen] = useState(false);
  return (
    <>
      <motion.button
        type="button"
        aria-label={open ? "Close add options" : "Add file"}
        aria-expanded={open}
        onClick={() => {
          sound.play(open ? "pop" : "gulp");
          haptic("tap");
          setOpen((v) => !v);
        }}
        className="fixed bottom-[10px] right-[10px] z-50 flex h-[68px] w-[68px] items-center justify-center rounded-[34px] bg-orange text-ink shadow-pop md:hidden"
        animate={{ rotate: open ? 90 : 0 }}
        transition={{ type: "spring", ...springs.snappy }}
        whileTap={{ scale: 0.96 }}
      >
        <IconPlus width={30} height={30} />
      </motion.button>
      <AddSheet open={open} onClose={() => setOpen(false)} />
    </>
  );
}

export function AddSheet({ open, onClose }: { open: boolean; onClose: () => void }) {
  const router = useRouter();
  const pathname = usePathname();
  const kinds: FileKind[] = ACTIVE_TOOL_KINDS(activeToolForPath(pathname));
  const go = (href: string) => {
    onClose();
    router.push(href);
  };
  return (
    <>
      {/* scrim */}
      <AnimatePresence>
        {open && (
          <motion.button
            type="button"
            aria-label="Close"
            className="fixed inset-0 z-40 bg-ink/60 md:hidden"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.18 }}
            onClick={onClose}
          />
        )}
      </AnimatePresence>

      {/* action sheet */}
      <AnimatePresence>
        {open && (
          <motion.div
            role="dialog"
            aria-label="Add files"
            className="fixed bottom-[86px] right-[10px] left-[10px] z-50 md:hidden"
            initial={{ y: 24, opacity: 0, scale: 0.98 }}
            animate={{ y: 0, opacity: 1, scale: 1 }}
            exit={{ y: 18, opacity: 0, scale: 0.98 }}
            transition={{ type: "spring", ...springs.soft }}
          >
            <div className="rounded-card-l border border-line bg-surface p-2">
              <button
                className="flex min-h-[56px] w-full items-center gap-3 rounded-card px-4 text-left text-body font-bold text-cream"
                onClick={async () => {
                  onClose();
                  const files = await pickFiles({ accept: ".pdf,application/pdf,image/*", multiple: true });
                  if (!files.length) return;
                  const given = await makeFileItems(files, { accept: kinds, toolLabel: "this tool" });
                  if (given.items.length) {
                    sound.play("gulp");
                    haptic("success");
                    addFilesToTool(activeToolForPath(pathname), given.items);
                  }
                  given.rejects.forEach((r) =>
                    // careful error copy, no jokes
                    import("@/lib/store/toasts").then(({ toast }) => toast.error(r.reason)),
                  );
                }}
              >
                <IconPlus /> Add files here
              </button>
              <button
                className="flex min-h-[56px] w-full items-center gap-3 rounded-card px-4 text-left text-body font-bold text-cream"
                onClick={() => go("/app/tools")}
              >
                <IconTools /> Open tools
              </button>
              <button
                className="flex min-h-[56px] w-full items-center gap-3 rounded-card px-4 text-left text-body font-bold text-cream"
                onClick={() => go("/flows")}
              >
                <IconFlows /> New flow
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

/** Desktop top nav (768px up): brand, sections, sound toggle, settings. */
export function DesktopNav({ simple }: { simple?: boolean }) {
  const pathname = usePathname();
  const soundOn = useSettings((s) => s.soundOn);
  const setSoundOn = useSettings((s) => s.setSoundOn);
  const linkCls = "rounded-pill px-3 py-2 text-body font-medium text-cream hover:bg-surface";
  return (
    <header className="sticky top-0 z-40 hidden border-b border-line bg-ink/92 backdrop-blur md:block">
      <div className="mx-auto flex max-w-[1200px] items-center justify-between px-6 py-3">
        <Link href="/" className="flex items-center gap-2.5" aria-label="Pagoblin home">
          <MiniMark />
          <span className="font-display text-[26px] font-extrabold tracking-[-0.5px] text-cream">Pagoblin</span>
        </Link>
        <nav aria-label="Primary" className="flex items-center gap-1">
          {simple ? (
            <>
              <Link href="/#tools" className={linkCls}>
                Tools
              </Link>
              <Link href="/about" className={linkCls}>
                About
              </Link>
            </>
          ) : (
            <>
              <Link href="/app" className={`${linkCls} ${pathname === "/app" ? "font-bold" : ""}`}>
                Home
              </Link>
              <Link href="/app/tools" className={`${linkCls} ${pathname === "/app/tools" ? "font-bold" : ""}`}>
                Tools
              </Link>
              <Link href="/flows" className={`${linkCls} ${pathname.startsWith("/flows") ? "font-bold" : ""}`}>
                Flows
              </Link>
            </>
          )}
          <button
            type="button"
            aria-label={soundOn ? "Turn sound off" : "Turn sound on"}
            aria-pressed={soundOn}
            className="ml-1 flex h-[44px] w-[44px] items-center justify-center rounded-pill text-cream hover:bg-surface"
            onClick={() => {
              setSoundOn(!soundOn);
              sound.play(soundOn ? "toggle-off" : "toggle-on");
              haptic("tap");
            }}
          >
            {soundOn ? <IconSoundOn /> : <IconSoundOff />}
          </button>
          <Link
            href="/settings"
            aria-label="Settings"
            className={`flex h-[44px] w-[44px] items-center justify-center rounded-pill text-cream hover:bg-surface ${pathname === "/settings" ? "text-amber" : ""}`}
          >
            <IconGear />
          </Link>
          <Link
            href="/app"
            className="ml-2 inline-flex h-[52px] items-center rounded-pill bg-amber px-7 font-bold text-[16px] text-ink"
            onClick={() => {
              sound.play("pop");
            }}
          >
            Open Pagoblin
          </Link>
        </nav>
      </div>
    </header>
  );
}

/** Tiny logo mark: Pip's foot? No — the app icon simplified (Pip head). */
export function MiniMark() {
  return (
    <svg width="40" height="39" viewBox="-10 -6 120 118" role="img" aria-label="Pip, the Pagoblin mascot">
      <ellipse cx="6" cy="46" rx="14" ry="8" transform="rotate(-28 6 46)" fill="#FF9F1C" />
      <ellipse cx="94" cy="46" rx="14" ry="8" transform="rotate(28 94 46)" fill="#FF9F1C" />
      <path d="M38 14H62L88 40V74a24 24 0 01-24 24H36a24 24 0 01-24-24V40a26 26 0 0126-26z" fill="#FF9F1C" />
      <path d="M62 14V34a6 6 0 006 6H88z" fill="#D96A00" />
      <ellipse cx="11" cy="82" rx="6.5" ry="9" transform="rotate(20 11 82)" fill="#FF9F1C" />
      <ellipse cx="89" cy="80" rx="6.5" ry="9" transform="rotate(-35 89 80)" fill="#FF9F1C" />
      <ellipse cx="36" cy="62" rx="7" ry="8.5" fill="#17130F" />
      <ellipse cx="64" cy="62" rx="7" ry="8.5" fill="#17130F" />
      <circle cx="38.5" cy="58.5" r="2.8" fill="#fff" />
      <circle cx="66.5" cy="58.5" r="2.8" fill="#fff" />
      <path d="M43 76q7 7 14 0" stroke="#17130F" strokeWidth="3" fill="none" strokeLinecap="round" />
    </svg>
  );
}
