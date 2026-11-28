import type { Post, Tag } from "./content";

export interface TagPage extends Tag {
  path: string;
  posts: Post[];
  indexable: boolean;
}

export function tagPath(tag: Tag): string {
  return `/tags/${tag.key}/`;
}

/** The newest post supplies the name. For identical multi-post sets, the first key wins. */
export function buildTagPages(posts: readonly Post[]): TagPage[] {
  const grouped = new Map<string, TagPage>();
  for (const post of posts) {
    for (const tag of post.tags) {
      const page = grouped.get(tag.key) ?? { ...tag, path: tagPath(tag), posts: [], indexable: false };
      if (page.posts.at(-1) !== post) page.posts.push(post);
      grouped.set(tag.key, page);
    }
  }

  const tags = [...grouped.values()].sort((a, b) => (a.key < b.key ? -1 : a.key > b.key ? 1 : 0));
  const indexedSets = new Set<string>();
  for (const tag of tags) {
    if (tag.posts.length < 2) continue;
    // Every list was populated in the same post order.
    const signature = JSON.stringify(tag.posts.map(({ issueNumber }) => issueNumber));
    tag.indexable = !indexedSets.has(signature);
    indexedSets.add(signature);
  }
  return tags;
}
