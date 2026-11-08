"use client";

/**
 * <Pip mood size /> — the mascot, rebuilt part-by-part from
 * design-kit/assets/pip-happy.svg (and pip-wow.svg's face for "wow").
 * Parts are named groups so each can animate: ear-l, ear-r, body, fold,
 * sprout, eye-l, eye-r, mouth, cheek-l, cheek-r, arm-l, arm-r, foot-l, foot-r.
 * Shapes and colours stay identical to the kit. No outlines, no recolouring.
 * Static poses live in SVG transform attributes; framer animates inner wrappers
 * (transform-box: fill-box) so the two never fight.
 */
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { sound, setChewCrumbListener } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

export type PipMood = "idle" | "happy" | "wow" | "chewing" | "celebrate" | "sleepy" | "sad" | "wave";

const EAR_INNER = "#FFD9A8"; // inner-ear tone, from design-kit/assets/pip-happy.svg

type Crumb = { id: number; x: number; size: number };

const arIA: Record<PipMood, string> = {
  idle: "Pip, the Pagoblin goblin, waiting",
  happy: "Pip, the Pagoblin goblin, feeling happy",
  wow: "Pip amazed by this file",
  chewing: "Pip chewing through your file",
  celebrate: "Pip celebrating a finished file",
  sleepy: "Pip asleep, nothing to do yet",
  sad: "Pip noting that something went wrong",
  wave: "Pip waving hello",
};

export function Pip(props: {
  mood?: PipMood;
  size?: number;
  mouthOpen?: boolean;
  /** Bump this value to trigger the wow recoil (when a result lands). */
  excite?: unknown;
  className?: string;
  onGiggle?: () => void;
}) {
  const { mood = "idle", size = 120, mouthOpen = false, excite, className, onGiggle } = props;
  const reduce = useReducedMotion();
  const [blink, setBlink] = useState(false);
  const [wiggle, setWiggle] = useState(0);
  const [giggle, setGiggle] = useState(0);
  const [crumbs, setCrumbs] = useState<Crumb[]>([]);
  const [mouthTick, setMouthTick] = useState(false);

  const chewing = mood === "chewing";
  const face = faceFor(mood, chewing ? mouthTick : mouthOpen);

  /* Blink every 3 to 6 s, 120 ms. */
  useEffect(() => {
    if (reduce || mood === "sleepy" || chewing || mood === "wow") return;
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        if (!alive) return;
        setBlink(true);
        setTimeout(() => alive && setBlink(false), 120);
        schedule();
      }, 3000 + Math.random() * 3000);
    };
    schedule();
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [reduce, chewing, mood]);

  /* Ear wiggle every ~8 s. */
  useEffect(() => {
    if (reduce) return;
    let alive = true;
    let t: ReturnType<typeof setTimeout>;
    const schedule = () => {
      t = setTimeout(() => {
        if (!alive) return;
        setWiggle((w) => w + 1);
        schedule();
      }, 8000 + Math.random() * 2500);
    };
    schedule();
    return () => {
      alive = false;
      clearTimeout(t);
    };
  }, [reduce]);

  /* Chewing: mouth in sync with the chew sound loop; crumbs fall from the mouth. */
  useEffect(() => {
    if (!chewing) {
      setCrumbs([]);
      return;
    }
    const t = setInterval(() => setMouthTick((v) => !v), 220);
    sound.startLoop("chew");
    setChewCrumbListener(() => {
      setCrumbs((list) => {
        const id = Date.now() + Math.random();
        return [...list.slice(-4), { id, x: 50 + (Math.random() * 14 - 7), size: 1.6 + Math.random() * 1.6 }];
      });
    });
    return () => {
      clearInterval(t);
      sound.stopLoop("chew");
      setChewCrumbListener(null);
      setCrumbs([]);
    };
  }, [chewing]);

  const tap = () => {
    sound.play("giggle");
    haptic("tap");
    setGiggle((g) => g + 1);
    onGiggle?.();
  };

  const hop = mood === "happy" && !reduce;
  const wave = mood === "wave" && !reduce;
  const celebrate = mood === "celebrate" && !reduce;

  const eyeAnim = blink || mood === "sleepy" ? { scaleY: 0.1 } : { scaleY: 1 };

  return (
    <motion.button
      type="button"
      aria-label={arIA[mood]}
      onClick={tap}
      className={className}
      style={{
        width: size,
        height: size * 0.98,
        background: "transparent",
        border: 0,
        padding: 0,
        cursor: "pointer",
        lineHeight: 0,
        display: "inline-block",
        WebkitTapHighlightColor: "transparent",
      }}
      initial={false}
      animate={
        reduce
          ? { scale: 1, y: 0 }
          : {
              scale: mood === "wow" ? 1.02 : 1,
              y: hop ? [0, -7, 0] : celebrate ? [0, -10, 0] : 0,
            }
      }
      transition={
        hop
          ? { duration: 0.6, times: [0, 0.45, 1], ease: "easeOut", delay: 0.18 }
          : celebrate
            ? { duration: 0.85, times: [0, 0.4, 0.7, 0.92, 1], ease: "easeOut" }
            : undefined
      }
      whileTap={reduce ? undefined : { scale: 0.96 }}
      data-pip-mood={mood}
    >
      <motion.svg
        xmlns="http://www.w3.org/2000/svg"
        viewBox="-10 -6 120 118"
        width={size}
        height={size * 0.98}
        style={{ display: "block", transformOrigin: "50% 92%", transformBox: "fill-box" }}
        onClick={(e) => e.stopPropagation()}
        animate={
          reduce
            ? undefined
            : { scaleY: mood === "chewing" ? [1, 0.985, 1.012, 1] : 1, scaleX: mood === "chewing" ? [1, 1.01, 0.995, 1] : 1 }
        }
        transition={mood === "chewing" ? { duration: 0.88, repeat: Infinity, times: [0, 0.4, 0.75, 1] } : undefined}
        aria-hidden="true"
        focusable="false"
      >
        {/* recoil wrapper: keyed on excite so a result makes Pip wince then settle */}
        <motion.g
          key={`recoil-${String(excite ?? "still")}`}
          initial={excite !== undefined && !reduce ? { scale: 1, rotate: 0 } : false}
          animate={excite !== undefined && !reduce ? { scale: [1, 1.08, 0.94, 1.02, 1], rotate: [0, -2, 2, 0] } : undefined}
          transition={excite !== undefined ? { duration: 0.5, ease: "easeOut" } : undefined}
          style={{ transformOrigin: "50% 90%", transformBox: "fill-box" }}
        >
          {/* giggle wobble wrapper */}
          <motion.g
            key={`giggle-${giggle}`}
            initial={{ rotate: 0 }}
            animate={giggle > 0 && !reduce ? { rotate: [0, -5, 5, -3, 3, 0] } : undefined}
            transition={giggle > 0 ? { duration: 0.5, ease: "easeInOut" } : undefined}
            style={{ transformOrigin: "50% 85%", transformBox: "fill-box" }}
          >
            {/* feet */}
            <g data-part="foot-l">
              <ellipse cx="36" cy="102" rx="11" ry="6" fill="#D96A00" />
            </g>
            <g data-part="foot-r">
              <ellipse cx="64" cy="102" rx="11" ry="6" fill="#D96A00" />
            </g>

            {/* arms */}
            <motion.g
              data-part="arm-r"
              initial={false}
              animate={celebrate ? { rotate: -120 } : undefined}
              transition={celebrate ? { type: "spring", stiffness: 300, damping: 12, delay: 0.06 } : undefined}
              style={{ transformOrigin: "50% 50%", transformBox: "fill-box" }}
            >
              <ellipse cx="89" cy="80" rx="6.5" ry="9" transform="rotate(-35 89 80)" fill="#FF9F1C" />
            </motion.g>
            <motion.g
              data-part="arm-l"
              initial={false}
              animate={
                wave ? { rotate: [0, -26, 14, -26, 14, 0] } : celebrate ? { rotate: 120 } : undefined
              }
              transition={
                wave
                  ? { duration: 1.4, ease: "easeInOut" }
                  : celebrate
                    ? { type: "spring", stiffness: 300, damping: 12, delay: 0.06 }
                    : undefined
              }
              style={{ transformOrigin: "50% 50%", transformBox: "fill-box" }}
            >
              <ellipse cx="11" cy="82" rx="6.5" ry="9" transform="rotate(20 11 82)" fill="#FF9F1C" />
            </motion.g>

            {/* ears */}
            <motion.g
              data-part="ear-r"
              initial={false}
              animate={wiggle ? { rotate: [0, 4, -3, 2, 0] } : undefined}
              transition={wiggle ? { duration: 0.7, ease: "easeInOut" } : undefined}
              style={{ transformOrigin: "62% 62%", transformBox: "fill-box" }}
            >
              <ellipse cx="94" cy="46" rx="14" ry="8" transform="rotate(28 94 46)" fill="#FF9F1C" />
              <ellipse cx="93" cy="46" rx="8" ry="4.2" transform="rotate(28 93 46)" fill={EAR_INNER} />
            </motion.g>
            <motion.g
              data-part="ear-l"
              initial={false}
              animate={wiggle ? { rotate: [0, -4, 3, -2, 0] } : undefined}
              transition={wiggle ? { duration: 0.7, ease: "easeInOut" } : undefined}
              style={{ transformOrigin: "38% 62%", transformBox: "fill-box" }}
            >
              <ellipse cx="6" cy="46" rx="14" ry="8" transform="rotate(-28 6 46)" fill="#FF9F1C" />
              <ellipse cx="7" cy="46" rx="8" ry="4.2" transform="rotate(-28 7 46)" fill={EAR_INNER} />
            </motion.g>

            {/* body, dog-ear fold, sprout */}
            <g data-part="body">
              <path
                d="M38 14H62L88 40V74a24 24 0 01-24 24H36a24 24 0 01-24-24V40a26 26 0 0126-26z"
                fill="#FF9F1C"
              />
            </g>
            <g data-part="fold">
              <path d="M62 14V34a6 6 0 006 6H88z" fill="#D96A00" />
            </g>
            <g data-part="sprout">
              <path d="M32 15q-3-10 5-12" stroke="#D96A00" strokeWidth="3.5" fill="none" strokeLinecap="round" />
            </g>

            {/* cheeks */}
            <g data-part="cheek-l">
              <ellipse cx="23" cy="76" rx="6.5" ry="4" fill="#FF6B2C" opacity=".6" />
            </g>
            <g data-part="cheek-r">
              <ellipse cx="77" cy="76" rx="6.5" ry="4" fill="#FF6B2C" opacity=".6" />
            </g>

            {/* eyes */}
            {face.eyes === "closed-arc" ? (
              <g stroke="#17130F" strokeWidth="3" strokeLinecap="round" fill="none">
                <path d="M28 62q8 6 16 0" />
                <path d="M56 62q8 6 16 0" />
              </g>
            ) : (
              <>
                <motion.g
                  data-part="eye-l"
                  style={{ transformOrigin: "50% 50%", transformBox: "fill-box" }}
                  animate={eyeAnim}
                  transition={{ duration: 0.12 }}
                >
                  <ellipse cx="36" cy={face.eyeY ?? 62} rx={face.eyeRx ?? 7} ry={face.eyeRy ?? 8.5} fill="#17130F" />
                  <circle cx={(face.hl1x ?? 38.5)} cy={(face.hl1y ?? 58.5)} r={(face.hl1r ?? 2.8)} fill="#fff" />
                  <circle cx={(face.hl2x ?? 34)} cy={(face.hl2y ?? 65.5)} r={(face.hl2r ?? 1.4)} fill="#fff" />
                </motion.g>
                <motion.g
                  data-part="eye-r"
                  style={{ transformOrigin: "50% 50%", transformBox: "fill-box" }}
                  animate={eyeAnim}
                  transition={{ duration: 0.12 }}
                >
                  <ellipse cx="64" cy={face.eyeY ?? 62} rx={face.eyeRx ?? 7} ry={face.eyeRy ?? 8.5} fill="#17130F" />
                  <circle cx={(face.hl1x ?? 38.5) + 28} cy={face.hl1y ?? 58.5} r={face.hl1r ?? 2.8} fill="#fff" />
                  <circle cx={(face.hl2x ?? 34) + 28} cy={face.hl2y ?? 65.5} r={face.hl2r ?? 1.4} fill="#fff" />
                </motion.g>
              </>
            )}

            {/* mouth */}
            <g data-part="mouth">
              {face.mouth === "open" && (
                <>
                  <ellipse cx="50" cy={face.mouthWide ? 81 : 80} rx={face.mouthWide ? 7 : 5} ry={face.mouthWide ? 8 : 6} fill="#17130F" />
                  <ellipse cx="50" cy={face.mouthWide ? 84 : 82} rx={face.mouthWide ? 4.2 : 3} ry={face.mouthWide ? 3.4 : 3} fill="#FF6B2C" />
                </>
              )}
              {face.mouth === "smile" && (
                <>
                  <path d="M43 76q7 7 14 0" stroke="#17130F" strokeWidth="3" fill="none" strokeLinecap="round" />
                  <path d="M52.5 79l2 4.5 2-5z" fill="#fff" />
                </>
              )}
              {face.mouth === "frown" && (
                <path d="M44 81q6 -5 12 0" stroke="#17130F" strokeWidth="3" fill="none" strokeLinecap="round" />
              )}
              {face.mouth === "small" && (
                <path d="M44 78q6 3.5 12 0" stroke="#17130F" strokeWidth="2.6" fill="none" strokeLinecap="round" />
              )}
            </g>

            {/* chewing crumbs */}
            <AnimatePresence>
              {crumbs.map((c) => (
                <motion.rect
                  key={c.id}
                  x={c.x}
                  y={88}
                  width={c.size}
                  height={c.size}
                  rx={c.size / 2}
                  fill="#17130F"
                  initial={{ opacity: 0.9, y: 88 }}
                  animate={{ opacity: 0.15, y: 101 }}
                  exit={{ opacity: 0 }}
                  transition={{ duration: 0.7, ease: "easeIn" }}
                />
              ))}
            </AnimatePresence>

            {/* sleepy z's (position wrapper keeps the static transform) */}
            {mood === "sleepy" &&
              [
                { x: 96, y: 10, s: 10, d: 0 },
                { x: 108, y: 2, s: 13, d: 1.3 },
              ].map((z, i) => (
                <g key={i} transform={`translate(${z.x} ${z.y})`}>
                  <motion.text
                    x={0}
                    y={0}
                    fontSize={z.s}
                    fill="#C9BBA8"
                    fontFamily="Bricolage Grotesque, sans-serif"
                    fontWeight={800}
                    initial={false}
                    animate={reduce ? { opacity: 0.5 } : { opacity: [0.25, 0.7, 0.25], y: [0, -3.5, 0] }}
                    transition={{ duration: 3.6, repeat: Infinity, delay: z.d, ease: "easeInOut" }}
                  >
                    z
                  </motion.text>
                </g>
              ))}
          </motion.g>
        </motion.g>
      </motion.svg>
    </motion.button>
  );
}

type FaceMouth = "open" | "smile" | "frown" | "small";

type Face = {
  eyes: "closed-arc" | "round";
  eyeY?: number;
  eyeRx?: number;
  eyeRy?: number;
  hl1x?: number;
  hl1y?: number;
  hl1r?: number;
  hl2x?: number;
  hl2y?: number;
  hl2r?: number;
  mouth: FaceMouth;
  mouthWide?: boolean;
};

/** Face geometry per mood, straight from pip-happy.svg / pip-wow.svg, drawn to style. */
function faceFor(mood: PipMood, open: boolean): Face {
  const happy: Face = {
    eyes: "round",
    eyeY: 62,
    eyeRx: 7,
    eyeRy: 8.5,
    hl1x: 38.5,
    hl1y: 58.5,
    hl1r: 2.8,
    hl2x: 34,
    hl2y: 65.5,
    hl2r: 1.4,
    mouth: "smile",
  };

  if (mood === "sleepy") return { eyes: "closed-arc", mouth: "small" };
  if (mood === "wow") {
    // pip-wow.svg exactly
    return {
      eyes: "round",
      eyeY: 61,
      eyeRx: 9,
      eyeRy: 10.5,
      hl1x: 39,
      hl1y: 57,
      hl1r: 3.6,
      hl2x: 33,
      hl2y: 66,
      hl2r: 1.8,
      mouth: "open",
      mouthWide: true,
    };
  }
  if (mood === "sad") {
    // droopy eyes drawn in the same style
    return {
      eyes: "round",
      eyeY: 64,
      eyeRx: 6.6,
      eyeRy: 6.2,
      hl1x: 38.2,
      hl1y: 61,
      hl1r: 2.2,
      hl2x: 34.2,
      hl2y: 66.5,
      hl2r: 1.2,
      mouth: "frown",
    };
  }
  if (mood === "chewing") {
    return open
      ? { ...happy, mouth: "open", mouthWide: false }
      : { ...happy, mouth: "smile" };
  }
  if (open) {
    // gulp: mouth wide over the default face
    return { ...happy, mouth: "open", mouthWide: true };
  }
  if (mood === "celebrate") {
    return { ...happy, mouth: "open", mouthWide: false };
  }
  return happy;
}
