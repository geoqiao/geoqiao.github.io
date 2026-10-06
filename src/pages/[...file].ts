import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { APIRoute } from "astro";
import { absolute, site } from "../lib/config";
import { escapeHtml } from "../lib/html";
import { getProjects, type Project } from "../lib/projects";
import { redirects, type Redirect } from "../lib/site";

// Files that do not use the site's layout: each project's product page
// (src/project-pages/<slug>.html) and Cloudflare's list of redirects.

/** Fill the {{ name }} placeholders of a project page; an unknown name is an error. */
function projectPage(project: Project): string {
  const template = readFileSync(resolve(process.cwd(), "src/project-pages", `${project.slug}.html`), "utf8");
  const values: Record<string, string> = {
    "project.title": project.title,
    "project.summary": project.summary,
    "project.image": project.image,
    "page.path": project.path,
    "page.url": absolute(project.path),
    "site.title": site.title,
    "site.author": site.author,
  };
  return template.replace(/\{\{\s*([\w.]+)\s*\}\}/g, (_match, name: string) => {
    if (!(name in values)) throw new Error(`src/project-pages/${project.slug}.html: unknown placeholder ${name}`);
    return escapeHtml(values[name]);
  });
}

/**
 * Cloudflare's `_redirects`: every old address, with or without its closing
 * slash, moves permanently (301) to its page in one step. The slash-redirects
 * integration adds the lines for the site's own pages after the build.
 */
function redirectsFile(list: Redirect[]): string {
  return list
    .flatMap(({ from, to }) => [from, ...(from.endsWith("/") ? [from.slice(0, -1)] : [])].map((path) => `${path} ${to} 301`))
    .join("\n") + "\n";
}

function file(path: string): string {
  return `${path.slice(1)}${path.endsWith("/") ? "index.html" : ""}`;
}

export async function getStaticPaths() {
  return [
    ...(await getProjects()).map((project) => ({
      params: { file: file(project.path) },
      props: { body: projectPage(project), type: "text/html; charset=utf-8" },
    })),
    { params: { file: "_redirects" }, props: { body: redirectsFile(await redirects()), type: "text/plain" } },
  ];
}

export const GET: APIRoute = ({ props }) => new Response(props.body, { headers: { "content-type": props.type } });
