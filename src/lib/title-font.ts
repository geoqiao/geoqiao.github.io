import { createHash } from "node:crypto";
import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import subsetFont from "subset-font";
import type { Post } from "./content";
import { renderMarkdown } from "./markdown";

// Noto Serif SC is only for an article's own headings (h1-h3), and only for the characters they use,
// so a page carries a few KB of font instead of the whole script.
const source = resolve(process.cwd(), "node_modules/@fontsource/noto-serif-sc/files/noto-serif-sc-chinese-simplified-600-normal.woff2");

export interface TitleFont {
  /** File name under /assets/fonts/title/. */
  name: string;
  /** The non-ASCII characters of the headings; Latin text comes from Spectral. */
  text: string;
}

const cache = new Map<string, Promise<TitleFont | null>>();

/** The heading font of an article, or null when none of its headings has a Chinese character. */
export function titleFont(post: Post): Promise<TitleFont | null> {
  let font = cache.get(post.slug);
  if (!font) {
    font = renderMarkdown(post.markdown).then((body) => {
      const headings = [post.title, ...[...body.matchAll(/<h[1-3][\s>][\s\S]*?<\/h[1-3]>/g)].map((match) => match[0].replace(/<[^>]*>/g, ""))];
      const text = [...new Set(headings.join("").replace(/[\x00-\x7f]/g, ""))].sort().join("");
      if (!/\p{Script=Han}/u.test(text)) return null;
      // The name carries the characters' hash, so a changed title is a new file for caches.
      return { name: `${post.slug}-${createHash("sha256").update(text).digest("hex").slice(0, 8)}`, text };
    });
    cache.set(post.slug, font);
  }
  return font;
}

/** The woff2 file for a title font. */
export function titleFontFile({ text }: TitleFont): Promise<Buffer> {
  return subsetFont(readFileSync(source), text, { targetFormat: "woff2" });
}
