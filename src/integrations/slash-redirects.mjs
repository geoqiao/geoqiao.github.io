import { appendFileSync, readdirSync, statSync } from "node:fs";
import { join } from "node:path";
import { fileURLToPath } from "node:url";

function pageDirectories(dir, path = "") {
  return readdirSync(dir).flatMap((name) => {
    const child = join(dir, name);
    if (!statSync(child).isDirectory()) return [];
    const childPath = `${path}/${name}`;
    const own = statSync(join(child, "index.html"), { throwIfNoEntry: false }) ? [childPath] : [];
    return [...own, ...pageDirectories(child, childPath)];
  });
}

/**
 * Add to Cloudflare's `_redirects` (src/pages/[...file].ts writes the old
 * addresses first): an address without its closing slash moves permanently to
 * the page. Cloudflare alone would answer with a temporary 307.
 */
export default function slashRedirects() {
  return {
    name: "slash-redirects",
    hooks: {
      "astro:build:done": ({ dir }) => {
        const root = fileURLToPath(dir);
        const lines = pageDirectories(root)
          .sort()
          .map((path) => `${path} ${path}/ 301`);
        appendFileSync(join(root, "_redirects"), lines.join("\n") + "\n");
      },
    },
  };
}
