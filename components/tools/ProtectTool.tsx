"use client";

/**
 * Protect / unlock: qpdf runs in a local worker. Locking adds AES-256 encryption
 * with an open password and permission flags; unlocking removes the password
 * from a file you can already open. Passwords never leave the device.
 */
import { useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { motion } from "motion/react";
import { DropZone } from "@/components/ui/DropZone";
import { Button, Chip } from "@/components/ui/core";
import { BusyCard, FileHead, StickyAction, ToolCard, ToolNote } from "@/components/tools/ToolParts";
import { useToolFiles } from "@/lib/store/docs";
import { useDoneStore } from "@/lib/store/done";
import { EngineError, runProtect, runUnlock, readPageCount, CancelledError } from "@/lib/engine/client";
import type { ProtectPermissions } from "@/lib/engine/types";
import { fileErrors, type FileItem } from "@/lib/files";
import { formatBytes, pluralPages } from "@/lib/format";
import { calmError } from "@/lib/errors";
import { toast } from "@/lib/store/toasts";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

type Mode = "protect" | "unlock";

const PERMISSIONS: { key: keyof ProtectPermissions; label: string; hint: string }[] = [
  { key: "print", label: "Printing", hint: "Let the file be printed" },
  { key: "copy", label: "Copying text", hint: "Let text and images be copied" },
  { key: "modify", label: "Editing", hint: "Let pages be changed" },
  { key: "annotate", label: "Annotating", hint: "Let comments be added" },
];

export function ProtectTool() {
  const router = useRouter();
  const files = useToolFiles((s) => s.files.protect);
  const add = useToolFiles((s) => s.add);
  const clear = useToolFiles((s) => s.clear);
  const setResult = useDoneStore((s) => s.setResult);

  const [mode, setMode] = useState<Mode>("protect");
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [owner, setOwner] = useState("");
  const [show, setShow] = useState(false);
  const [permissions, setPermissions] = useState<ProtectPermissions>({
    print: true,
    copy: true,
    modify: false,
    annotate: true,
  });
  const [busy, setBusy] = useState(false);
  const [progress, setProgress] = useState(0);
  const [label, setLabel] = useState("");
  const controllerRef = useRef<AbortController | null>(null);

  const item: FileItem | undefined = files[0];

  const switchMode = (next: Mode) => {
    setMode(next);
    setPassword("");
    setConfirm("");
    setOwner("");
  };

  const addFile = async (incoming: FileItem[]) => {
    clear("protect");
    const first = incoming[0];
    if (!first) return;
    try {
      const info = await readPageCount(first.file);
      if (info.encrypted) {
        // An encrypted file can still be unlocked; protect needs it open first.
        if (mode === "protect") {
          toast.error("This PDF is locked. Switch to Unlock and enter its password first.");
          return;
        }
      }
      if (!info.pageCount && !info.encrypted) {
        toast.error(fileErrors.unopenable);
        return;
      }
      add("protect", [{ ...first, pageCount: info.pageCount ?? undefined }]);
      sound.play("gulp");
      haptic("success");
    } catch {
      toast.error(fileErrors.unopenable);
    }
  };

  const run = async () => {
    if (!item) return;
    if (mode === "protect") {
      if (password.length < 4) {
        toast.error("Use a password with at least 4 characters.");
        return;
      }
      if (password !== confirm) {
        toast.error("The two passwords do not match.");
        return;
      }
      if (owner.length > 0 && owner.length < 4) {
        toast.error("Use an owner password with at least 4 characters, or leave it blank.");
        return;
      }
    } else if (!password) {
      toast.error("Enter the password that opens this PDF.");
      return;
    }
    const controller = new AbortController();
    controllerRef.current = controller;
    setBusy(true);
    setProgress(0);
    setLabel(mode === "protect" ? "Locking" : "Unlocking");
    sound.startLoop("chew");
    haptic("tap");
    try {
      const stem = item.name.replace(/\.pdf$/i, "");
      const out =
        mode === "protect"
          ? await runProtect(
              {
                file: item.file,
                userPassword: password,
                ownerPassword: owner || password,
                keyLength: 256,
                permissions,
              },
              {
                signal: controller.signal,
                onProgress: (p, l) => {
                  setProgress(p);
                  if (l) setLabel(l);
                },
              },
            )
          : await runUnlock(
              { file: item.file, password },
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
      const locked = mode === "protect";
      setResult({
        id: `${locked ? "protect" : "unlock"}-${Date.now()}`,
        tool: locked ? "protect" : "unlock",
        headline: locked ? "Locked!" : "Unlocked!",
        sentence: locked
          ? `${item.name} now needs a password to open. Keep it somewhere safe — there is no recovery.`
          : `${item.name} opens without a password now. The content was not changed.`,
        beforeAfter: { before: item.size, after: out.blob.size, pages: item.pageCount },
        outputs: [{ blob: out.blob, name: `${stem}-${locked ? "locked" : "unlocked"}.pdf` }],
        at: Date.now(),
      });
      clear("protect");
      router.push("/done");
    } catch (e) {
      sound.stopLoop("chew");
      sound.play("error");
      haptic("error");
      if (e instanceof CancelledError) return;
      if (mode === "unlock" && e instanceof EngineError && e.code === "password") {
        toast.error("That password did not open this PDF. Check it and try again.");
        return;
      }
      toast.error(calmError(e, mode === "protect" ? "Could not lock this PDF. Try again." : "Could not unlock this PDF. Check the password and try again."));
    } finally {
      setBusy(false);
      controllerRef.current = null;
    }
  };

  const canRun =
    !!item && !busy && (mode === "protect" ? password.length >= 4 && password === confirm : password.length > 0);

  return (
    <section aria-label="Protect or unlock a PDF" className="mt-8 flex flex-col gap-4">
      <div className="flex gap-2" role="tablist" aria-label="Security action">
        {(["protect", "unlock"] as const).map((m) => (
          <Chip
            key={m}
            label={m === "protect" ? "Lock with password" : "Remove password"}
            selected={mode === m}
            onClick={() => switchMode(m)}
          />
        ))}
      </div>

      {!item ? (
        <DropZone
          accept={["pdf"]}
          label="Add a PDF"
          hint={
            mode === "protect"
              ? "Drop the PDF you want to lock. It never leaves this device."
              : "Drop a PDF you can already open, then enter its password."
          }
          onFiles={(i) => void addFile(i)}
        />
      ) : (
        <>
          <FileHead
            name={item.name}
            meta={`${item.pageCount ? pluralPages(item.pageCount) : "PDF"} · ${formatBytes(item.size)}`}
            onRemove={() => {
              clear("protect");
              setPassword("");
              setConfirm("");
              setOwner("");
            }}
          />

          <ToolCard>
            <h2 className="font-display text-h3 font-extrabold">
              {mode === "protect" ? "Choose a password" : "Enter the current password"}
            </h2>
            <p className="mt-1 text-body text-muted">
              {mode === "protect"
                ? "Anyone opening the file will need this password. Keep it safe: there is no reset."
                : "Pip removes the password from your copy. The original stays as it is."}
            </p>

            <div className="mt-4 flex flex-col gap-3">
              <label className="flex flex-col gap-1.5 text-[13px] font-bold text-cream">
                {mode === "protect" ? "Open password" : "Current password"}
                <input
                  type={show ? "text" : "password"}
                  autoComplete={mode === "protect" ? "new-password" : "current-password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="min-h-[48px] w-full rounded-card border-2 border-line bg-cream px-4 py-3 text-[15px] font-normal text-ink outline-none focus:border-amber"
                  placeholder={mode === "protect" ? "At least 4 characters" : "The password you use now"}
                />
              </label>
              {mode === "protect" ? (
                <>
                  <label className="flex flex-col gap-1.5 text-[13px] font-bold text-cream">
                    Repeat password
                    <input
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      value={confirm}
                      onChange={(e) => setConfirm(e.target.value)}
                      className="min-h-[48px] w-full rounded-card border-2 border-line bg-cream px-4 py-3 text-[15px] font-normal text-ink outline-none focus:border-amber"
                      placeholder="Same password again"
                    />
                  </label>
                  <label className="flex flex-col gap-1.5 text-[13px] font-bold text-cream">
                    Owner password (optional)
                    <input
                      type={show ? "text" : "password"}
                      autoComplete="new-password"
                      value={owner}
                      onChange={(e) => setOwner(e.target.value)}
                      className="min-h-[48px] w-full rounded-card border-2 border-line bg-cream px-4 py-3 text-[15px] font-normal text-ink outline-none focus:border-amber"
                      placeholder="Leave blank to use the open password"
                    />
                    <span className="text-[11px] font-normal leading-4 text-muted">
                      Controls the permission checkboxes. Share only the open password if you want those limits to
                      apply.
                    </span>
                  </label>
                </>
              ) : null}
              <label className="flex min-h-[44px] cursor-pointer items-center gap-2 text-small text-muted">
                <input
                  type="checkbox"
                  checked={show}
                  onChange={(e) => setShow(e.target.checked)}
                  className="h-[20px] w-[20px] accent-orange"
                />
                Show password
              </label>
            </div>

            {mode === "protect" ? (
              <fieldset className="mt-4">
                <legend className="text-[13px] font-bold text-cream">What people can do without the owner password</legend>
                <div className="mt-2 grid grid-cols-1 gap-2 sm:grid-cols-2">
                  {PERMISSIONS.map((p) => (
                    <label
                      key={p.key}
                      className="flex min-h-[52px] cursor-pointer items-start gap-2 rounded-phone-chip bg-ink/50 px-3 py-2.5"
                    >
                      <input
                        type="checkbox"
                        checked={permissions[p.key]}
                        onChange={(e) => setPermissions((prev) => ({ ...prev, [p.key]: e.target.checked }))}
                        className="mt-0.5 h-[20px] w-[20px] shrink-0 accent-orange"
                      />
                      <span>
                        <span className="block text-[14px] font-bold text-cream">{p.label}</span>
                        <span className="block text-[11px] text-muted">{p.hint}</span>
                      </span>
                    </label>
                  ))}
                </div>
              </fieldset>
            ) : null}

            <ToolNote className="mt-4">
              {mode === "protect"
                ? "AES-256 encryption, handled by qpdf on this device. No password or file is sent anywhere. If you leave the owner password blank, the open password also controls permissions."
                : "Removing a password only works if you know it. Pagoblin cannot crack or guess passwords."}
            </ToolNote>
          </ToolCard>

          {busy ? (
            <BusyCard progress={progress} label={label || (mode === "protect" ? "Locking…" : "Unlocking…")} onCancel={() => controllerRef.current?.abort()} />
          ) : null}

          <StickyAction>
            <Button disabled={!canRun} className="w-full" size="lg" onClick={() => void run()} aria-busy={busy}>
              {busy
                ? `${mode === "protect" ? "Locking" : "Unlocking"}… ${Math.round(progress * 100)}%`
                : mode === "protect"
                  ? "Lock and download"
                  : "Unlock and download"}
            </Button>
          </StickyAction>
        </>
      )}
    </section>
  );
}
