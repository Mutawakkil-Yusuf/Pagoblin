/**
 * All sounds are synthesized with the Web Audio API. No audio files.
 * Master gain 0.25 max. The AudioContext is created lazily and resumed on the
 * first user gesture. Nothing plays on page load. Mute lives in the settings
 * store (persisted). Sound is never the only feedback.
 */

export type Cue =
  | "pop"
  | "gulp"
  | "success"
  | "error"
  | "toggle-on"
  | "toggle-off"
  | "giggle"
  | "stamp"
  | "reorder"
  | "woosh";

export type LoopName = "chew";

const MASTER_MAX = 0.25;

let ctx: AudioContext | null = null;
let master: GainNode | null = null;

function ensure(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AC: typeof AudioContext | undefined =
    window.AudioContext ??
    (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AC) return null;
  if (!ctx) {
    try {
      ctx = new AC();
      master = ctx.createGain();
      master.gain.value = MASTER_MAX;
      master.connect(ctx.destination);
    } catch {
      ctx = null;
    }
  }
  return ctx;
}

let muted = false;
export function setSoundMuted(m: boolean) {
  muted = m;
  if (m) stopAllLoops();
}
export function setSoundVolume(v: number) {
  if (master) master.gain.value = Math.max(0, Math.min(1, v)) * MASTER_MAX;
}

export function unlockAudio() {
  const c = ensure();
  if (c && c.state === "suspended") void c.resume();
}

if (typeof window !== "undefined") {
  const onGesture = () => unlockAudio();
  window.addEventListener("pointerdown", onGesture, { capture: true });
  window.addEventListener("keydown", onGesture, { capture: true });
  window.addEventListener("touchend", onGesture, { capture: true });
}

type ToneOpts = {
  type?: OscillatorType;
  from: number;
  to?: number;
  dur: number;
  gain?: number;
  delay?: number;
  lowpass?: number;
};

function tone({ type = "sine", from, to, dur, gain = 0.2, delay = 0, lowpass }: ToneOpts) {
  const c = ensure();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + delay;
  const osc = c.createOscillator();
  osc.type = type;
  osc.frequency.setValueAtTime(from, t0);
  if (to && to !== from) osc.frequency.exponentialRampToValueAtTime(Math.max(1, to), t0 + dur);
  const g = c.createGain();
  g.gain.setValueAtTime(0.0001, t0);
  g.gain.exponentialRampToValueAtTime(gain, t0 + dur * 0.25);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  let node: AudioNode = g;
  osc.connect(g);
  if (lowpass) {
    const lp = c.createBiquadFilter();
    lp.type = "lowpass";
    lp.frequency.value = lowpass;
    node.connect(lp);
    node = lp;
  }
  node.connect(master);
  osc.start(t0);
  osc.stop(t0 + dur + 0.03);
}

function noiseBurst({ dur, freq, gain = 0.15, delay = 0 }: { dur: number; freq: number; gain?: number; delay?: number }) {
  const c = ensure();
  if (!c || !master || muted) return;
  const t0 = c.currentTime + delay;
  const len = Math.max(1, Math.floor(c.sampleRate * dur));
  const buf = c.createBuffer(1, len, c.sampleRate);
  const data = buf.getChannelData(0);
  for (let i = 0; i < len; i++) data[i] = Math.random() * 2 - 1;
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = freq;
  bp.Q.value = 1.2;
  const g = c.createGain();
  g.gain.setValueAtTime(gain, t0);
  g.gain.exponentialRampToValueAtTime(0.0001, t0 + dur);
  src.connect(bp).connect(g).connect(master);
  src.start(t0);
}

/** Light generated reverb tail for the success arpeggio. */
function sparkle(delay: number) {
  const c = ensure();
  if (!c || !master || muted) return;
  const len = Math.floor(c.sampleRate * 0.3);
  const buf = c.createBuffer(1, len, c.sampleRate);
  const d = buf.getChannelData(0);
  for (let i = 0; i < len; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / len, 2.4);
  const src = c.createBufferSource();
  src.buffer = buf;
  const bp = c.createBiquadFilter();
  bp.type = "bandpass";
  bp.frequency.value = 5200;
  bp.Q.value = 0.8;
  const g = c.createGain();
  g.gain.value = 0.05;
  src.connect(bp).connect(g).connect(master);
  src.start(c.currentTime + delay);
}

function bistable(on: boolean) {
  if (on) tone({ type: "sine", from: 500, to: 640, dur: 0.07, gain: 0.16 });
  else tone({ type: "sine", from: 640, to: 500, dur: 0.07, gain: 0.16 });
}

const cueFn: Record<Cue, () => void> = {
  // Sine 600 -> 300 Hz, 60 ms, gain 0.2: button taps, chip select
  pop: () => tone({ type: "sine", from: 600, to: 300, dur: 0.06, gain: 0.2 }),
  // Triangle 400 -> 150 Hz twice, 120 ms total, lowpass 800: file dropped or added
  gulp: () => {
    tone({ type: "triangle", from: 400, to: 150, dur: 0.06, gain: 0.2, lowpass: 800 });
    tone({ type: "triangle", from: 400, to: 150, dur: 0.06, gain: 0.14, delay: 0.07, lowpass: 800 });
  },
  // Arpeggio C5 E5 G5 C6, 80 ms apart, sine + triangle, light reverb, ~600 ms
  success: () => {
    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((f, i) => {
      tone({ type: "sine", from: f, dur: 0.16, gain: 0.13, delay: i * 0.08 });
      tone({ type: "triangle", from: f, dur: 0.12, gain: 0.06, delay: i * 0.08 + 0.02 });
    });
    sparkle(0.38);
  },
  // Two soft low notes, G3 then E3, 250 ms total, calm
  error: () => {
    tone({ type: "sine", from: 196, dur: 0.14, gain: 0.16 });
    tone({ type: "sine", from: 164.8, dur: 0.16, gain: 0.14, delay: 0.12 });
  },
  "toggle-on": () => bistable(true),
  "toggle-off": () => bistable(false),
  // Three quick sine notes 700, 900, 800 Hz, 40 ms each
  giggle: () => {
    tone({ type: "sine", from: 700, dur: 0.04, gain: 0.16 });
    tone({ type: "sine", from: 900, dur: 0.04, gain: 0.16, delay: 0.05 });
    tone({ type: "sine", from: 800, dur: 0.04, gain: 0.14, delay: 0.1 });
  },
  // Sine at 140 Hz, 120 ms, plus a tiny noise tick: signature placed
  stamp: () => {
    tone({ type: "sine", from: 140, dur: 0.12, gain: 0.24 });
    noiseBurst({ dur: 0.03, freq: 2400, gain: 0.08 });
  },
  // Very quiet pop, 30 percent of normal gain: dropped after drag
  reorder: () => tone({ type: "sine", from: 600, to: 300, dur: 0.06, gain: 0.2 * 0.3 }),
  woosh: () => noiseBurst({ dur: 0.13, freq: 700, gain: 0.045 }),
};

type Loop = { timers: ReturnType<typeof setTimeout>[]; interval: ReturnType<typeof setInterval> | null };
const loops: Record<LoopName, Loop> = {
  chew: { timers: [], interval: null },
};

function chewOnce() {
  // Short filtered noise burst (bandpass 900 Hz, 40 ms), small random volume.
  noiseBurst({ dur: 0.04, freq: 900, gain: 0.09 + Math.random() * 0.05 });
}

let crumbListener: (() => void) | null = null;
export function setChewCrumbListener(fn: (() => void) | null) {
  crumbListener = fn;
}

function stopAllLoops() {
  (Object.keys(loops) as LoopName[]).forEach((k) => sound.stopLoop(k));
}

export const sound = {
  play(cue: Cue) {
    if (muted) return;
    unlockAudio();
    try {
      cueFn[cue]();
    } catch {
      /* Sound is never the only feedback; stay silent on failure. */
    }
  },
  /** Matches Pip's mouth: a chew tick every 220 ms with jittered timing. */
  startLoop(loopName: LoopName) {
    const l = loops[loopName];
    if (muted || l.interval) return;
    unlockAudio();
    l.interval = setInterval(() => {
      if (muted) return;
      if (typeof document !== "undefined" && document.hidden) return;
      chewOnce();
      const jitter = setTimeout(() => {
        if (!muted) {
          chewOnce();
          crumbListener?.();
        }
      }, 60 + Math.random() * 80);
      l.timers.push(jitter);
    }, 220);
  },
  stopLoop(loopName: LoopName) {
    const l = loops[loopName];
    if (l.interval) clearInterval(l.interval);
    l.interval = null;
    l.timers.forEach(clearTimeout);
    l.timers = [];
  },
  stopAllLoops,
};
