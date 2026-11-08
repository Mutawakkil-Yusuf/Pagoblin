// Idempotent patch for the @vercel/nft compiler inside Next.js.
//
// On Android/qroot kernels, /proc/<pid> entries can be self-referential
// symlinks (/proc/1493 -> 1493). Next's build-trace collection (nft) follows
// those links and crashes with "Recursive symlink detected resolving /proc/*"
// during "Collecting build traces". The fix: never follow symlinks under
// /proc when computing realpaths. /proc paths are never bundled anyway.
import { existsSync, readFileSync, writeFileSync } from "node:fs";

const file = "node_modules/next/dist/compiled/@vercel/nft/index.js";
// nft is also vendored standalone in some Next versions.
const file2 = "node_modules/@vercel/nft/dist/realpath.js";

const guard = 'e.indexOf("/proc/")===0||e==="/proc"||(r.has(e)';

let patched = 0;
for (const f of [file, file2]) {
  if (!existsSync(f)) continue;
  const src = readFileSync(f, "utf8");
  if (src.includes('Recursion symbol "/proc/" guard') || src.includes(guard)) {
    patched++;
    continue;
  }
  const needle = 'if(r.has(e))throw new Error("Recursive symlink detected resolving "+e);';
  if (!src.includes(needle)) continue;
  const next = src.replace(needle, `if(e.indexOf("/proc/")===0||e==="/proc")return e;/* /proc/ guard: android self-symlinks (scripts/patch-nft.mjs) */` + needle);
  writeFileSync(f, next);
  patched++;
  console.log(`[patch-nft] guarded ${f}`);
}
if (!patched) console.log("[patch-nft] nothing to patch (already applied or files missing)");
