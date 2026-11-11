"use client";

/**
 * Merge tool: add many PDFs, drag to reorder (with keyboard up/down, real
 * buttons), remove, per-file page counts and sizes, totals, then merge.
 */
import { useState } from "react";
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
import { restrictToVerticalAxis } from "@dnd-kit/modifiers";
import {
  SortableContext,
  arrayMove,
  sortableKeyboardCoordinates,
  useSortable,
  verticalListSortingStrategy,
} from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import type { FileItem } from "@/lib/files";
import { DropZone } from "@/components/ui/DropZone";
import { Button } from "@/components/ui/core";
import { IconClose, IconDrag, IconPlus } from "@/components/ui/Icons";
import { useToolFiles } from "@/lib/store/docs";
import { useDoneStore } from "@/lib/store/done";
import { readPageCount, runMerge, EngineError, CancelledError } from "@/lib/engine/client";
import { fileErrors } from "@/lib/files";
import { formatBytes } from "@/lib/format";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";
import { springs } from "@/lib/motion";
import { toast } from "@/lib/store/toasts";
import { usePipEvents } from "@/lib/store/pip";

const ROW_BG = ["bg-amber", "bg-cream", "bg-peach", "bg-sky", "bg-orange"];

export function MergeTool() {
  const files = useToolFiles((s) => s.files.merge);
  const pageCounts = useToolFiles((s) => s.pageCount);
  const setPageCount = useToolFiles((s) => s.setPageCount);
  const remove = useToolFiles((s) => s.remove);
  const add = useToolFiles((s) => s.add);
  const reorder = useToolFiles((s) => s.reorder);
  const clear = useToolFiles((s) => s.clear);
  const setResult = useDoneStore((s) => s.setResult);
  const gulp = usePipEvents((s) => s.gulp);
  const router = useRouter();

  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [progressLabel, setProgressLabel] = useState("");

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { delay: 160, tolerance: 6 } }),
    useSensor(KeyboardSensor, { coordinateGetter: sortableKeyboardCoordinates }),
  );

  const ingest = (items: FileItem[]) => {
    add("merge", items);
    gulp();
    for (const it of items) {
      void readPageCount(it.file)
        .then(({ pageCount, encrypted }) => {
          if (encrypted) {
            toast.error(fileErrors.password);
            useToolFiles.getState().remove("merge", it.id);
            return;
          }
          if (pageCount) setPageCount(it.id, pageCount);
        })
        .catch(() => {
          toast.error(fileErrors.unopenable);
          useToolFiles.getState().remove("merge", it.id);
        });
    }
  };

  const onDragEnd = (e: DragEndEvent) => {
    const { active, over } = e;
    if (!over || active.id === over.id) return;
    const oldIndex = files.findIndex((f) => f.id === active.id);
    const newIndex = files.findIndex((f) => f.id === over.id);
    if (oldIndex < 0 || newIndex < 0) return;
    reorder("merge", arrayMove(files, oldIndex, newIndex).map((f) => f.id));
    sound.play("reorder");
    haptic("tap");
  };

  const moveItem = (id: string, dir: -1 | 1) => {
    const i = files.findIndex((f) => f.id === id);
    const j = i + dir;
    if (i < 0 || j < 0 || j >= files.length) return;
    reorder("merge", arrayMove(files, i, j).map((f) => f.id));
    sound.play("reorder");
    haptic("tap");
  };

  const total = files.reduce((n, f) => n + (pageCounts[f.id] ?? 0), 0);
  const totalSize = files.reduce((n, f) => n + f.size, 0);

  const run = async () => {
    setBusy(true);
    sound.startLoop("chew");
    haptic("tap");
    try {
      const buffers = [];
      for (const f of files) buffers.push({ name: f.name, buffer: await f.file.arrayBuffer() });
      const out = await runMerge(
        { files: buffers },
        {
          onProgress: (p, label) => {
            setProgress(p);
            if (label) setProgressLabel(label);
          },
        },
      );
      sound.stopLoop("chew");
      sound.play("success");
      haptic("success");
      setResult({
        id: `merge-${Date.now()}`,
        tool: "merge",
        headline: "Merged!",
        sentence: `${files.length} ${files.length === 1 ? "file" : "files"} went into one PDF. ${out.pages} pages, ${formatBytes(out.blob.size)}.`,
        beforeAfter: { count: files.length, pages: out.pages, after: out.blob.size },
        outputs: [{ blob: out.blob, name: "merged.pdf" }],
        at: Date.now(),
      });
      clear("merge");
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
      if (e instanceof EngineError && e.code === "oom") {
        toast.error("That is too much for this device. Try fewer or smaller files.");
        return;
      }
      toast.error("Something went wrong while merging. Try again.");
    }
  };

  return (
    <section aria-label="Merge tool" className="mt-9 flex flex-col gap-4">
      <p className="text-body leading-[22px] text-muted">Hold and drag to put them in order.</p>

      {files.length === 0 ? (
        <DropZone accept={["pdf"]} label="Add file" hint="Drop your PDFs here. Nothing is uploaded." onFiles={ingest} />
      ) : (
        <>
          <DndContext sensors={sensors} collisionDetection={closestCenter} modifiers={[restrictToVerticalAxis]} onDragEnd={onDragEnd}>
            <SortableContext items={files.map((f) => f.id)} strategy={verticalListSortingStrategy}>
              <div className="flex flex-col rounded-[22px] gap-3" data-testid="merge-rows">
                <AnimatePresence initial={false}>
                  {files.map((f, i) => (
                    <SortableRow
                      key={f.id}
                      item={f}
                      index={i}
                      pages={pageCounts[f.id]}
                      onRemove={() => {
                        remove("merge", f.id);
                        sound.play("pop");
                        haptic("tap");
                      }}
                      onMove={(dir) => moveItem(f.id, dir)}
                    />
                  ))}
                </AnimatePresence>
              </div>
            </SortableContext>
          </DndContext>

          <DropZone accept={["pdf"]} label="Add more files" className="!rounded-[22px]" onFiles={ingest}>
            <span className="inline-flex items-center gap-2 text-amber">
              <IconPlus width={22} height={22} />
            </span>
          </DropZone>

          <div className="flex items-center justify-between rounded-[22px] bg-surface px-4 py-3.5 text-[14px] text-cream">
            <span>
              {files.length} {files.length === 1 ? "file" : "files"} · {total || "?"} {total === 1 ? "page" : "pages"}
            </span>
            <span className="tnum font-bold text-amber">about {formatBytes(totalSize)}</span>
          </div>
        </>
      )}

      <div className="sticky bottom-28 z-10 md:bottom-8">
        <Button
          disabled={files.length < 2 || busy}
          aria-busy={busy}
          className="w-full"
          onClick={() => void run()}
        >
          {busy ? `Merging… ${Math.round(progress * 100)}%` : `Merge ${files.length} files`}
        </Button>
        {busy ? (
          <p className="mt-2 min-h-[20px] text-center text-small text-muted" aria-live="polite">
            {progressLabel}
          </p>
        ) : null}
      </div>
    </section>
  );
}

function SortableRow(props: {
  item: FileItem;
  index: number;
  pages?: number;
  onRemove: () => void;
  onMove: (dir: -1 | 1) => void;
}) {
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: props.item.id });
  const rowBg = ROW_BG[props.index % ROW_BG.length];
  return (
    <motion.div
      ref={setNodeRef}
      data-testid="merge-row"
      layout
      initial={{ opacity: 0, y: 10, scale: 0.98 }}
      animate={{
        opacity: 1,
        y: 0,
        scale: isDragging ? 1.03 : 1,
        rotate: isDragging ? -2 : 0,
        boxShadow: isDragging ? "0 14px 30px rgba(0,0,0,.5)" : "0 0 0 rgba(0,0,0,0)",
      }}
      exit={{ opacity: 0, scale: 0.96, transition: { duration: 0.16 } }}
      transition={{ type: "spring", ...springs.snappy }}
      style={{ transform: CSS.Translate.toString(transform), transition, zIndex: isDragging ? 5 : undefined }}
      className={`flex min-h-[72px] items-center gap-3 rounded-phone-chip px-3.5 text-ink ${isDragging ? "bg-peach" : rowBg}`}
    >
      <button
        type="button"
        aria-label={`Drag ${props.item.name} to move`}
        className="flex h-[44px] w-[44px] cursor-grab touch-none items-center justify-center"
        {...attributes}
        {...listeners}
      >
        <IconDrag />
      </button>
      <span aria-hidden="true" className="tnum flex h-[30px] w-[30px] flex-none items-center justify-center rounded-full bg-ink font-display text-[14px] font-extrabold text-amber">
        {props.index + 1}
      </span>
      <span className="min-w-0 flex-1">
        <span className="block truncate font-bold text-[15px]">{props.item.name}</span>
        <span className="block text-[12px]">
          {props.pages != null ? `${props.pages} ${props.pages === 1 ? "page" : "pages"}` : "counting…"} · {formatBytes(props.item.size)}
        </span>
      </span>
      <span className="flex items-center gap-0.5">
        <button type="button" aria-label={`Move ${props.item.name} up`} className="hidden h-[44px] w-[44px] text-ink/70 hover:text-ink md:block" onClick={() => props.onMove(-1)}>
          ↑
        </button>
        <button type="button" aria-label={`Move ${props.item.name} down`} className="hidden h-[44px] w-[44px] text-ink/70 hover:text-ink md:block" onClick={() => props.onMove(1)}>
          ↓
        </button>
        <button
          type="button"
          aria-label={`Remove ${props.item.name}`}
          className="flex h-[44px] w-[44px] items-center justify-center rounded-[22px] bg-ink/10 text-ink"
          onClick={props.onRemove}
        >
          <IconClose width={16} height={16} />
        </button>
      </span>
    </motion.div>
  );
}
