import { readFileSync } from "node:fs";
import type { Element, Root } from "hast";
import rehypeSanitize, { type Options as Schema } from "rehype-sanitize";
import rehypeStringify from "rehype-stringify";
import remarkGfm from "remark-gfm";
import remarkParse from "remark-parse";
import remarkRehype from "remark-rehype";
import { unified } from "unified";
import { visit } from "unist-util-visit";

interface Comment {
  id: number;
  author: string;
  authorAssociation: string;
  avatarUrl: string | null;
  createdAt: string;
  body: string;
}

interface Snapshot {
  issues: Record<number, Comment[]>;
  avatars: Record<string, string>;
}

function readSnapshot(): Snapshot | undefined {
  try {
    return JSON.parse(readFileSync("data/issue-comments/index.json", "utf8")) as Snapshot;
  } catch (error) {
    if ((error as NodeJS.ErrnoException).code === "ENOENT") return undefined;
    throw error;
  }
}

const snapshot = readSnapshot();

export function issueComments(number: number) {
  return snapshot?.issues[number];
}

export function commentAvatar(url: string | null) {
  const data = url && snapshot?.avatars[url];
  if (data && /^data:image\/(?:png|jpeg|webp|gif);base64,[A-Za-z0-9+/]+={0,2}$/.test(data)) return data;
}

const commentSchema: Schema = {
  tagNames: ["p", "br", "em", "strong", "del", "code", "pre", "blockquote", "ol", "ul", "li", "a"],
  attributes: { a: ["href", ["rel", "nofollow", "noopener", "noreferrer"]], ol: ["start"] },
  protocols: { href: ["http", "https"] },
};

function webLink(value: unknown) {
  if (typeof value !== "string" || !/^https?:\/\//i.test(value)) return undefined;
  const url = URL.parse(value);
  if (url && !url.username && !url.password) return url.href;
}

function imageText(node: Element) {
  return { type: "text" as const, value: String(node.properties.alt || "Image") };
}

function safeLinks() {
  return (tree: Root) => {
    visit(tree, { type: "element", tagName: "a" }, (node) => {
      // A linked image keeps its outer link. Replacing its image with text
      // avoids emitting a nested anchor.
      visit(node, { type: "element", tagName: "img" }, (image, index, parent) => {
        if (parent && index !== undefined) parent.children[index] = imageText(image);
      });
      const href = webLink(node.properties.href);
      node.properties = href ? { href, rel: ["nofollow", "noopener", "noreferrer"] } : {};
    });
    visit(tree, { type: "element", tagName: "img" }, (node, index, parent) => {
      if (!parent || index === undefined) return;
      const href = webLink(node.properties.src);
      const label = imageText(node);
      parent.children[index] = href
        ? { type: "element", tagName: "a", properties: { href, rel: ["nofollow", "noopener", "noreferrer"] }, children: [label] }
        : label;
    });
  };
}

// Raw HTML is discarded by remark-rehype. The allowlist is narrower than the
// one used for article authors, and nothing inserts HTML after sanitization.
const processor = unified()
  .use(remarkParse)
  .use(remarkGfm)
  .use(remarkRehype)
  .use(safeLinks)
  .use(rehypeSanitize, commentSchema)
  .use(rehypeStringify);

export async function renderComment(markdown: string) {
  return String(await processor.process(markdown));
}
