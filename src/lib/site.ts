import { redirectMap, site } from "./config";
import { posts, type Post, type Tag } from "./content";
import { getProjects } from "./projects";

export interface TagPage extends Tag {
  path: string;
  posts: Post[];
}

export function tagPath(tag: Tag): string {
  return `/tags/${tag.key}/`;
}

/** Tags by key; the newest post's spelling names the tag. */
export const tags: TagPage[] = (() => {
  const grouped = new Map<string, TagPage>();
  for (const post of posts) {
    for (const tag of post.tags) {
      const page = grouped.get(tag.key) ?? { ...tag, path: tagPath(tag), posts: [] };
      page.posts.push(post);
      grouped.set(tag.key, page);
    }
  }
  return [...grouped.values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
})();

export interface Archive {
  number: number;
  total: number;
  path: string;
  prev: string | null;
  next: string | null;
  posts: Post[];
}

export function archivePath(number: number): string {
  return number === 1 ? "/blog/" : `/blog/page/${number}/`;
}

/** The Blog in pages; an empty Blog has one page. */
export const archives: Archive[] = (() => {
  const total = Math.max(1, Math.ceil(posts.length / site.pageSize));
  return Array.from({ length: total }, (_, index) => ({
    number: index + 1,
    total,
    path: archivePath(index + 1),
    prev: index > 0 ? archivePath(index) : null,
    next: index + 1 < total ? archivePath(index + 2) : null,
    posts: posts.slice(index * site.pageSize, (index + 1) * site.pageSize),
  }));
})();

/** Every page of the site, in sitemap order. */
export async function pagePaths(): Promise<string[]> {
  const paths = ["/", "/blog/", "/about/", "/projects/", "/tags/"];
  const seen = new Set<string>();
  // Oldest first; a tag appears before the first post that uses it.
  for (const post of [...posts].sort((a, b) => a.issueNumber - b.issueNumber)) {
    for (const tag of post.tags) {
      if (!seen.has(tag.key)) {
        seen.add(tag.key);
        paths.push(tagPath(tag));
      }
    }
    paths.push(post.path);
  }
  for (const project of await getProjects()) paths.push(project.path);
  for (const archive of archives.slice(1)) paths.push(archive.path);
  return paths;
}

export interface Redirect {
  from: string;
  to: string;
}

/**
 * Old addresses that lead to a page of this site or to another site. A redirect
 * to another old address follows it to the page. A page always wins over a
 * redirect, and a redirect whose page is gone is left out: both depend on Issues.
 */
export async function redirects(): Promise<Redirect[]> {
  const pages = new Set(await pagePaths());
  const result: Redirect[] = [];
  for (const [from, configured] of Object.entries(redirectMap)) {
    if (/^https?:\/\//.test(configured)) {
      result.push({ from, to: configured });
      continue;
    }
    let to = configured;
    const followed = new Set([from]);
    while (!pages.has(to) && to in redirectMap) {
      if (followed.has(to)) throw new Error(`redirects: ${from} is part of a loop`);
      followed.add(to);
      to = redirectMap[to];
    }
    if (pages.has(from)) {
      console.warn(`redirects: ${from} is a page of this site now; the redirect is left out`);
    } else if (!pages.has(to)) {
      console.warn(`redirects: ${from} points to ${configured}, which is not a page of this site; the redirect is left out`);
    } else {
      result.push({ from, to });
    }
  }
  return result;
}
