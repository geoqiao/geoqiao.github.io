import type { APIRoute } from "astro";
import { absolute, site } from "../lib/config";
import { posts } from "../lib/content";
import { renderMarkdown } from "../lib/markdown";

// Characters XML 1.0 forbids; escaping refuses Issues that contain them.
const NOT_XML = /[^\t\n\r\x20-\uD7FF\uE000-\uFFFD\u{10000}-\u{10FFFF}]/u;

function text(value: string): string {
  return value.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;");
}

function attribute(value: string): string {
  return text(value).replaceAll('"', "&quot;");
}

/** Every Blog post, newest first, with its full text (RFC 4287). */
export const GET: APIRoute = async () => {
  const self = absolute("/atom.xml");
  // The feed's time is the latest post update, so an unchanged Blog gives an unchanged feed.
  const updated = posts.map((post) => post.updatedAt).sort().at(-1) ?? new Date().toISOString().replace(/\.\d+Z$/, "Z");
  const entries = await Promise.all(
    posts.map(async (post) => {
      const url = absolute(post.path);
      return (
        `<entry><id>${text(url)}</id><title>${text(post.title)}</title>` +
        `<link rel="alternate" type="text/html" href="${attribute(url)}" />` +
        `<summary>${text(post.description)}</summary>` +
        `<published>${post.publishedAt}</published><updated>${post.updatedAt}</updated>` +
        `<content type="html">${text(await renderMarkdown(post.markdown))}</content></entry>`
      );
    }),
  );
  const xml =
    `<?xml version='1.0' encoding='utf-8'?>\n<feed xmlns="http://www.w3.org/2005/Atom">` +
    `<id>${text(site.url)}</id><title>${text(site.title)}</title>` +
    `<link rel="self" type="application/atom+xml" href="${attribute(self)}" />` +
    `<link rel="alternate" type="text/html" href="${attribute(site.url)}" />` +
    `<author><name>${text(site.author)}</name></author>` +
    (site.description ? `<subtitle>${text(site.description)}</subtitle>` : "") +
    `<updated>${updated}</updated>${entries.join("")}</feed>`;
  const forbidden = NOT_XML.exec(xml);
  if (forbidden) {
    throw new Error(`atom.xml would contain U+${forbidden[0].codePointAt(0)!.toString(16).toUpperCase().padStart(4, "0")}, a character XML 1.0 forbids`);
  }
  return new Response(xml, { headers: { "content-type": "application/atom+xml; charset=utf-8" } });
};
