// Compare two builds of the site, page by page: node scripts/compare-sites.mjs <old> <new>
// HTML pages are compared by what readers and crawlers get: head metadata,
// visible text, links and resources. Markup and whitespace may differ.
import { readdirSync, readFileSync, statSync } from "node:fs";
import { join, relative } from "node:path";
import { parse } from "parse5";

const [oldDir, newDir] = process.argv.slice(2);
if (!oldDir || !newDir) {
  console.error("Usage: node scripts/compare-sites.mjs <old> <new>");
  process.exit(2);
}

function files(root, dir = root) {
  return readdirSync(dir).flatMap((name) => {
    const path = join(dir, name);
    if (statSync(path).isDirectory()) return files(root, path);
    return name === ".escaping-output" ? [] : [relative(root, path)];
  });
}

// Whitespace between these never shows; Markdown renderers disagree about writing it.
const BLOCKS = new Set(["table", "thead", "tbody", "tr", "td", "th", "ul", "ol", "li", "p", "div", "pre", "blockquote", "h1", "h2", "h3", "h4", "h5", "h6", "details", "summary", "hr", "br"]);

function sorted(value) {
  if (Array.isArray(value)) return value.map(sorted);
  if (value && typeof value === "object") {
    return Object.fromEntries(Object.keys(value).sort().map((key) => [key, sorted(value[key])]));
  }
  return value;
}

const squash = (text) => text.replace(/\s+/g, " ").trim();

function summary(html) {
  const head = [];
  const links = [];
  const text = [];
  const walk = (node, inHead, hidden) => {
    const attrs = Object.fromEntries((node.attrs ?? []).map((attr) => [attr.name, attr.value]));
    const tag = node.tagName;
    if (tag === "head") inHead = true;
    if (inHead && (tag === "meta" || tag === "link")) head.push(JSON.stringify(Object.entries(attrs).sort()));
    if (tag === "html") head.push(`lang=${attrs.lang}`);
    if (tag === "script" && attrs.type === "application/ld+json") {
      head.push(JSON.stringify(sorted(JSON.parse(node.childNodes[0].value))));
      return;
    }
    if (tag === "script" && attrs.src) links.push(`script ${attrs.src}`);
    if (tag === "script" || tag === "style") return;
    if (tag === "title") head.push(`title=${squash(node.childNodes[0]?.value ?? "")}`);
    if (!inHead) {
      for (const name of ["href", "src", "id", "rel", "aria-label", "aria-current", "datetime", "data-issue-number", "data-comments-repo"]) {
        if (name in attrs) links.push(`${tag} ${name}=${attrs[name]}`);
      }
    }
    if (node.nodeName === "#text" && !inHead) text.push(node.value);
    if (BLOCKS.has(tag)) text.push(" ");
    for (const child of node.childNodes ?? node.content?.childNodes ?? []) walk(child, inHead, hidden);
    if (BLOCKS.has(tag)) text.push(" ");
  };
  walk(parse(html), false, false);
  return { head: head.sort(), links, text: squash(text.join("")) };
}

function firstDifference(a, b) {
  let index = 0;
  while (index < a.length && a[index] === b[index]) index += 1;
  return `at ${index}: old …${JSON.stringify(a.slice(Math.max(0, index - 40), index + 60))} new …${JSON.stringify(b.slice(Math.max(0, index - 40), index + 60))}`;
}

const oldFiles = files(oldDir).sort();
const newFiles = new Set(files(newDir));
let problems = 0;
const report = (file, message) => {
  problems += 1;
  console.log(`${file}: ${message}`);
};

for (const file of oldFiles) {
  if (!newFiles.delete(file)) {
    report(file, "missing in the new build");
    continue;
  }
  const before = readFileSync(join(oldDir, file));
  const after = readFileSync(join(newDir, file));
  if (before.equals(after)) continue;
  if (file.endsWith(".html")) {
    const a = summary(before.toString());
    const b = summary(after.toString());
    for (const key of ["head", "links"]) {
      const gone = a[key].filter((item) => !b[key].includes(item));
      const added = b[key].filter((item) => !a[key].includes(item));
      if (gone.length || added.length || a[key].length !== b[key].length) {
        report(file, `${key} differs\n  - ${gone.slice(0, 6).join("\n  - ")}\n  + ${added.slice(0, 6).join("\n  + ")}`);
      }
    }
    if (a.text !== b.text) report(file, `text differs ${firstDifference(a.text, b.text)}`);
  } else if (file === "search.json") {
    const a = JSON.stringify(JSON.parse(before));
    const b = JSON.stringify(JSON.parse(after));
    if (a !== b) report(file, `differs ${firstDifference(a, b)}`);
  } else if (file === "atom.xml") {
    // Entry bodies are escaped HTML; compare everything else exactly and the bodies as text.
    const split = (xml) => xml.toString().split(/<content type="html">[\s\S]*?<\/content>/);
    const bodies = (xml) => [...xml.toString().matchAll(/<content type="html">([\s\S]*?)<\/content>/g)].map((match) =>
      summary(match[1].replaceAll("&lt;", "<").replaceAll("&gt;", ">").replaceAll("&amp;", "&")).text);
    const [a, b] = [split(before).join("§"), split(after).join("§")];
    if (a !== b) report(file, `feed fields differ ${firstDifference(a, b)}`);
    const [x, y] = [bodies(before), bodies(after)];
    x.forEach((body, index) => {
      if (body !== y[index]) report(file, `entry ${index + 1} text differs ${firstDifference(body, y[index] ?? "")}`);
    });
  } else {
    report(file, "differs");
  }
}
for (const file of newFiles) report(file, "only in the new build");
console.log(problems ? `${problems} difference(s)` : `${oldFiles.length} files match`);
process.exit(problems ? 1 : 0);
