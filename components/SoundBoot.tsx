"use client";

import { useEffect } from "react";
import { useSettings } from "@/lib/store/settings";
import { setSoundMuted } from "@/lib/sound";

/** Syncs the persisted mute state into the sound engine at boot. */
export function SoundBoot() {
  const soundOn = useSettings((s) => s.soundOn);
  useEffect(() => {
    setSoundMuted(!soundOn);
    return () => setSoundMuted(true);
  }, [soundOn]);
  return null;
}
