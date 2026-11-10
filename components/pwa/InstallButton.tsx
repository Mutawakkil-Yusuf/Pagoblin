"use client";

import { useState } from "react";
import { isIos, promptInstall, usePwa } from "@/lib/pwa";
import { sound } from "@/lib/sound";

/** Renders only when installing is possible: a real prompt (Chrome, Edge, Android) or iOS steps. */
export function InstallButton({ className = "", label = "Install app" }: { className?: string; label?: string }) {
  const { deferred, installed } = usePwa();
  const [help, setHelp] = useState(false);
  if (installed) return null;
  if (deferred) {
    return (
      <button
        type="button"
        className={className}
        onClick={() => {
          sound.play("pop");
          void promptInstall();
        }}
      >
        {label}
      </button>
    );
  }
  if (isIos()) {
    return (
      <span className="inline-flex flex-col items-start">
        <button type="button" className={className} onClick={() => setHelp((v) => !v)} aria-expanded={help}>
          {label}
        </button>
        {help ? (
          <span className="mt-2 max-w-[260px] text-small text-muted">In Safari, tap Share, then Add to Home Screen.</span>
        ) : null}
      </span>
    );
  }
  return null;
}
