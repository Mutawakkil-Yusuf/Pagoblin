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
import { isIos, promptInstall, usePwa } from "@/lib/pwa";

export function InstallCard() {
  const installCardShown = useSettings((s) => s.installCardShown);
  const markShown = useSettings((s) => s.markInstallCardShown);
  const { deferred, installed } = usePwa();
  const [visible, setVisible] = useState(false);
  const [ios, setIos] = useState(false);

  useEffect(() => {
    setIos(isIos());
  }, []);

  // Show once, only when installing is actually possible (a real prompt, or iOS steps).
  useEffect(() => {
    if (visible || installCardShown || installed) return;
    if (deferred || ios) {
      setVisible(true);
      markShown();
    }
  }, [visible, installCardShown, installed, deferred, ios, markShown]);

  const install = async () => {
    sound.play("pop");
    await promptInstall();
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
            {deferred ? (
              <button
                type="button"
                className="h-[44px] flex-1 rounded-pill bg-orange font-bold text-ink"
                onClick={() => void install()}
              >
                Install app
              </button>
            ) : null}
            <button
              type="button"
              aria-label="Dismiss install card"
              className="h-[44px] rounded-pill border-2 border-line px-4 font-bold text-cream"
              onClick={() => {
                sound.play("toggle-off");
                setVisible(false);
              }}
            >
              {deferred ? "Not now" : "Got it"}
            </button>
          </div>
          {!deferred && (
            <p className="mt-3 text-small text-muted">In Safari, tap Share, then Add to Home Screen.</p>
          )}
        </motion.div>
      )}
    </AnimatePresence>
  );
}
