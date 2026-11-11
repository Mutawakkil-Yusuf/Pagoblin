"use client";

/** Core interactive primitives: buttons, chips, toggles — 44px targets, press
 * springs, sound + haptics wired centrally. */
import { motion, type HTMLMotionProps } from "motion/react";
import { forwardRef, type ReactNode } from "react";
import { springs } from "@/lib/motion";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

const pressable = { whileTap: { scale: 0.96 }, transition: { type: "spring", ...springs.snappy } } as const;

export type BtnProps = HTMLMotionProps<"button"> & {
  variant?: "primary" | "surface" | "amber" | "cream" | "ghost";
  size?: "md" | "lg";
  children?: ReactNode;
};

const variants = {
  primary: "bg-orange text-ink",
  surface: "bg-surface text-cream border-2 border-line",
  amber: "bg-amber text-ink",
  cream: "bg-cream text-ink",
  ghost: "bg-transparent text-amber",
} as const;

export const Button = forwardRef<HTMLButtonElement, BtnProps>(function Button(
  { variant = "primary", size = "lg", className = "", children, onClick, disabled, ...rest },
  ref,
) {
  return (
    <motion.button
      ref={ref}
      type="button"
      disabled={disabled}
      onClick={(e) => {
        if (disabled) return;
        sound.play("pop");
        haptic("tap");
        onClick?.(e);
      }}
      whileTap={disabled ? undefined : pressable.whileTap}
      transition={pressable.transition}
      className={`inline-flex items-center justify-center gap-2 rounded-pill font-bold ${
        size === "lg" ? "h-[58px] px-6 text-[17px] font-extrabold" : "h-[44px] px-5 text-body"
      } ${variants[variant]} ${className}`}
      {...rest}
    >
      {children}
    </motion.button>
  );
});

export function Chip(props: {
  label: string;
  selected?: boolean;
  onClick?: () => void;
  className?: string;
  ariaLabel?: string;
}) {
  const { label, selected, onClick, className = "", ariaLabel } = props;
  return (
    <motion.button
      type="button"
      aria-pressed={selected}
      aria-label={ariaLabel ?? label}
      onClick={() => {
        sound.play("pop");
        haptic("tap");
        onClick?.();
      }}
      whileTap={{ scale: 0.96 }}
      className={`min-h-[50px] rounded-[25px] px-4 font-bold text-[14px] ${
        selected ? "bg-orange text-ink" : "border-2 border-line bg-surface text-cream"
      } ${className}`}
    >
      {label}
    </motion.button>
  );
}

export function Toggle({
  on,
  onToggle,
  label,
}: {
  on: boolean;
  onToggle: (next: boolean) => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      aria-label={label}
      onClick={() => {
        sound.play(on ? "toggle-off" : "toggle-on");
        haptic("tap");
        onToggle(!on);
      }}
      className={`relative h-[44px] w-[72px] shrink-0 rounded-pill border-2 border-line ${on ? "bg-orange" : "bg-surface"}`}
    >
      <motion.span
        className={`absolute left-[4px] top-[4px] h-[32px] w-[32px] rounded-full ${on ? "bg-ink" : "bg-dim"}`}
        animate={{ x: on ? 32 : 0 }}
        transition={{ type: "spring", ...springs.snappy }}
      />
    </button>
  );
}
