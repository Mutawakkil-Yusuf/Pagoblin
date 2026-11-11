"use client";

/**
 * Page organizer: every page is a card. Drag to reorder, select to rotate,
 * duplicate, delete or keep only the selection. Pages from inserted PDFs land
 * at the end and can be moved anywhere. The worker rebuilds a fresh PDF in the
 * exact order shown.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { AnimatePresence, motion } from "motion/react";
import {
  DndContext,
  KeyboardSensor,
  PointerSensor,
  closestCenter,
  useSensor,
  useSensors,
  type DragEndEvent,
} from "@dnd-kit/core";
import { rectSortingStrategy, SortableContext, arrayMove, sortableKeyboardCoordinates, useSortable } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { DropZone } from "@/components/ui/DropZone";
import { Button } from "@/components/ui/core";
import { Pip } from "@/components/pip/Pip";
import { BusyCard, StickyAction, ToolCard, ToolNote } from "@/components/tools/ToolParts";
import { IconDrag } from "@/components/ui/Icons";
import { useToolFiles } from "@/lib/store/docs";
import { useDoneStore } from "@/lib/store/done";
import { runOrganize, runThumbs, readPageCount, CancelledError } from "@/lib/engine/client";
import { fileErrors, nextId, type FileItem } from "@/lib/files";
import { formatBytes } from "@/lib/format";
import { calmError } from "@/lib/errors";
import { toast } from "@/lib/store/toasts";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

type Source = { id: string; name: string; file: File; pageCount: number };
type OrgItem = { key: string; sourceId: string; page: number; rotation: number };

export function OrganizeTool() {
  const router = useRouter();
  const storeFiles = useToolFiles((s) => s.files.organize);
  const clearStore = useToolFiles((s) => s.clear);
  const setResult = useDoneStore((s) => s.setResult);
  const [sources, setSources] = useState<Source[]>([]);
  const [items, setItems] = useState<OrgItem[]>([]);
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [urls, setUrls] = useState<Record<string, string>>({});
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("");
  const [dragging, setDragging] = useState(false);
  const controllerRef = useRef<AbortController | null>(null);
  const ingestedStore = useRef(false);

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 160, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ingest = async (incoming: FileItem[]) => {
    const fresh: Source[] = [];
    for (const item of incoming) {
      try {
        const info = await readPageCount(item.file);
        if (info.encrypted) {
          toast.error(fileErrors.password);
          continue;
        }
        if (!info.pageCount) {
          toast.error(fileErrors.unopenable);
          continue;
        }
        fresh.push({ id: nextId("src"), name: item.name, file: item.file, pageCount: info.pageCount });
      } catch {
        toast.error(fileErrors.unopenable);
      }
    }
    if (!fresh.length) return;
    setSources((prev) => [...prev, ...fresh]);
    setItems((prev) => [
      ...prev,
      ...fresh.flatMap((source) =>
        Array.from({ length: source.pageCount }, (_, i) => ({
          key: nextId("pg"),
          sourceId: source.id,
          page: i + 1,
          rotation: 0,
        })),
      ),
    ]);
    sound.play("gulp");
    haptic("success");
  };

  useEffect(() => {
    if (ingestedStore.current || !storeFiles.length) return;
    ingestedStore.current = true;
    void ingest(storeFiles).then(() => clearStore("organize"));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [storeFiles.length]);

  useEffect(() => {
    let alive = true;
    const created: Record<string, string> = {};
    void (async () => {
      for (const source of sources) {
        try {
          const out = await runThumbs({
            file: source.file,
            pages: Array.from({ length: source.pageCount }, (_, i) => i + 1),
            width: 150,
          });
          for (const thumb of out) created[`${source.id}:${thumb.page}`] = URL.createObjectURL(thumb.blob);
        } catch {
          /* the cards still work without previews */
        }
      }
      if (alive) setUrls(created);
      else Object.values(created).forEach((url) => URL.revokeObjectURL(url));
    })();
    return () => {
      alive = false;
      Object.values(created).forEach((url) => URL.revokeObjectURL(url));
    };
  }, [sources]);

  const toggle = (key: string) => {
    sound.play("pop");
    haptic("tap");
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(key)) next.delete(key);
      else next.add(key);
      return next;
    });
  };

  const rotateSelected = (delta: number) => {
    setItems((prev) => prev.map((it) => (selected.has(it.key) ? { ...it, rotation: (it.rotation + delta + 360) % 360 } : it)));
    sound.play("reorder");
    haptic("tap");
  };

  const duplicateSelected = () => {
    setItems((prev) => {
      const next: OrgItem[] = [];
      for (const item of prev) {
        next.push(item);
        if (selected.has(item.key)) next.push({ ...item, key: nextId("pg") });
      }
      return next;
    });
    setSelected(new Set());
    sound.play("toggle-on");
    haptic("success");
  };

  const deleteSelected = () => {
    if (selected.size >= items.length) {
      toast.info("Keep at least one page.");
      return;
    }
    setItems((prev) => prev.filter((it) => !selected.has(it.key)));
    setSelected(new Set());
    sound.play("pop");
    haptic("tap");
  };

  const keepSelected = () => {
    if (!selected.size) return;
    setItems((prev) => prev.filter((it) => selected.has(it.key)));
    setSelected(new Set());
    sound.play("toggle-on");
    haptic("success");
  };

  const onDragEnd = (e: DragEndEvent) => {
    setDragging(false);
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = items.findIndex((it) => it.key === active.id);
    const newIndex = items.findIndex((it) => it.key === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    setItems(arrayMove(items, oldIndex, newIndex));
    sound.play("reorder");
    haptic("tap");
  };

  const run = async () => {
    if (!items.length || !sources.length) return;
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setProgress(0);
    sound.startLoop("chew");
    haptic("tap");
    try {
      const sourceIndex = new Map(sources.map((s, i) => [s.id, i]));
      const out = await runOrganize(
        {
          sources: sources.map((s) => s.file),
          pages: items.map((it) => ({ source: sourceIndex.get(it.sourceId) ?? 0, page: it.page, rotation: it.rotation })),
        },
        {
          signal: controller.signal,
          onProgress: (p, l) => {
            setProgress(p);
            if (l) setLabel(l);
          },
        },
      );
      sound.stopLoop("chew");
      sound.play("success");
      haptic("success");
      const stem = sources[0]?.name.replace(/\.pdf$/i, "") || "document";
      setResult({
        id: `organize-${Date.now()}`,
        tool: "organize",
        headline: "Organized!",
        sentence: `${out.pages} ${out.pages === 1 ? "page" : "pages"} in your order, from ${sources.length} ${
          sources.length === 1 ? "PDF" : "PDFs"
        }.`,
        beforeAfter: { pages: out.pages, count: sources.length },
        outputs: [{ blob: out.blob, name: `${stem}-organized.pdf` }],
        at: Date.now(),
      });
      router.push("/done");
    } catch (e) {
      sound.stopLoop("chew");
      sound.play("error");
      haptic("error");
      if (e instanceof CancelledError) return;
      toast.error(calmError(e, "Something went wrong while organizing. Try again."));
    } finally {
      setBusy(false);
      controllerRef.current = null;
    }
  };

  const totalBytes = sources.reduce((n, s) => n + s.file.size, 0);
  const selectedCount = selected.size;

  return (
    <section aria-label="Page organizer" className="mt-8 flex flex-col gap-4">
      {items.length === 0 ? (
        <DropZone
          accept={["pdf"]}
          label="Add a PDF"
          hint="Drop a PDF, then move its pages around. Nothing is uploaded."
          onFiles={(items) => void ingest(items)}
        />
      ) : (
        <>
          <ToolCard className="!p-4">
            <div className="flex items-start justify-between gap-3">
              <div className="min-w-0">
                <p className="font-display text-h3 text-cream">
                  {items.length} {items.length === 1 ? "page" : "pages"}
                </p>
                <p className="mt-1 truncate text-small text-muted">
                  {sources.map((s) => s.name).join(" · ")} · {formatBytes(totalBytes)}
                </p>
              </div>
              <button
                type="button"
                className="min-h-[44px] shrink-0 rounded-pill border-2 border-line px-3 py-1.5 text-small font-bold text-muted"
                onClick={() => {
                  setSources([]);
                  setItems([]);
                  setSelected(new Set());
                  clearStore("organize");
                  sound.play("pop");
                }}
              >
                Start over
              </button>
            </div>
            <ToolNote className="mt-3">Drag a card to reorder. Tap to select, then use the tools below.</ToolNote>
          </ToolCard>

          <div className="flex flex-wrap gap-2" role="group" aria-label="Page actions">
            <Button variant="surface" size="md" disabled={!selectedCount} onClick={() => rotateSelected(-90)}>
              Rotate left
            </Button>
            <Button variant="surface" size="md" disabled={!selectedCount} onClick={() => rotateSelected(90)}>
              Rotate right
            </Button>
            <Button variant="surface" size="md" disabled={!selectedCount} onClick={duplicateSelected}>
              Duplicate
            </Button>
            <Button variant="surface" size="md" disabled={!selectedCount} onClick={keepSelected}>
              Keep selected
            </Button>
            <Button variant="surface" size="md" disabled={!selectedCount} onClick={deleteSelected}>
              Delete
            </Button>
          </div>
          <p className="tnum min-h-[20px] text-small text-muted" aria-live="polite">
            {selectedCount ? `${selectedCount} selected` : "Tap a page to select it."}
          </p>

          {busy ? (
            <BusyCard
              progress={progress}
              label={label || "Organizing…"}
              onCancel={() => controllerRef.current?.abort()}
            />
          ) : (
            <DndContext
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragStart={() => setDragging(true)}
              onDragEnd={onDragEnd}
              onDragCancel={() => setDragging(false)}
            >
              <SortableContext items={items.map((it) => it.key)} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-3 gap-3" data-testid="organize-grid">
                  <AnimatePresence initial={false}>
                    {items.map((item, index) => {
                      const source = sources.find((s) => s.id === item.sourceId);
                      return (
                        <SortablePageCard
                          key={item.key}
                          item={item}
                          index={index}
                          url={source ? urls[`${source.id}:${item.page}`] : undefined}
                          selected={selected.has(item.key)}
                          dragging={dragging}
                          onToggle={() => toggle(item.key)}
                        />
                      );
                    })}
                  </AnimatePresence>
                </div>
              </SortableContext>
            </DndContext>
          )}

          {!busy ? (
            <DropZone
              accept={["pdf"]}
              label="Add another PDF"
              hint="Its pages land at the end; drag them anywhere."
              className="!rounded-[22px]"
              onFiles={(items) => void ingest(items)}
            />
          ) : null}

          <StickyAction>
            <Button disabled={!items.length || busy} className="w-full" size="lg" onClick={() => void run()} aria-busy={busy}>
              {busy ? `Saving… ${Math.round(progress * 100)}%` : `Save ${items.length} ${items.length === 1 ? "page" : "pages"}`}
            </Button>
          </StickyAction>
        </>
      )}
    </section>
  );
}

function SortablePageCard(props: {
  item: OrgItem;
  index: number;
  url?: string;
  selected: boolean;
  dragging: boolean;
  onToggle: () => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.key });
  const rotation = props.item.rotation % 360;
  const scale = rotation === 90 || rotation === 270 ? 0.72 : 1;
  return (
    <motion.div
      ref={setNodeRef}
      layout
      initial={{ opacity: 0, scale: 0.96 }}
      animate={{ opacity: 1, scale: 1 }}
      exit={{ opacity: 0, scale: 0.94, transition: { duration: 0.15 } }}
      transition={{ type: "spring", stiffness: 380, damping: 30 }}
      style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 6 : undefined }}
      className={`relative ${isDragging ? "opacity-80" : ""}`}
    >
      <button
        type="button"
        {...attributes}
        {...listeners}
        aria-pressed={props.selected}
        aria-label={`Page ${props.index + 1}${props.selected ? ", selected" : ""}`}
        onClick={props.onToggle}
        className={`relative block w-full overflow-hidden rounded-card bg-cream text-left ${
          props.selected ? "outline outline-[3px] outline-orange outline-offset-[-3px]" : ""
        }`}
        style={{ aspectRatio: "3 / 4" }}
      >
        {props.url ? (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            src={props.url}
            alt=""
            draggable={false}
            className="h-full w-full object-contain transition-transform"
            style={{ transform: `rotate(${rotation}deg) scale(${scale})` }}
          />
        ) : (
          <span className="skeleton absolute inset-0 block" aria-hidden="true" />
        )}
        <span className="tnum absolute bottom-2 left-2 rounded-full bg-ink/80 px-2 py-0.5 text-[11px] font-bold text-cream">
          {props.index + 1}
        </span>
        {rotation ? (
          <span className="absolute right-2 top-2 rounded-full bg-ink/80 px-2 py-0.5 text-[10px] font-bold text-cream">
            {rotation}°
          </span>
        ) : null}
        <motion.span
          aria-hidden="true"
          className="absolute right-2 bottom-2 flex h-[24px] w-[24px] items-center justify-center rounded-full bg-orange text-ink"
          initial={false}
          animate={{ scale: props.selected ? 1 : 0, opacity: props.selected ? 1 : 0 }}
          transition={{ type: "spring", stiffness: 420, damping: 26 }}
        >
          <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3.5" strokeLinecap="round" strokeLinejoin="round">
            <path d="M5 12l5 5L20 7" />
          </svg>
        </motion.span>
      </button>
      <span className="pointer-events-none absolute left-1 top-1 text-ink/60" aria-hidden="true">
        <IconDrag width={16} height={16} />
      </span>
    </motion.div>
  );
}
