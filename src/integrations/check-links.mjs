import { existsSync, readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { fileURLToPath } from "node:url";
import { parse } from "parse5";

function htmlFiles(dir) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return htmlFiles(path);
    return name.endsWith(".html") ? [path] : [];
  });
}

function references(node, found = []) {
  for (const attr of node.attrs ?? []) {
    if (["href", "src", "poster"].includes(attr.name)) found.push(attr.value);
  }
  for (const child of node.childNodes ?? node.content?.childNodes ?? []) references(child, found);
  return found;
}

/**
 * Fail the build when a page links to an address of this site that the build
 * did not write. Posts link to each other and to assets by hand, and a post
 * can be unpublished at any time.
 */
export default function checkLinks() {
  let origin = "";
  return {
    name: "check-links",
    hooks: {
      "astro:config:done": ({ config }) => {
        origin = new URL(config.site).origin;
      },
      "astro:build:done": ({ dir }) => {
        const root = fileURLToPath(dir);
        const broken = [];
        for (const file of htmlFiles(root)) {
          for (const reference of references(parse(readFileSync(file, "utf8")))) {
            const local = reference.startsWith(`${origin}/`) ? reference.slice(origin.length) : reference;
            if (!local.startsWith("/") || local.startsWith("//")) continue;
            let path;
            try {
              path = decodeURIComponent(local.split(/[?#]/)[0]);
            } catch {
              path = local;
            }
            const target = join(root, path, path.endsWith("/") ? "index.html" : "");
            if (!existsSync(target) || statSync(target).isDirectory()) {
              broken.push(`${relative(root, file)} → ${reference}`);
            }
          }
        }
        if (broken.length) {
          throw new Error(`Links to pages or files this site does not have:\n  ${broken.join("\n  ")}`);
        }
      },
    },
  };
}
