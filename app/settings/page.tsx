"use client";

import Link from "next/link";
import { AppPage } from "@/components/nav/AppPage";
import { Pip } from "@/components/pip/Pip";
import { Toggle } from "@/components/ui/core";
import { useSettings } from "@/lib/store/settings";
import { useToolFiles } from "@/lib/store/docs";
import { useDoneStore } from "@/lib/store/done";
import { haptic } from "@/lib/haptics";
import { VERSION } from "@/lib/version";
import { Credit, SourceLink, IconGitHub } from "@/components/ui/Social";
import { InstallButton } from "@/components/pwa/InstallButton";
import { OfflineRow } from "@/components/pwa/OfflineRow";
import { usePwa } from "@/lib/pwa";

export default function SettingsPage() {
  const s = useSettings();
  const { installed, deferred } = usePwa();
  const clearToolFiles = useToolFiles((st) => st.clear);
  const clearDone = useDoneStore((st) => st.clear);

  const clearAllData = () => {
    clearToolFiles("home");
    clearToolFiles("merge");
    clearToolFiles("split");
    clearToolFiles("compress");
    clearToolFiles("convert");
    clearToolFiles("sign");
    clearDone();
    s.clearAll();
    try {
      localStorage.clear();
    } catch {
      /* ignore */
    }
    haptic("success");
    // flows are in IndexedDB and cleared on their screen to keep writes local
  };

  return (
    <AppPage title="Settings" back="/app" chrome width={720}>
      <div className="mt-6 flex flex-col items-center gap-2 text-center">
        <Pip mood="happy" size={96} />
        <h2 className="sr-only">Settings</h2>
        <p className="text-small text-muted">Your choices live on this device only.</p>
      </div>

      <div className="mt-8 rounded-card-l border border-line bg-surface p-5">
        <Row label="Sound" hint="Tiny pops while Pip works. Off is always fine.">
          <Toggle on={s.soundOn} onToggle={s.setSoundOn} label="Sound" />
        </Row>
        <div className="my-3 h-px bg-line" />
        <Row label="Vibrate" hint="Short buzzes on phones that support them.">
          <Toggle on={s.haptics} onToggle={s.setHaptics} label="Vibrate" />
        </Row>
        <div className="my-3 h-px bg-line" />
        <Row label="Reduce motion" hint="Drops the idle wiggles and confetti.">
          <Segmented
            value={s.motion}
            onChange={s.setMotion}
            options={[
              { key: "system", label: "Auto" },
              { key: "on", label: "On" },
              { key: "off", label: "Off" },
            ]}
          />
        </Row>
      </div>

      <div className="mt-4 rounded-card-l border border-line bg-surface p-5">
        <Row
          label="Install Pagoblin"
          hint={
            installed
              ? "Installed. Open it from your home screen or apps."
              : deferred
                ? "Add it to your device. It opens like an app."
                : "Use your browser menu and choose Install app or Add to Home Screen."
          }
        >
          {installed ? (
            <span className="rounded-pill bg-ink px-3 py-1.5 text-small font-bold text-amber">Installed</span>
          ) : (
            <InstallButton className="min-h-[44px] rounded-pill bg-orange px-5 font-bold text-ink" label="Install" />
          )}
        </Row>
        <div className="my-3 h-px bg-line" />
        <OfflineRow />
      </div>

      <button
        type="button"
        className="mt-4 min-h-[52px] w-full rounded-card-l border-2 border-line bg-surface px-5 text-left font-bold text-cream"
        onClick={clearAllData}
      >
        Clear saved preferences and files
      </button>

      <div className="mt-6 grid grid-cols-2 gap-3 md:grid-cols-4">
        <Link href="/privacy" className="rounded-card-l border border-line bg-surface px-4 py-3 font-bold text-cream">
          Privacy
        </Link>
        <Link href="/terms" className="rounded-card-l border border-line bg-surface px-4 py-3 font-bold text-cream">
          Terms
        </Link>
        <Link href="/about" className="rounded-card-l border border-line bg-surface px-4 py-3 font-bold text-cream">
          About
        </Link>
        <SourceLink className="inline-flex items-center gap-2 rounded-card-l border border-line bg-surface px-4 py-3 font-bold text-cream">
          <IconGitHub size={18} /> Source
        </SourceLink>
      </div>
      <Credit className="mt-8 rounded-card-l border border-line bg-surface p-5" />
      <p className="mt-6 text-center text-small text-muted">Version {VERSION}</p>
    </AppPage>
  );
}

function Row(props: { label: string; hint?: string; children: React.ReactNode }) {
  return (
    <div className="flex items-center justify-between gap-4">
      <div className="min-w-0">
        <div className="font-bold text-cream">{props.label}</div>
        {props.hint ? <div className="text-small text-muted">{props.hint}</div> : null}
      </div>
      {props.children}
    </div>
  );
}

function Segmented(props: {
  value: string;
  onChange: (v: "system" | "on" | "off") => void;
  options: { key: "system" | "on" | "off"; label: string }[];
}) {
  return (
    <div className="flex rounded-pill border border-line bg-ink p-1" role="radiogroup" aria-label="Reduce motion">
      {props.options.map((o) => (
        <button
          key={o.key}
          role="radio"
          aria-checked={props.value === o.key}
          onClick={() => props.onChange(o.key)}
          className={`min-h-[36px] rounded-pill px-3 text-small font-bold ${
            props.value === o.key ? "bg-amber text-ink" : "text-muted"
          }`}
        >
          {o.label}
        </button>
      ))}
    </div>
  );
}
