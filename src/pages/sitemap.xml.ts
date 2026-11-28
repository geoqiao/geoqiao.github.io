import type { APIRoute } from "astro";
import { absolute } from "../lib/config";
import { posts } from "../lib/content";
import { escapeHtml } from "../lib/html";
import { pagePaths, tags } from "../lib/site";

export const GET: APIRoute = async () => {
  const excluded = new Set(tags.filter((tag) => !tag.indexable).map((tag) => tag.path));
  // The editorial dates exclude GitHub Issue activity such as label and metadata edits.
  const articleDates = new Map(posts.map((post) => [post.path, post.updateDate ?? post.createdDate]));
  const urls = (await pagePaths())
    .filter((path) => !excluded.has(path))
    .map((path) => {
      const date = articleDates.get(path);
      const lastmod = date ? `<lastmod>${escapeHtml(date)}</lastmod>` : "";
      return `<url><loc>${escapeHtml(absolute(path))}</loc>${lastmod}</url>`;
    })
    .join("");
  return new Response(
    `<?xml version='1.0' encoding='utf-8'?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">${urls}</urlset>`,
    { headers: { "content-type": "application/xml; charset=utf-8" } },
  );
};
