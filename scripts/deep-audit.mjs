import { readFile } from "node:fs/promises";
import { transform } from "esbuild";

const files = [
  ["src/data.js", "js"],
  ["src/App.jsx", "jsx"],
  ["src/BibleAIView.jsx", "jsx"],
  ["src/main.jsx", "jsx"],
  ["legacy-app.js", "jsx"]
];

const failures = [];
for (const [file, loader] of files) {
  const source = await readFile(file, "utf8");
  try {
    await transform(source, { loader, format: "esm", target: "es2020", sourcefile: file });
    console.log("syntax ok:", file, source.split(/\r?\n/).length, "lines");
  } catch (error) {
    failures.push(file + ": " + (error?.message || error));
  }
}

const data = await readFile("src/data.js", "utf8");
const expected = Number((await readFile("scripts/audit-features.mjs", "utf8")).match(/const expected = (\d+)/)?.[1] || 0);
const groups = [...data.matchAll(/\{group:"([^"]+)",items:\[([\s\S]*?)\]\}/g)];
const tracked = groups.reduce((sum, match) => sum + [...match[2].matchAll(/"((?:[^"\\]|\\.)*)"/g)].length, 0);
if (tracked !== expected) failures.push(`feature manifest mismatch: expected ${expected}, got ${tracked}`);

const index = await readFile("index.html", "utf8");
for (const required of [
  'id="root"',
  'fetch("./legacy-app.js"',
  'Babel.transform',
  'import("./src/main.jsx").catch',
  'href="./src/styles.css"'
]) {
  if (!index.includes(required)) failures.push("index.html missing " + required);
}

const legacy = await readFile("legacy-app.js", "utf8");
if (/^\s*import\b/m.test(legacy)) failures.push("legacy-app.js contains an ES module import");
if (/^\s*export\b/m.test(legacy)) failures.push("legacy-app.js contains an ES module export");
if (!legacy.includes("ReactDOM.createRoot")) failures.push("legacy-app.js has no React boot call");
if (!legacy.includes("const { useEffect, useMemo, useRef, useState } = React;")) {
  failures.push("legacy-app.js is missing React hook bindings required by its import-free fallback build");
}

if (failures.length) {
  console.error(failures.join("\n"));
  process.exit(1);
}
console.log("Deep static audit passed.");
console.log("Tracked feature entries:", tracked);
