import type { Post } from "./content";

export const ogSize = { width: 1200, height: 630 };

export function ogCard({ slug, title }: Pick<Post, "slug" | "title">) {
  return { path: `/og/${slug}.png`, ...ogSize, alt: title };
}
