"use client";

/**
 * Sign tool (screen 07): draw, type or upload a signature, drag it on the page
 * preview, choose this page / all pages / last page, place. Fractions go to the
 * worker (top-left origin), which converts with the real page size.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { Pip } from "@/components/pip/Pip";
import { DropZone } from "@/components/ui/DropZone";
import { Button, Chip } from "@/components/ui/core";
import { IconClose } from "@/components/ui/Icons";
import { useToolFiles } from "@/lib/store/docs";
import { useDoneStore } from "@/lib/store/done";
import { EngineError, CancelledError, readPageCount, runSignPlace, runThumbs } from "@/lib/engine/client";
import { fileErrors, type FileItem } from "@/lib/files";
import { formatBytes, pluralPages } from "@/lib/format";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { toast } from "@/lib/store/toasts";

type Source = "draw" | "type" | "upload";
type Scope = "this" | "all" | "last";

const INKS: { key: string; label: string; value: string }[] = [
  { key: "black", label: "Black", value: "#17130F" },
  { key: "blue", label: "Blue", value: "#1D2FA6" },
];

export function SignTool() {
  const files = useToolFiles((s) => s.files.sign);
  const add = useToolFiles((s) => s.add);
  const remove = useToolFiles((s) => s.remove);
  const clear = useToolFiles((s) => s.clear);
  const pageCountMap = useToolFiles((s) => s.pageCount);
  const setPageCount = useToolFiles((s) => s.setPageCount);
  const setResult = useDoneStore((s) => s.setResult);
  const router = useRouter();

  const [source, setSource] = useState<Source>("draw");
  const [ink, setInk] = useState(INKS[0].value);
  const [typed, setTyped] = useState("");
  const [sigUrl, setSigUrl] = useState<string | null>(null);
  const [sigAR, setSigAR] = useState(4.2); // width/height of the signature art
  const [page, setPage] = useState(1);
  const [thumbUrl, setThumbUrl] = useState<string | null>(null);
  const [pageAR, setPageAR] = useState(Math.SQRT2);
  const [placing, setPlacing] = useState({ x: 0.1, y: 0.74, w: 0.3, rot: 0 });
  const [scope, setScope] = useState<Scope>("this");
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);

  const canvasRef = useRef<HTMLCanvasElement | null>(null);
  const drawing = useRef(false);
  const uploadRef = useRef<HTMLInputElement | null>(null);
  const thumbArea = useRef<HTMLDivElement | null>(null);

  const item: FileItem | undefined = files[0];
  const total = item ? (pageCountMap[item.id] ?? null) : null;

  useEffect(() => {
    if (!item) return;
    void readPageCount(item.file)
      .then(({ pageCount: n, encrypted }) => {
        if (encrypted) {
          toast.error(fileErrors.password);
          remove("sign", item.id);
          return;
        }
        if (n) {
          setPageCount(item.id, n);
          setPage((c) => Math.min(c, n));
        }
      })
      .catch(() => {
        toast.error(fileErrors.unopenable);
        remove("sign", item.id);
      });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  // Page preview render.
  useEffect(() => {
    let alive = true;
    if (!item) return;
    void (async () => {
      try {
        const out = await runThumbs({ file: item.file, pages: [page], width: 640 });
        const t = out.find((o) => o.page === page) ?? out[0];
        if (!alive) return;
        if (t) {
          const url = URL.createObjectURL(t.blob);
          setThumbUrl(url);
          const bmp = await createImageBitmap(t.blob);
          setPageAR(bmp.width / bmp.height);
          bmp.close();
        }
      } catch {
        if (alive) setThumbUrl(null);
      }
    })();
    return () => {
      alive = false;
    };
  }, [item, page]);

  /* ---------- draw pad ---------- */
  useEffect(() => {
    const canvas = canvasRef.current;
    if (!canvas || source !== "draw") return;
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    ctx.clearRect(0, 0, canvas.width, canvas.height);
  }, [source, ink]);

  const stroke = (e: React.PointerEvent<HTMLCanvasElement>, mode: "start" | "move" | "end") => {
    const canvas = canvasRef.current;
    if (!canvas || (source !== "draw" && mode === "start")) return;
    const rect = canvas.getBoundingClientRect();
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const x = ((e.clientX - rect.left) / rect.width) * canvas.width;
    const y = ((e.clientY - rect.top) / rect.height) * canvas.height;
    if (mode === "start") {
      drawing.current = true;
      ctx.strokeStyle = ink;
      ctx.lineWidth = canvas.width * 0.012;
      ctx.lineCap = "round";
      ctx.beginPath();
      ctx.moveTo(x, y);
    } else if (mode === "move" && drawing.current) {
      ctx.lineTo(x, y);
      ctx.stroke();
    } else if (mode === "end") {
      drawing.current = false;
    }
  };

  const adoptCanvas = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    let w = canvas.width;
    let h = canvas.height;
    // Trim transparent margins so the art snaps to its box.
    const ctx = canvas.getContext("2d");
    if (!ctx) return;
    const data = ctx.getImageData(0, 0, w, h).data;
    let minX = w, minY = h, maxX = 0, maxY = 0, inked = false;
    for (let y = 0; y < h; y++) {
      for (let x = 0; x < w; x++) {
        if (data[(y * w + x) * 4 + 3] > 8) {
          inked = true;
          if (x < minX) minX = x;
          if (x > maxX) maxX = x;
          if (y < minY) minY = y;
          if (y > maxY) maxY = y;
        }
      }
    }
    if (!inked) {
      toast.error("Draw your signature first.");
      return;
    }
    const pad = 6;
    minX = Math.max(0, minX - pad); minY = Math.max(0, minY - pad);
    maxX = Math.min(w - 1, maxX + pad); maxY = Math.min(h - 1, maxY + pad);
    const trimmed = document.createElement("canvas");
    trimmed.width = maxX - minX + 1;
    trimmed.height = maxY - minY + 1;
    trimmed.getContext("2d")?.drawImage(canvas, minX, minY, trimmed.width, trimmed.height, 0, 0, trimmed.width, trimmed.height);
    setSigUrl(trimmed.toDataURL("image/png"));
    setSigAR(trimmed.width / trimmed.height);
    sound.play("toggle-on");
  };

  /* ---------- typed signature ---------- */
  const adoptTyped = (text: string) => {
    setTyped(text);
    const clean = text.trim();
    if (!clean) {
      setSigUrl(null);
      return;
    }
    const c = document.createElement("canvas");
    const ctx = c.getContext("2d");
    if (!ctx) return;
    ctx.font = "800 96px 'Bricolage Grotesque', system-ui, sans-serif";
    const metrics = ctx.measureText(clean);
    const w = Math.ceil(metrics.width) + 48;
    const h = 160;
    c.width = Math.min(1200, w);
    c.height = h;
    const ctx2 = c.getContext("2d");
    if (!ctx2) return;
    ctx2.font = "800 96px 'Bricolage Grotesque', system-ui, sans-serif";
    ctx2.fillStyle = ink;
    ctx2.textBaseline = "middle";
    ctx2.fillText(clean, 24, h / 2 + 8);
    setSigUrl(c.toDataURL("image/png"));
    setSigAR(c.width / c.height);
  };

  /* ---------- uploaded signature ---------- */
  const adoptUpload = (file: globalThis.File) => {
    void (async () => {
      const img = new Image();
      img.onload = () => {
        const maxW = 900;
        const scale = img.width > maxW ? maxW / img.width : 1;
        const c = document.createElement("canvas");
        c.width = Math.round(img.width * scale);
        c.height = Math.round(img.height * scale);
        const ctx = c.getContext("2d");
        if (!ctx) return;
        ctx.drawImage(img, 0, 0, c.width, c.height);
        setSigUrl(c.toDataURL("image/png"));
        setSigAR(c.width / c.height);
        sound.play("toggle-on");
      };
      img.onerror = () => toast.error(fileErrors.imageExpected);
      img.src = URL.createObjectURL(file);
    })();
  };

  const hFraction = placing.w * (pageAR / sigAR);

  const dragPlacing = (e: React.PointerEvent<HTMLDivElement>) => {
    if (!sigUrl || !thumbArea.current) return;
    if (e.type === "pointermove" && e.buttons === 0) return;
    const rect = thumbArea.current.getBoundingClientRect();
    const fx = Math.min(1 - placing.w, Math.max(0, (e.clientX - rect.left) / rect.width - placing.w / 2));
    const fy = Math.min(1 - hFraction, Math.max(0, (e.clientY - rect.top) / rect.height - hFraction / 2));
    setPlacing((p) => ({ ...p, x: fx, y: fy }));
  };

  const scopePages = (): number[] => {
    if (total == null) return [];
    if (scope === "this") return [page];
    if (scope === "last") return [total];
    return Array.from({ length: total }, (_, i) => i + 1);
  };

  const run = async () => {
    if (!item || !sigUrl || total == null) return;
    setBusy(true);
    setProgress(0);
    sound.startLoop("chew");
    haptic("tap");
    try {
      const buffer = await item.file.arrayBuffer();
      const bytes = await (await fetch(sigUrl)).blob().then((b) => b.arrayBuffer());
      const pages = scopePages();
      const out = await runSignPlace(
        {
          file: buffer,
          signaturePng: bytes,
          placements: pages.map((p) => ({
            pageIndex: p - 1,
            x: placing.x,
            y: placing.y,
            width: placing.w,
            height: Math.min(hFraction, 1 - placing.y),
            rotation: placing.rot,
          })),
        },
        { onProgress: (p) => setProgress(p) },
      );
      sound.stopLoop("chew");
      sound.play("success");
      haptic("success");
      const stem = item.name.replace(/\.pdf$/i, "");
      setResult({
        id: `sign-${Date.now()}`,
        tool: "sign",
        headline: "Signed!",
        sentence: `${stem}: signature on ${scope === "all" ? `all ${total} pages` : `page ${pages[0]} of ${total}`}.`,
        beforeAfter: { pages: total, count: pages.length },
        outputs: [{ blob: out.blob, name: `${stem}-signed.pdf` }],
        at: Date.now(),
      });
      clear("sign");
      router.push("/done");
    } catch (e) {
      sound.stopLoop("chew");
      sound.play("error");
      haptic("error");
      setBusy(false);
      if (e instanceof CancelledError) return;
      if (e instanceof EngineError && e.code === "password") {
        toast.error(fileErrors.password);
        return;
      }
      toast.error("Something went wrong while signing. Try again.");
    }
  };

  return (
    <section aria-label="Sign tool" className="mt-8 flex flex-col gap-4">
      {files.length === 0 ? (
        <DropZone accept={["pdf"]} label="Add file" hint="Drop your PDF here. Nothing is uploaded." onFiles={(i) => { clear("sign"); add("sign", i); }} />
      ) : (
        <>
          {/* File head */}
          <motion.div
            key={item.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            className="flex items-center justify-between rounded-phone-chip bg-amber px-3.5 py-3 text-ink"
          >
            <span className="min-w-0 flex-1 truncate font-bold text-[15px]">{item.name}</span>
            <span className="tnum mr-1 shrink-0 text-[12px]">
              {total != null ? pluralPages(total) : "counting…"} · {formatBytes(item.size)}
            </span>
            <button
              type="button"
              aria-label="Remove file"
              className="flex h-[36px] w-[36px] shrink-0 items-center justify-center rounded-[18px] bg-ink/10 text-ink"
              onClick={() => {
                clear("sign");
                sound.play("pop");
              }}
            >
              <IconClose width={16} height={16} />
            </button>
          </motion.div>

          {busy ? (
            <div className="rounded-card-l bg-surface p-6 text-center" role="status" aria-live="polite">
              <Pip mood="chewing" size={120} className="mx-auto" />
              <p className="mt-3 text-body text-muted">Placing… {Math.round(progress * 100)}%</p>
            </div>
          ) : (
            <>
              {/* Signature source */}
              <div className="flex gap-2" role="tablist" aria-label="Signature source">
                {(["draw", "type", "upload"] as Source[]).map((s) => (
                  <Chip
                    key={s}
                    label={s === "draw" ? "Draw" : s === "type" ? "Type" : "Upload"}
                    selected={source === s}
                    onClick={() => setSource(s)}
                    className="flex-1"
                  />
                ))}
              </div>

              {source === "draw" && (
                <div className="rounded-card-l bg-surface p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="tnum text-[13px] text-muted">Sign here</span>
                    <div className="flex items-center gap-2">
                      {INKS.map((i) => (
                        <button
                          type="button"
                          key={i.key}
                          aria-label={`Ink ${i.label.toLowerCase()}`}
                          aria-pressed={ink === i.value}
                          onClick={() => { setInk(i.value); sound.play("pop"); }}
                          className={`h-[26px] w-[26px] rounded-full ${ink === i.value ? "outline outline-[3px] outline-amber" : ""}`}
                          style={{ background: i.value }}
                        />
                      ))}
                      <button
                        type="button"
                        className="rounded-pill border-2 border-line px-3 py-1 font-bold text-[12px] text-cream"
                        onClick={() => {
                          const c = canvasRef.current;
                          const ctx = c?.getContext("2d");
                          if (c && ctx) ctx.clearRect(0, 0, c.width, c.height);
                          sound.play("pop");
                        }}
                      >
                        Clear
                      </button>
                    </div>
                  </div>
                  <canvas
                    ref={canvasRef}
                    width={560}
                    height={200}
                    className="w-full touch-none rounded-card bg-cream"
                    onPointerDown={(e) => stroke(e, "start")}
                    onPointerMove={(e) => stroke(e, "move")}
                    onPointerUp={(e) => stroke(e, "end")}
                    onPointerLeave={(e) => stroke(e, "end")}
                  />
                  <Button variant="ghost" className="mt-2 w-full" onClick={adoptCanvas}>
                    Use this signature
                  </Button>
                </div>
              )}

              {source === "type" && (
                <div className="rounded-card-l bg-surface p-3">
                  <div className="mb-2 flex items-center justify-between">
                    <span className="text-[13px] text-muted">Type it, Pip inked pretty</span>
                    <div className="flex items-center gap-2">
                      {INKS.map((i) => (
                        <button
                          type="button"
                          key={i.key}
                          aria-label={`Ink ${i.label.toLowerCase()}`}
                          aria-pressed={ink === i.value}
                          onClick={() => { setInk(i.value); if (typed) adoptTyped(typed); else sound.play("pop"); }}
                          className={`h-[26px] w-[26px] rounded-full ${ink === i.value ? "outline outline-[3px] outline-amber" : ""}`}
                          style={{ background: i.value }}
                        />
                      ))}
                    </div>
                  </div>
                  <label htmlFor="sign-typed" className="sr-only">Your name</label>
                  <input
                    id="sign-typed"
                    autoComplete="off"
                    value={typed}
                    onChange={(e) => adoptTyped(e.target.value)}
                    placeholder="Marigold B. Fernsby"
                    className="w-full rounded-card border-2 border-line bg-cream px-4 py-3 font-display text-[22px] text-ink outline-none focus:border-amber"
                  />
                </div>
              )}

              {source === "upload" && (
                <div className="rounded-card-l bg-surface p-3">
                  <input
                    ref={uploadRef}
                    type="file"
                    accept="image/*"
                    className="sr-only"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (f) adoptUpload(f);
                    }}
                  />
                  <Button variant="ghost" className="w-full" onClick={() => uploadRef.current?.click()}>
                    Pick a picture of your signature
                  </Button>
                  <p className="mt-1.5 text-small text-muted">JPG or PNG. Stays on this device.</p>
                </div>
              )}

              {/* Placement editor */}
              {sigUrl && total != null ? (
                <div className="flex flex-col gap-3">
                  <p className="tnum text-[13px] text-muted" aria-live="polite">
                    Placing on page {page} of {total}
                  </p>
                    {/* the sketchpad: one grouped surface, drag to nudge the ink */}
                    <div
                      ref={thumbArea}
                      role="group"
                      aria-label="Page preview; drag the signature to place it"
                      className="relative mx-auto w-full max-w-[420px] touch-none overflow-hidden rounded-card bg-cream outline outline-2 outline-line"
                      style={{ aspectRatio: "1 / 1", display: "flex", alignItems: "center", justifyContent: "center" }}
                      onPointerDown={dragPlacing}
                      onPointerMove={dragPlacing}
                    >
                      <img
                        src={thumbUrl ?? ""}
                        alt={`Page ${page} preview`}
                        className="h-full w-auto object-contain"
                        draggable={false}
                      />
                      <img
                        src={sigUrl}
                        alt="Your signature on this page"
                        draggable={false}
                        className="pointer-events-none absolute"
                        style={{
                          left: `${placing.x * 100}%`,
                          top: `${placing.y * 100}%`,
                          width: `${placing.w * 100}%`,
                          transform: `rotate(${placing.rot}deg)`,
                          transformOrigin: "top left",
                        }}
                      />
                    </div>

                  <div className="grid grid-cols-2 gap-3">
                    <label className="flex flex-col gap-1 text-[12px] font-bold text-cream">
                      Size
                      <input
                        type="range"
                        min={8}
                        max={55}
                        value={Math.round(placing.w * 100)}
                        onChange={(e) => setPlacing((p) => ({ ...p, w: Number(e.target.value) / 100 }))}
                        aria-label="Signature size"
                      />
                    </label>
                    <label className="flex flex-col gap-1 text-[12px] font-bold text-cream">
                      Tilt
                      <input
                        type="range"
                        min={-15}
                        max={15}
                        value={placing.rot}
                        onChange={(e) => setPlacing((p) => ({ ...p, rot: Number(e.target.value) }))}
                        aria-label="Signature tilt"
                      />
                    </label>
                  </div>

                  <div className="flex flex-wrap gap-2" role="group" aria-label="Place signature on">
                    {([["this", `Page ${page}`], ["all", "All pages"], ["last", `Last (${total})`]] as [Scope, string][]).map(
                      ([k, label]) => (
                        <Chip key={k} label={label} selected={scope === k} onClick={() => setScope(k)} />
                      ),
                    )}
                  </div>
                  {scope === "all" && total > 1 ? (
                    <p className="text-small text-muted">Every page gets the ink in the same spot.</p>
                  ) : null}
                  <label className="flex flex-wrap items-center gap-2 text-[13px] font-bold text-cream">
                    Page:
                    <input
                      type="number"
                      min={1}
                      max={total}
                      value={page}
                      onChange={(e) => setPage(Math.min(total, Math.max(1, Number(e.target.value) || 1)))}
                      className="tnum w-[74px] rounded-card border-2 border-line bg-surface px-3 py-2 text-center"
                      aria-label="Page number"
                    />
                    <span className="text-muted font-normal">of {total}</span>
                  </label>
                </div>
              ) : null}
            </>
          )}

          <div className="sticky bottom-28 z-10 md:bottom-8">
            <Button disabled={!sigUrl || !item || total == null || busy} className="w-full" size="lg" onClick={() => void run()} aria-busy={busy}>
              {busy ? `Placing… ${Math.round(progress * 100)}%` : "Sign and download"}
            </Button>
          </div>
        </>
      )}
    </section>
  );
}
