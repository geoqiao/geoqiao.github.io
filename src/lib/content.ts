import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";
import { site } from "./config";

// What `escaping-site export` wrote; see escaping's docs/contracts/content-export-v1.md.
// The workflow commits it to content/, so a host can build the site from the repository alone.
const contentDir = resolve(process.cwd(), process.env.CONTENT_DIR ?? "content");
const SUPPORTED_EXPORT_VERSION = 1;

export interface Tag {
  name: string;
  key: string;
}

export interface Post {
  issueNumber: number;
  title: string;
  slug: string;
  description: string;
  createdDate: string;
  /** The day the author last revised the post; equal to createdDate when never. */
  updateDate: string;
  publishedAt: string;
  updatedAt: string;
  tags: Tag[];
  markdown: string;
  path: string;
}

export interface About {
  issueNumber: number;
  title: string;
  description: string;
  markdown: string;
}

interface Manifest {
  export_version: number;
  repository: string;
  blog: { issue_number: number; slug: string; path: string }[];
  ideas: unknown[];
  about: { issue_number: number; path: string } | null;
  skipped_issues: number[];
}

function readEntry(path: string): { data: Record<string, any>; markdown: string } {
  const text = readFileSync(resolve(contentDir, path), "utf8");
  const match = /^---\n([\s\S]*?)\n---\n?/.exec(text);
  if (!match) throw new Error(`${path} has no front matter`);
  return { data: parse(match[1]), markdown: text.slice(match[0].length) };
}

function loadManifest(): Manifest {
  const file = resolve(contentDir, "manifest.json");
  if (!existsSync(file)) {
    throw new Error(
      `No content at ${contentDir}. Run "escaping-site export --config config.yaml --output content" first (see README.md).`,
    );
  }
  const manifest = JSON.parse(readFileSync(file, "utf8")) as Manifest;
  if (manifest.export_version !== SUPPORTED_EXPORT_VERSION) {
    throw new Error(
      `Content export version ${manifest.export_version} is not supported; this site reads version ${SUPPORTED_EXPORT_VERSION}.`,
    );
  }
  if (manifest.repository !== site.repo) {
    // Comments bind to Issue numbers of this repository.
    throw new Error(`The export is from ${manifest.repository}, not ${site.repo}.`);
  }
  if (manifest.ideas.length) {
    // The export carries every content type; this site has no pages for Ideas.
    console.warn(`Ignoring ${manifest.ideas.length} exported Idea(s): this site has no Ideas pages.`);
  }
  return manifest;
}

const manifest = loadManifest();

/** Blog posts, newest first: the order of the manifest. */
export const posts: Post[] = manifest.blog.map((item) => {
  const { data, markdown } = readEntry(item.path);
  return {
    issueNumber: data.issue_number,
    title: data.title,
    slug: data.slug,
    description: data.description,
    createdDate: data.created_date,
    updateDate: data.update_date,
    publishedAt: data.published_at,
    updatedAt: data.updated_at,
    tags: data.tags ?? [],
    markdown,
    path: `/blog/${data.slug}/`,
  };
});

export const about: About | null = manifest.about
  ? (() => {
      const { data, markdown } = readEntry(manifest.about.path);
      return {
        issueNumber: data.issue_number,
        title: data.title,
        description: data.description,
        markdown,
      };
    })()
  : null;
