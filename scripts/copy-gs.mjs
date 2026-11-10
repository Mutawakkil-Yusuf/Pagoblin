import { copyFileSync, mkdirSync } from "node:fs";

mkdirSync("public/gs", { recursive: true });
copyFileSync("node_modules/@jspawn/ghostscript-wasm/gs.wasm", "public/gs/gs.wasm");
copyFileSync("node_modules/@jspawn/ghostscript-wasm/gs.js", "public/gs/gs.js");
console.log("[copy-gs] ok");
