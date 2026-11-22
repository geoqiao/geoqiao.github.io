// Issue bodies are untrusted HTML once rendered: the allowlist in src/lib/markdown.ts
// is the only thing between an Issue and the page. Run with `pnpm test`.
import assert from "node:assert/strict";
import { test } from "node:test";
import { renderArticle, renderMarkdown } from "../src/lib/markdown.ts";

test("scripts, frames, forms and event handlers do not reach the page", async () => {
  const html = await renderMarkdown(
    [
      "<script>alert(1)</script>",
      '<iframe src="https://example.com"></iframe>',
      '<form action="/x"><button>go</button></form>',
      "<style>body { display: none }</style>",
      '<p onclick="alert(1)" style="color: red" id="top">kept text</p>',
      '<img src="x.png" onerror="alert(1)">',
    ].join("\n\n"),
  );
  assert.doesNotMatch(html, /<script|<iframe|<form|<button|<style|alert\(1\)|display: none/);
  assert.doesNotMatch(html, /onclick|onerror|style=|id=/);
  assert.match(html, /<p>kept text<\/p>/);
});

test("links keep only safe addresses", async () => {
  const html = await renderMarkdown(
    [
      "[script](javascript:alert(1))",
      "[data](data:text/html,x)",
      "[bare](other-page)",
      "[site](/blog/)",
      "[part](#part)",
      "[web](https://example.com/)",
      '<a href="vbscript:x" target="_blank" rel="opener">raw</a>',
    ].join("\n\n"),
  );
  assert.doesNotMatch(html, /javascript:|data:|vbscript:|other-page|target=|rel=/);
  assert.match(html, /<a>bare<\/a>/);
  assert.match(html, /<a href="\/blog\/">site<\/a>/);
  assert.match(html, /<a href="#part">part<\/a>/);
  assert.match(html, /<a href="https:\/\/example.com\/">web<\/a>/);
});

test("images load lazily unless the author chose otherwise", async () => {
  const html = await renderMarkdown(
    '![chart](https://example.com/a.png)\n\n<img src="https://example.com/b.png" loading="eager" decoding="bogus" width="10">',
  );
  assert.match(html, /<img src="https:\/\/example.com\/a.png" alt="chart" loading="lazy" decoding="async">/);
  assert.match(html, /<img src="https:\/\/example.com\/b.png" loading="eager" width="10" decoding="async">/);
});

test("task items show their state as text", async () => {
  const html = await renderMarkdown("- [x] done\n- [ ] open");
  assert.doesNotMatch(html, /<input/);
  assert.match(html, /☑ done/);
  assert.match(html, /☐ open/);
});

test("fenced code is colored; unknown languages stay as written", async () => {
  const html = await renderMarkdown(
    ["```python", "x = 1  # one", "```", "", "```nosuchlanguage", "<b>raw</b>", "```"].join("\n"),
  );
  assert.match(html, /<pre><code class="language-python syntax"><span class="line">/);
  assert.match(html, /--shiki-light:#177500/);
  assert.match(html, /<pre><code class="language-nosuchlanguage">&#x3C;b>raw&#x3C;\/b>\n<\/code><\/pre>/);
});

test("a Mermaid fence becomes an SVG with its source kept; the feed keeps only the source", async () => {
  const markdown = ["```mermaid", "flowchart TD", "  accTitle: Two steps", "  accDescr: A leads to B.", "  A[Start] --> B[<img src=x onerror=alert(1)>]", "```"].join("\n");
  const page = await renderMarkdown(markdown);
  assert.match(page, /<div class="diagram" role="region" tabindex="0" aria-label="Diagram, scroll horizontally"><svg [^>]*role="img"/);
  assert.match(page, /<title[^>]*>Two steps<\/title>/);
  assert.match(page, /<details class="diagram-source"><summary>Diagram source<\/summary><pre><code class="language-mermaid">/);
  assert.doesNotMatch(page, /<img/);
  const feed = await renderMarkdown(markdown, { feed: true });
  assert.doesNotMatch(feed, /<svg/);
  assert.match(feed, /<pre><code class="language-mermaid">flowchart TD/);
});

test("a Mermaid source the renderer cannot draw stays as code", async () => {
  const html = await renderMarkdown(["```mermaid", "not a diagram at all", "```"].join("\n"));
  assert.match(html, /<pre><code class="language-mermaid">not a diagram at all\n<\/code><\/pre>/);
  assert.doesNotMatch(html, /<svg/);
});

test("a table scrolls inside a focusable region", async () => {
  const html = await renderMarkdown("| Plan | Price |\n| --- | ---: |\n| Plus | 20 |");
  assert.match(html, /<div class="table-scroll" role="region" tabindex="0" aria-label="Table, scroll horizontally"><table>/);
  assert.match(html, /<td align="right">20<\/td><\/tr>\s*<\/tbody>\s*<\/table><\/div>/);
});

test("repository images reserve space without changing their URLs or authored sizing", async () => {
  const src = "https://raw.githubusercontent.com/geoqiao/geoqiao.github.io/2716e271eb7a86ade616ba4bb0e237bd454709e4/assets/issues/73/aa0e2e6f2ff80458.png";
  const html = await renderMarkdown(`![screenshot](${src})\n\n<img src="/assets/images/avatar.png" width="128">\n\n<img src="/assets/images/avatar.png" width="80" height="60">`);
  assert.ok(html.includes(`src="${src}"`));
  assert.match(html, /width="1840" height="1200"/);
  assert.match(html, /width="128"[^>]*height="128"/);
  assert.match(html, /width="80" height="60"/);
});

test("article heading IDs match legacy fragments, including repeats and punctuation-only headings", async () => {
  const markdown = "# Hello!\n\n## Top\n\n## 你好，`GPT`!\n\n### 你好，GPT!\n\n## 🎉";
  const { html, headings } = await renderArticle(markdown);
  assert.deepEqual(headings, [
    { id: "hello", level: 1, text: "Hello!" },
    { id: "top-section", level: 2, text: "Top" },
    { id: "你好-gpt", level: 2, text: "你好，GPT!" },
    { id: "你好-gpt-section", level: 3, text: "你好，GPT!" },
    { id: "section-5", level: 2, text: "🎉" },
  ]);
  assert.match(html, /<h3 id="你好-gpt-section" tabindex="-1">[^<]+<a class="heading-anchor" href="#%E4%BD%A0%E5%A5%BD-gpt-section"/);
  assert.doesNotMatch(await renderMarkdown(markdown, { feed: true }), /heading-anchor|tabindex=/);
});

test("static headings do not take an ID used by a rendered diagram", async () => {
  const { html, headings } = await renderArticle("## Diagram 1 Title\n\n```mermaid\nflowchart TD\nA --> B\n```");
  assert.match(html, /<title id="diagram-1-title">/);
  assert.equal(headings[0].id, "diagram-1-title-section");
});
