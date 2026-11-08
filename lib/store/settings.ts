"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { setSoundMuted } from "@/lib/sound";

export type MotionSetting = "system" | "on" | "off";

type Settings = {
  soundOn: boolean;
  haptics: boolean;
  motion: MotionSetting;
  welcomeSeen: boolean;
  installCardShown: boolean;
  setSoundOn: (on: boolean) => void;
  setHaptics: (on: boolean) => void;
  setMotion: (m: MotionSetting) => void;
  markWelcomeSeen: () => void;
  markInstallCardShown: () => void;
  clearAll: () => void;
};

export const useSettings = create<Settings>()(
  persist(
    (set) => ({
      soundOn: true,
      haptics: true,
      motion: "system",
      welcomeSeen: false,
      installCardShown: false,
      setSoundOn: (on) => {
        set({ soundOn: on });
        setSoundMuted(!on);
      },
      setHaptics: (on) => set({ haptics: on }),
      setMotion: (m) => set({ motion: m }),
      markWelcomeSeen: () => set({ welcomeSeen: true }),
      markInstallCardShown: () => set({ installCardShown: true }),
      clearAll: () => {
        set({
          soundOn: true,
          haptics: true,
          motion: "system",
          welcomeSeen: true,
          installCardShown: true,
        });
      },
    }),
    {
      name: "pagoblin.settings",
      version: 1,
      onRehydrateStorage: () => (state) => {
        if (state) setSoundMuted(!state.soundOn);
      },
    },
  ),
);
