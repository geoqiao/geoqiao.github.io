import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import type { APIRoute } from "astro";
import { absolute, site } from "../lib/config";
import { escapeHtml } from "../lib/html";
import { getProjects, type Project } from "../lib/projects";
import { redirects } from "../lib/site";

// Whole HTML documents that do not use the site's layout: each project's
// product page (src/project-pages/<slug>.html) and the pages of old addresses.

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

/** A page that sends visitors and search engines to the new address at once. */
function redirectPage(to: string): string {
  const url = escapeHtml(absolute(to));
  return `<!DOCTYPE html>
<html lang="${escapeHtml(site.language)}">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<title>Moved</title>
<meta name="robots" content="noindex">
<link rel="canonical" href="${url}">
<meta http-equiv="refresh" content="0; url=${url}">
</head>
<body>
<p>This page moved to <a href="${url}">${url}</a>.</p>
</body>
</html>
`;
}

function file(path: string): string {
  return `${path.slice(1)}${path.endsWith("/") ? "index.html" : ""}`;
}

export async function getStaticPaths() {
  return [
    ...(await getProjects()).map((project) => ({
      params: { file: file(project.path) },
      props: { html: projectPage(project) },
    })),
    ...(await redirects()).map((redirect) => ({
      params: { file: file(redirect.from) },
      props: { html: redirectPage(redirect.to) },
    })),
  ];
}

export const GET: APIRoute = ({ props }) =>
  new Response(props.html, { headers: { "content-type": "text/html; charset=utf-8" } });
