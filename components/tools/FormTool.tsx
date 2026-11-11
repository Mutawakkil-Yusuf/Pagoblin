"use client";

/**
 * Form fill: read AcroForm fields on the device, fill text, checkboxes, radios,
 * dropdowns and option lists, then optionally flatten so the answers are part
 * of the page. XFA-only forms are called out instead of silently doing nothing.
 */
import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { DropZone } from "@/components/ui/DropZone";
import { Button } from "@/components/ui/core";
import { BusyCard, FileHead, StickyAction, ToolCard, ToolNote } from "@/components/tools/ToolParts";
import { useToolFiles } from "@/lib/store/docs";
import { useDoneStore } from "@/lib/store/done";
import { runFormFill, runFormInspect, readPageCount, CancelledError } from "@/lib/engine/client";
import type { FormFieldInfo, FormInspectOutput } from "@/lib/engine/types";
import { fileErrors, type FileItem } from "@/lib/files";
import { formatBytes, pluralPages } from "@/lib/format";
import { calmError } from "@/lib/errors";
import { toast } from "@/lib/store/toasts";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

type FieldValue = string | boolean | string[];

const TYPE_LABEL: Record<FormFieldInfo["type"], string> = {
  text: "Text",
  checkbox: "Checkbox",
  radio: "Choice",
  dropdown: "Dropdown",
  optionlist: "List",
  button: "Button",
  signature: "Signature",
  unknown: "Field",
};

function initialValues(fields: FormFieldInfo[]): Record<string, FieldValue> {
  const out: Record<string, FieldValue> = {};
  for (const f of fields) out[f.name] = f.value;
  return out;
}

export function FormTool() {
  const router = useRouter();
  const files = useToolFiles((s) => s.files.form);
  const add = useToolFiles((s) => s.add);
  const clear = useToolFiles((s) => s.clear);
  const setResult = useDoneStore((s) => s.setResult);

  const [info, setInfo] = useState<FormInspectOutput | null>(null);
  const [values, setValues] = useState<Record<string, FieldValue>>({});
  const [flatten, setFlatten] = useState(true);
  const [reading, setReading] = useState(false);
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  const item: FileItem | undefined = files[0];

  useEffect(() => {
    if (!item) {
      setInfo(null);
      setValues({});
      return;
    }
    let alive = true;
    setReading(true);
    void (async () => {
      try {
        const count = await readPageCount(item.file);
        if (count.encrypted) {
          toast.error(fileErrors.password);
          clear("form");
          return;
        }
        const out = await runFormInspect({ file: item.file });
        if (!alive) return;
        setInfo(out);
        setValues(initialValues(out.fields));
        sound.play("pop");
      } catch (e) {
        if (!alive) return;
        toast.error(calmError(e, fileErrors.unopenable));
        clear("form");
      } finally {
        if (alive) setReading(false);
      }
    })();
    return () => {
      alive = false;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [item?.id]);

  const setValue = (name: string, value: FieldValue) => {
    setValues((prev) => ({ ...prev, [name]: value }));
  };

  const fillable = info?.fields.filter((f) => !f.readOnly && f.type !== "button" && f.type !== "signature" && f.type !== "unknown") ?? [];

  const run = async () => {
    if (!item || !info) return;
    if (!info.fields.length || !fillable.length) return;
    const fillValues = Object.fromEntries(fillable.map((field) => [field.name, values[field.name]]));
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setProgress(0);
    setLabel("Filling");
    sound.startLoop("chew");
    haptic("tap");
    try {
      const out = await runFormFill(
        { file: item.file, values: fillValues, flatten },
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
      const stem = item.name.replace(/\.pdf$/i, "");
      setResult({
        id: `form-${Date.now()}`,
        tool: "form",
        headline: "Form filled!",
        sentence: `${item.name}: ${out.filled} ${out.filled === 1 ? "field" : "fields"} filled${
          flatten ? ", then flattened into the page" : ""
        }.${out.skipped.length ? ` ${out.skipped.length} could not be filled.` : ""}`,
        beforeAfter: { before: item.size, after: out.blob.size, pages: info.pageCount },
        outputs: [{ blob: out.blob, name: `${stem}-filled.pdf` }],
        at: Date.now(),
      });
      clear("form");
      router.push("/done");
    } catch (e) {
      sound.stopLoop("chew");
      sound.play("error");
      haptic("error");
      if (e instanceof CancelledError) return;
      toast.error(calmError(e, "Could not fill this form. Some forms use XFA, which is not supported."));
    } finally {
      setBusy(false);
      controllerRef.current = null;
    }
  };

  return (
    <section aria-label="Fill a PDF form" className="mt-8 flex flex-col gap-4">
      {!item ? (
        <DropZone
          accept={["pdf"]}
          label="Add a form"
          hint="Fill the fields in your browser, then flatten or keep them editable."
          onFiles={(i) => {
            clear("form");
            add("form", i.slice(0, 1));
          }}
        />
      ) : (
        <>
          <FileHead
            name={item.name}
            meta={`${info ? pluralPages(info.pageCount) : reading ? "reading…" : "PDF"} · ${formatBytes(item.size)}`}
            onRemove={() => clear("form")}
          />

          {reading || !info ? (
            <BusyCard progress={0.4} label="Looking for form fields…" />
          ) : (
            <>
              {info.hasXfa ? (
                <div className="rounded-card-l border-2 border-amber bg-amber/10 p-4">
                  <p className="font-display text-h4 font-extrabold text-cream">This form uses XFA</p>
                  <p className="mt-1 text-small text-muted">
                    XFA is an older Adobe form format. The fields may not be readable here. If the list below is empty,
                    ask the sender for an AcroForm or a flat PDF.
                  </p>
                </div>
              ) : null}

              {info.fields.length === 0 ? (
                <ToolCard>
                  <p className="font-display text-h3 font-extrabold">No fillable fields</p>
                  <p className="mt-1 text-body text-muted">
                    This PDF has no AcroForm fields. It may be a scan, a flat form, or an XFA-only form.
                  </p>
                </ToolCard>
              ) : (
                <ToolCard>
                  <div className="flex flex-wrap items-baseline justify-between gap-2">
                    <h2 className="font-display text-h3 font-extrabold">
                      {info.fields.length} {info.fields.length === 1 ? "field" : "fields"}
                    </h2>
                    <span className="text-small text-muted">{fillable.length} editable</span>
                  </div>
                  {fillable.length === 0 ? (
                    <p className="mt-2 text-small text-muted">
                      Every field here is read-only or a kind this tool cannot fill. The PDF stays untouched.
                    </p>
                  ) : null}
                  <div className="mt-3 flex flex-col gap-3">
                    {info.fields.map((field, index) => {
                      const id = `form-field-${index}`;
                      const disabled = field.readOnly || field.type === "button" || field.type === "signature" || field.type === "unknown";
                      const value = values[field.name];
                      return (
                        <div key={field.name} className="rounded-phone-chip bg-ink/40 px-3.5 py-3">
                          <div className="flex flex-wrap items-baseline justify-between gap-2">
                            <label htmlFor={id} className="text-[13px] font-bold text-cream">
                              {field.name}
                            </label>
                            <span className="rounded-pill bg-line/60 px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide text-muted">
                              {TYPE_LABEL[field.type]}
                              {field.readOnly ? " · read only" : ""}
                            </span>
                          </div>

                          {field.type === "text" ? (
                            <input
                              id={id}
                              value={typeof value === "string" ? value : ""}
                              disabled={disabled}
                              onChange={(e) => setValue(field.name, e.target.value)}
                              className="mt-2 min-h-[44px] w-full rounded-card border-2 border-line bg-cream px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-amber disabled:opacity-60"
                              placeholder="Type here"
                            />
                          ) : field.type === "checkbox" ? (
                            <label htmlFor={id} className="mt-2 flex min-h-[44px] cursor-pointer items-center gap-2 text-[14px] text-cream">
                              <input
                                id={id}
                                type="checkbox"
                                checked={value === true}
                                disabled={disabled}
                                onChange={(e) => setValue(field.name, e.target.checked)}
                                className="h-[22px] w-[22px] accent-orange"
                              />
                              {value === true ? "Checked" : "Not checked"}
                            </label>
                          ) : field.type === "radio" || field.type === "dropdown" || field.type === "optionlist" ? (
                            <select
                              id={id}
                              value={Array.isArray(value) ? (value[0] ?? "") : typeof value === "string" ? value : ""}
                              disabled={disabled}
                              onChange={(e) => setValue(field.name, e.target.value)}
                              className="mt-2 min-h-[44px] w-full rounded-card border-2 border-line bg-cream px-3.5 py-2.5 text-[14px] text-ink outline-none focus:border-amber disabled:opacity-60"
                            >
                              <option value="">Choose…</option>
                              {(field.options ?? []).map((option) => (
                                <option key={option} value={option}>
                                  {option}
                                </option>
                              ))}
                            </select>
                          ) : (
                            <p className="mt-2 text-small text-muted">
                              This kind of field cannot be filled here. It stays untouched.
                            </p>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <label className="mt-4 flex min-h-[44px] cursor-pointer items-start gap-2 rounded-phone-chip bg-ink/40 px-3.5 py-3">
                    <input
                      type="checkbox"
                      checked={flatten}
                      onChange={(e) => setFlatten(e.target.checked)}
                      className="mt-0.5 h-[20px] w-[20px] shrink-0 accent-orange"
                    />
                    <span>
                      <span className="block text-[14px] font-bold text-cream">Flatten after filling</span>
                      <span className="block text-[11px] text-muted">
                        Answers become part of the page. Recommended for sending. Leave off to keep fields editable.
                      </span>
                    </span>
                  </label>

                  <ToolNote className="mt-4">
                    Fields are read and filled on this device. Flattening cannot be undone in the downloaded copy.
                  </ToolNote>
                </ToolCard>
              )}

              {busy ? (
                <BusyCard progress={progress} label={label || "Filling…"} onCancel={() => controllerRef.current?.abort()} />
              ) : null}

              {info.fields.length > 0 ? (
                <StickyAction>
                  <Button
                    disabled={busy || fillable.length === 0}
                    className="w-full"
                    size="lg"
                    onClick={() => void run()}
                    aria-busy={busy}
                  >
                    {busy
                      ? `Filling… ${Math.round(progress * 100)}%`
                      : fillable.length === 0
                        ? "No editable fields"
                        : flatten
                          ? "Fill, flatten and download"
                          : "Fill and download"}
                  </Button>
                </StickyAction>
              ) : null}
            </>
          )}
        </>
      )}
    </section>
  );
}
