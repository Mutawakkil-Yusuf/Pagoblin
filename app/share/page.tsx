"use client";

/**
 * Share-target landing page. When the OS sends files here (POST intercepted by
 * the service worker), they rest in the Cache API. This page picks them up,
 * clears the cache, and routes to the right tool. Nothing else ever sees them.
 */
import { useEffect, useRef } from "react";
import { useRouter } from "next/navigation";
import { Pip } from "@/components/pip/Pip";
import { makeFileItems, type FileItem } from "@/lib/files";
import { useToolFiles } from "@/lib/store/docs";
import { sound } from "@/lib/sound";
import { haptic } from "@/lib/haptics";

export default function ShareIngest() {
  const router = useRouter();
  const add = useToolFiles((s) => s.add);
  const ran = useRef(false);

  useEffect(() => {
    if (ran.current) return;
    ran.current = true;
    void (async () => {
      let items: FileItem[] = [];
      try {
        const cache = await caches.open("share-target");
        const listRes = await cache.match("/shared/_list");
        const meta: { key: string; name: string }[] = listRes ? await listRes.json() : [];
        const files: File[] = [];
        for (const m of meta) {
          const res = await cache.match(m.key);
          if (res) {
            const blob = await res.blob();
            files.push(new File([blob], m.name || `shared-${m.key}.pdf`, { type: blob.type || "application/pdf" }));
          }
        }
        await cache.delete("/shared/_list");
        await Promise.all(meta.map((m) => cache.delete(m.key)));
        if (files.length) {
          const given = await makeFileItems(files, { accept: ["pdf"], toolLabel: "share" });
          items = given.items;
        }
      } catch {
        /* no shared files */
      }

      if (items.length) {
        add("share", items);
        sound.play("gulp");
        haptic("success");
        router.replace(items.length > 1 ? `/merge-pdf?shared=${items.length}` : `/compress-pdf?shared=1`);
      } else {
        router.replace("/app");
      }
    })();
  }, [add, router]);

  return (
    <div className="flex min-h-dvh flex-col items-center justify-center gap-4">
      <Pip mood="chewing" size={140} />
      <p className="text-body text-muted" role="status">
        Pip is picking up the shared files…
      </p>
    </div>
  );
}
