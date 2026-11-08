"use client";

/**
 * Custom install card, shown once after the first success on the Done screen.
 * Uses beforeinstallprompt when the browser offers it; otherwise shows manual
 * install hints per platform. Shown once, remembered in localStorage.
 */
import { useEffect, useState } from "react";
import { AnimatePresence, motion } from "motion/react";
import { useSettings } from "@/lib/store/settings";
import { sound } from "@/lib/sound";
import { Pip } from "@/components/pip/Pip";

type BIPEvent = Event & { prompt: () => Promise<void>; userChoice?: Promise<{ outcome: string }> };

export function InstallCard() {
  const installCardShown = useSettings((s) => s.installCardShown);
  const markShown = useSettings((s) => s.markInstallCardShown);
  const [deferred, setDeferred] = useState<BIPEvent | null>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    if (installCardShown) return;
    const onBIP = (e: Event) => {
      e.preventDefault();
      setDeferred(e as BIPEvent);
      setVisible(true);
      markShown();
    };
    window.addEventListener("beforeinstallprompt", onBIP, { once: true });
    // Standalone hint fallback: if installable APIs are absent, still show once on phones.
    const standalone = window.matchMedia("(display-mode: standalone)").matches;
    const ios = /iphone|ipad/i.test(navigator.userAgent) && !standalone;
    const timer = setTimeout(() => {
      if (ios) {
        setVisible(true);
        markShown();
      } else if (!("onbeforeinstallprompt" in window) && !standalone) {
        setVisible(true);
        markShown();
      }
    }, 1200);
    return () => {
      window.removeEventListener("beforeinstallprompt", onBIP);
      clearTimeout(timer);
    };
  }, [installCardShown, markShown]);

  const install = async () => {
    sound.play("pop");
    if (deferred) {
      try {
        await deferred.prompt();
      } catch {
        /* ignore */
      }
      setDeferred(null);
      setVisible(false);
      return;
    }
    setVisible(false);
  };

  return (
    <AnimatePresence>
      {visible && (
        <motion.div
          initial={{ opacity: 0, y: 24, scale: 0.98 }}
          animate={{ opacity: 1, y: 0, scale: 1 }}
          exit={{ opacity: 0, y: 16, scale: 0.98 }}
          transition={{ type: "spring", stiffness: 180, damping: 22 }}
          className="mt-8 rounded-card-l bg-surface p-5"
          role="dialog"
          aria-label="Install Pagoblin"
        >
          <div className="flex items-start gap-4">
            <div className="h-14 w-14 flex-none overflow-hidden rounded-phone-chip bg-ink">
              <Pip mood="happy" size={56} />
            </div>
            <div className="flex-1">
              <div className="font-display text-h4 text-cream">Keep Pip in your pocket</div>
              <p className="mt-1 text-small text-muted">
                Install Pagoblin as an app. Pip works offline, and PDFs open straight from your files.
              </p>
            </div>
          </div>
          <div className="mt-4 flex gap-3">
            <button
              type="button"
              className="h-[44px] flex-1 rounded-pill bg-orange font-bold text-ink"
              onClick={() => void install()}
            >
              Install app
            </button>
            <button
              type="button"
              aria-label="Dismiss install card"
              className="h-[44px] rounded-pill border-2 border-line px-4 font-bold text-cream"
              onClick={() => {
                sound.play("toggle-off");
                setVisible(false);
              }}
            >
              Not now
            </button>
          </div>
          {!deferred && (
            <p className="mt-3 text-micro text-muted">
              Tip: in Safari, tap Share then “Add to Home Screen”. In Chrome, look for Install in the menu.
            </p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
