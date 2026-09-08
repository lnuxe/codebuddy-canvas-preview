#!/usr/bin/env node
const fs = require("fs");
const os = require("os");
const path = require("path");
const { compileCanvas, previewHtml } = require("./compile");

async function main() {
  const file = process.argv[2];
  if (!file) {
    console.error("Usage: node cli.js <file.canvas.tsx>");
    process.exit(1);
  }
  const abs = path.resolve(file);
  const js = await compileCanvas(abs);
  const dir = path.join(os.tmpdir(), "codebuddy-canvas-preview");
  fs.mkdirSync(dir, { recursive: true });
  const base = path.basename(abs, ".tsx");
  const jsPath = path.join(dir, base + ".preview.js");
  const htmlPath = path.join(dir, base + ".preview.html");
  fs.writeFileSync(jsPath, js, "utf8");
  fs.writeFileSync(htmlPath, previewHtml("./" + path.basename(jsPath), "dark"), "utf8");
  console.log(htmlPath);
}

main().catch((err) => {
  console.error(err.errors ? err.errors : err);
  process.exit(1);
});
