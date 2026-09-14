#!/usr/bin/env node

import { execFileSync } from "node:child_process";
import { existsSync, mkdirSync, readFileSync, writeFileSync } from "node:fs";
import { dirname, extname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";

const root = resolve(dirname(fileURLToPath(import.meta.url)), "..");
const scratchRoot = resolve(root, ".scratch/theme-covers");
const sourceDir = join(scratchRoot, "source");
const compositionDir = join(scratchRoot, "compositions");
const outputDir = resolve(root, "theme/static/images/projects");
const magick = process.env.MAGICK_BIN ?? "magick";
const font = process.env.COVER_FONT ?? "/System/Library/Fonts/Menlo.ttc";
const quality = process.env.COVER_QUALITY ?? "80";

const sources = {
  piTools: process.env.PI_USAGE_SOURCE ?? "/Users/geoqiao/self_project/pi-tools/packages/pi-usage/docs/media/pi-usage-dashboard.png",
  paseoStuff: process.env.PASEO_ACTIVITY_SOURCE ?? "/Users/geoqiao/self_project/paseo-stuff/docs/images/agent-activity-spacing-dark.png",
  escapingCapture: process.env.ESCAPING_CAPTURE ?? join(sourceDir, "escaping-home-1440x1000.png"),
};

for (const directory of [sourceDir, compositionDir, outputDir]) {
  mkdirSync(directory, { recursive: true });
}

function failIfMissing(path, label) {
  if (!existsSync(path)) {
    throw new Error(`${label} is missing: ${path}`);
  }
}

function runMagick(args) {
  execFileSync(magick, args, { stdio: "inherit" });
}

function crop(input, output, geometry) {
  failIfMissing(input, "Source image");
  runMagick([input, "-crop", geometry, "+repage", output]);
}

function imageData(path) {
  const extension = extname(path).toLowerCase();
  const mime = extension === ".jpg" || extension === ".jpeg" ? "image/jpeg" : "image/png";
  return `data:${mime};base64,${readFileSync(path).toString("base64")}`;
}

function escapeXml(value) {
  return String(value)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&apos;");
}

function screenshotSvg(imagePath, background, border, preserveAspectRatio = "none") {
  const image = imageData(imagePath);
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" xmlns:xlink="http://www.w3.org/1999/xlink" width="1000" height="750" viewBox="0 0 1000 750">
  <defs>
    <filter id="shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="10" result="blur"/>
      <feOffset dy="8" result="offset"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.18"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
    <clipPath id="window-clip"><rect x="18" y="14" width="964" height="723" rx="20"/></clipPath>
  </defs>
  <rect width="1000" height="750" fill="${background}"/>
  <rect x="18" y="14" width="964" height="723" rx="20" fill="${background}" filter="url(#shadow)"/>
  <image x="18" y="14" width="964" height="723" preserveAspectRatio="${preserveAspectRatio}" href="${image}" xlink:href="${image}" clip-path="url(#window-clip)"/>
  <rect x="18.5" y="14.5" width="963" height="722" rx="20" fill="none" stroke="${border}" stroke-width="2"/>
</svg>
`;
}

function terminalText(x, y, text, fill = "#dce9df", size = 18, weight = "400") {
  return `<text x="${x}" y="${y}" fill="${fill}" font-family="SFMono-Regular, Menlo, Monaco, Consolas, monospace" font-size="${size}px" font-weight="${weight}">${escapeXml(text)}</text>`;
}

function terminalSvg() {
  const lines = [
    terminalText(80, 140, "$", "#91d99f", 21, "700") + terminalText(106, 140, "oh-my-share bars XNAS:AAPL", "#edf5ee", 19),
    terminalText(106, 172, "--start 2026-08-03 --end 2026-08-07", "#a9bdb0", 18),
    terminalText(80, 224, "{\"schema_version\":\"1.0\",\"status\":\"success\",", "#dbe9dc", 17),
    terminalText(106, 254, "\"artifact_path\":\"/Users/you/.oh-my-share/results/", "#c3d7c7", 17),
    terminalText(106, 284, "2026-08-09/<uuid>.json\",", "#c3d7c7", 17),
    terminalText(106, 314, "\"provider\":\"yfinance\",\"source\":\"yahoo\",", "#c3d7c7", 17),
    terminalText(106, 344, "\"record_count\":5,\"error\":null}", "#c3d7c7", 17),
    terminalText(80, 404, "$", "#91d99f", 21, "700") + terminalText(106, 404, "oh-my-share quote XNAS:AAPL", "#edf5ee", 18),
    terminalText(106, 432, "latest available price observation", "#7d9c88", 16),
    terminalText(80, 480, "$", "#91d99f", 21, "700") + terminalText(106, 480, "oh-my-share search Apple --market us", "#edf5ee", 18),
    terminalText(106, 508, "resolve listed equities", "#7d9c88", 16),
  ].join("\n  ");

  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" width="1000" height="750" viewBox="0 0 1000 750">
  <defs>
    <filter id="terminal-shadow" x="-10%" y="-10%" width="120%" height="130%">
      <feGaussianBlur in="SourceAlpha" stdDeviation="12" result="blur"/>
      <feOffset dy="10" result="offset"/>
      <feComponentTransfer><feFuncA type="linear" slope="0.24"/></feComponentTransfer>
      <feMerge><feMergeNode/><feMergeNode in="SourceGraphic"/></feMerge>
    </filter>
  </defs>
  <rect width="1000" height="750" fill="#e8e2d8"/>
  <rect x="42" y="36" width="916" height="678" rx="23" fill="#141a17" stroke="#334138" stroke-width="2" filter="url(#terminal-shadow)"/>
  <path d="M42 59a23 23 0 0 1 23-23h870a23 23 0 0 1 23 23v33H42Z" fill="#202a24"/>
  <path d="M42 92h916" stroke="#334138" stroke-width="2"/>
  <circle cx="74" cy="65" r="7" fill="#e88370"/>
  <circle cx="98" cy="65" r="7" fill="#d5b66a"/>
  <circle cx="122" cy="65" r="7" fill="#82c58f"/>
  ${terminalText(160, 71, "oh-my-share", "#d7e4d9", 17, "700")}
  ${terminalText(820, 71, "README / example", "#9cb0a0", 14)}
  ${lines}
  <path d="M80 552h840" stroke="#2f3c33"/>
  ${terminalText(80, 596, "one command, two outputs", "#dfeade", 18, "700")}
  ${terminalText(80, 624, "compact Receipt  →  Agent context", "#91d99f", 15)}
  ${terminalText(80, 650, "complete Artifact  →  local disk", "#91d99f", 15)}
  ${terminalText(678, 596, "PUBLIC DATA", "#d5b66a", 14, "700")}
  ${terminalText(678, 624, "local CLI", "#a9bdb0", 15)}
  ${terminalText(678, 650, "no service required", "#a9bdb0", 15)}
</svg>
`;
}

function render(name, svg) {
  const svgPath = join(compositionDir, `${name}.svg`);
  const outputPath = join(outputDir, `${name}.webp`);
  writeFileSync(svgPath, svg);
  runMagick([
    "-font",
    font,
    svgPath,
    "-strip",
    "-quality",
    quality,
    "-define",
    "webp:method=6",
    outputPath,
  ]);
  return outputPath;
}

const piCrop = join(sourceDir, "pi-usage-dashboard-top-4x3.png");
const escapingCrop = join(sourceDir, "escaping-home-4x3.png");

crop(sources.piTools, piCrop, "1440x1080+0+0");
crop(sources.escapingCapture, escapingCrop, "960x720+240+0");

const outputs = [
  render("pi-tools", screenshotSvg(piCrop, "#dfe8f0", "#c6d4df")),
  render("escaping", screenshotSvg(escapingCrop, "#eee9e2", "#d8d0c6")),
  render("oh-my-share", terminalSvg()),
  render("paseo-stuff", screenshotSvg(sources.paseoStuff, "#202522", "#39413d", "xMidYMid meet")),
];

for (const output of outputs) {
  console.log(output);
}
