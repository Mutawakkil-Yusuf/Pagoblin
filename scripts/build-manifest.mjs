/**
 * Write public/build-manifest.json.
 *
 * The manifest lets anyone compare the source they can read with the app they
 * are using. It contains:
 *   - the git commit, when the build has one
 *   - a SHA-256 over every tracked source file, in sorted path order
 *   - the SHA-256 of the generated service worker, when it exists
 *
 * The source hash is deterministic: two builds from the same commit produce
 * the same hash. The service-worker hash identifies the exact shipped worker
 * and changes when the build changes.
 *
 * Runs from predev, prebuild and postbuild. It never fails a build: a missing
 * manifest is reported by /proof instead of breaking the app.
 */
import { createHash } from "node:crypto";
import { execFileSync } from "node:child_process";
import { existsSync, readFileSync, readdirSync, statSync, writeFileSync, mkdirSync } from "node:fs";
import path from "node:path";

const root = process.cwd();
const outDir = path.join(root, "public");
const outFile = path.join(outDir, "build-manifest.json");

const SOURCE_ROOTS = ["app", "components", "lib", "scripts", "tests", "types"];
const SOURCE_FILES = [
  "next.config.ts",
  "package.json",
  "package-lock.json",
  "tsconfig.json",
  "tailwind.config.js",
  "postcss.config.js",
  "vitest.config.ts",
  "playwright.config.ts",
  "README.md",
  "DECISIONS.md",
  "FIXES.md",
  ".gitignore",
  // Hand-written classic workers; the generated sw.js is hashed separately.
  "public/gs-worker.js",
  "public/qpdf-worker.js",
];

function sha256(bytes) {
  return createHash("sha256").update(bytes).digest("hex");
}

function git(args) {
  try {
    return execFileSync("git", args, { cwd: root, encoding: "utf8", stdio: ["ignore", "pipe", "ignore"] }).trim();
  } catch {
    return "";
  }
}

function walk(dir) {
  const out = [];
  let entries;
  try {
    entries = readdirSync(dir, { withFileTypes: true });
  } catch {
    return out;
  }
  for (const entry of entries) {
    if (entry.name === "node_modules" || entry.name === ".next" || entry.name === ".git") continue;
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walk(full));
    else if (entry.isFile()) out.push(full);
  }
  return out;
}

function sourceFiles() {
  const tracked = git(["ls-files", "-z"])
    .split("\0")
    .filter(Boolean)
    .map((p) => p.split(path.sep).join("/"));

  if (tracked.length) {
    return tracked
      .filter((p) => SOURCE_ROOTS.some((r) => p.startsWith(`${r}/`)) || SOURCE_FILES.includes(p))
      .sort();
  }

  // Deployed builds may not include .git. Walk the same roots instead so the
  // manifest still has a stable, documented definition.
  const found = [];
  for (const rel of SOURCE_ROOTS) {
    for (const full of walk(path.join(root, rel))) {
      found.push(path.relative(root, full).split(path.sep).join("/"));
    }
  }
  for (const rel of SOURCE_FILES) {
    if (existsSync(path.join(root, rel))) found.push(rel);
  }
  return [...new Set(found)].sort();
}

function main() {
  const files = sourceFiles();
  const hash = createHash("sha256");
  let hashed = 0;
  for (const rel of files) {
    const full = path.join(root, rel);
    let bytes;
    try {
      bytes = readFileSync(full);
    } catch {
      continue;
    }
    hash.update(rel);
    hash.update("\0");
    hash.update(bytes);
    hash.update("\0");
    hashed += 1;
  }

  const commit = git(["rev-parse", "HEAD"]);
  const swPath = path.join(outDir, "sw.js");
  let serviceWorkerHash = null;
  try {
    serviceWorkerHash = existsSync(swPath) ? sha256(readFileSync(swPath)) : null;
  } catch {
    serviceWorkerHash = null;
  }

  const manifest = {
    version: 1,
    commit: commit || null,
    commitShort: commit ? commit.slice(0, 7) : null,
    sourceHash: hash.digest("hex"),
    sourceFiles: hashed,
    serviceWorkerHash,
    definition: "SHA-256 over sorted tracked source paths and bytes; see scripts/build-manifest.mjs",
  };

  mkdirSync(outDir, { recursive: true });
  writeFileSync(outFile, `${JSON.stringify(manifest, null, 2)}\n`, "utf8");
  console.log(
    `[build-manifest] ${manifest.sourceHash.slice(0, 12)}… from ${hashed} source files` +
      (manifest.commitShort ? ` at ${manifest.commitShort}` : ""),
  );
}

main();
