import { readFile } from "node:fs/promises";
import { resolve } from "node:path";
import { Resvg } from "@resvg/resvg-js";
import satori from "satori";
import subsetFont from "subset-font";
import { site } from "./config";
import type { Post } from "./content";
import { ogSize } from "./og-card";

const tagline = "AI workflows & small tools";
const host = new URL(site.url).hostname;
const fontsRoot = resolve("node_modules/@fontsource/noto-serif-sc/files");
const ink = "#242220";
const muted = "#6b6863";

type Fonts = NonNullable<Parameters<typeof satori>[1]["fonts"]>;

// All cards from an export use one local font subset, converted to the SFNT
// format Satori accepts. Reuse the parsed font across renders as well.
export async function loadOgAssets(titles: string[]) {
  const glyphs = [...new Set(titles.join("") + site.author + tagline + host + "…")].join("");
  const fonts: Fonts = await Promise.all(["latin", "latin-ext", "chinese-simplified"].map(async (script) => {
    const bytes = await readFile(resolve(fontsRoot, `noto-serif-sc-${script}-600-normal.woff2`));
    return { name: script, data: await subsetFont(bytes, glyphs, { targetFormat: "sfnt" }), weight: 600 };
  }));
  return { fonts };
}

type OgAssets = Awaited<ReturnType<typeof loadOgAssets>>;
type OgNode = Parameters<typeof satori>[0];
const node = (type: string, props: Record<string, unknown>, ...children: (OgNode | string)[]): OgNode => ({
  type,
  props: { ...props, children },
} as OgNode);

const signature = node("svg", { width: 67, height: 58, viewBox: "0 0 256 224", fill: "none" },
  node("path", {
    d: "M160 84C190 63 204 37 187 26C167 13 105 36 65 74C22 112 18 160 46 177C74 195 132 178 173 151C193 137 182 113 159 112C147 111 134 116 123 120M177 171C173 185 185 188 197 182C211 175 216 158 209 146C201 133 182 137 179 151C175 163 178 175 185 180",
    stroke: "#a72f6a", strokeWidth: 13, strokeLinecap: "round", strokeLinejoin: "round",
  }),
  node("path", { d: "M202 185Q214 193 224 194", stroke: "#4faf90", strokeWidth: 8, strokeLinecap: "round" }),
);

function titleSize(title: string) {
  // CJK characters normally take a full em; a Latin letter is nearer half an em.
  const em = [...title].reduce((width, glyph) => width + (/^[\u0000-\u00ff]$/.test(glyph) ? .55 : 1), 0);
  return em <= 15 ? 60 : em <= 28 ? 54 : 48;
}

export async function renderOgImage({ title }: Pick<Post, "title">, { fonts }: OgAssets) {
  const layout = node("div", {
    style: {
      boxSizing: "border-box", width: ogSize.width, height: ogSize.height, display: "flex", padding: 34,
      backgroundImage: "linear-gradient(135deg, #f2c6d9 0%, #dcd4f5 52%, #cbe6dc 100%)",
      fontFamily: "latin, latin-ext, chinese-simplified", fontWeight: 600, color: ink,
    },
  }, node("div", {
    style: {
      boxSizing: "border-box", width: ogSize.width - 68, height: ogSize.height - 68,
      display: "flex", flexDirection: "column", justifyContent: "space-between",
      backgroundColor: "#fff", borderRadius: 20, boxShadow: "0 8px 24px #65517122", padding: "52px 60px",
    },
  },
  node("div", {
    style: { display: "flex", width: "100%", fontSize: titleSize(title), lineHeight: 1.32, lineClamp: 3, wordBreak: "break-word" },
  }, title),
  node("div", { style: { display: "flex", alignItems: "center", justifyContent: "space-between" } },
    node("div", { style: { display: "flex", flexDirection: "column", lineHeight: 1.2, gap: 5 } },
      node("div", { style: { fontSize: 30 } }, site.author),
      node("div", { style: { fontSize: 19, color: muted } }, tagline),
    ),
    node("div", { style: { display: "flex", alignItems: "center", gap: 6, color: "#a72f6a", fontSize: 25 } },
      signature,
      host,
    ),
  )));
  const svg = await satori(layout, { ...ogSize, fonts });
  return new Resvg(svg, { font: { loadSystemFonts: false } }).render().asPng();
}
