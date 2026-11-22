import assert from "node:assert/strict";
import { execFileSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, readdirSync, readFileSync, rmSync } from "node:fs";
import { createRequire } from "node:module";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { after, before, test } from "node:test";
import { parse } from "parse5";
import { PNG } from "pngjs";

let dist;
const require = createRequire(import.meta.url);
const manifest = JSON.parse(readFileSync(join(process.env.CONTENT_DIR ?? "content", "manifest.json"), "utf8"));

before(() => {
  dist = mkdtempSync(join(tmpdir(), "geo-build-test-"));
  const astroPackage = require.resolve("astro/package.json");
  const cli = join(dirname(astroPackage), require(astroPackage).bin.astro);
  execFileSync(process.execPath, [cli, "build", "--outDir", dist], {
    env: { ...process.env, PROJECT_METADATA: "offline", ASTRO_TELEMETRY_DISABLED: "1" },
  });
});

after(() => {
  if (dist) rmSync(dist, { recursive: true, force: true });
});

function* elements(node) {
  if (node.tagName) yield node;
  for (const child of node.childNodes ?? []) yield* elements(child);
}

function attr(node, name) {
  return node.attrs.find((item) => item.name === name)?.value;
}

function page(relativePath) {
  return [...elements(parse(readFileSync(join(dist, relativePath), "utf8")))];
}

function meta(nodes) {
  return new Map(nodes.filter((node) => node.tagName === "meta")
    .map((node) => [attr(node, "property") ?? attr(node, "name"), attr(node, "content")]));
}

test("each published article has a readable 1200×630 PNG and matching social metadata", () => {
  const files = manifest.blog.map(({ slug }) => `${slug}.png`);
  assert.deepEqual(readdirSync(join(dist, "og")).sort(), files.sort());
  const titlesByImage = new Map();
  for (const { slug } of manifest.blog) {
    const png = PNG.sync.read(readFileSync(join(dist, "og", `${slug}.png`)));
    assert.deepEqual([png.width, png.height], [1200, 630], slug);
    const pixel = (x, y) => png.data.subarray((y * png.width + x) * 4, (y * png.width + x) * 4 + 4);
    assert.deepEqual([...pixel(600, 420)], [255, 255, 255, 255], slug);
    for (const [x, y] of [[16, 315], [1184, 315], [600, 16], [600, 614]]) {
      assert.notDeepEqual(pixel(x, y), pixel(600, 420), `The gradient border is clipped: ${slug}`);
    }
    const tags = meta(page(`blog/${slug}/index.html`));
    const title = tags.get("og:title");
    assert.ok(title, slug);
    assert.equal(tags.get("twitter:card"), "summary_large_image", slug);
    assert.equal(tags.get("og:image"), `https://geoqiao.me/og/${slug}.png`, slug);
    assert.equal(tags.get("twitter:image"), tags.get("og:image"), slug);
    assert.equal(tags.get("og:image:width"), "1200", slug);
    assert.equal(tags.get("og:image:height"), "630", slug);
    assert.equal(tags.get("og:image:alt"), title, slug);
    assert.equal(tags.get("twitter:image:alt"), title, slug);
    const hash = createHash("sha256").update(png.data).digest("hex");
    assert.equal(titlesByImage.get(hash) ?? title, title, `Different titles share the same pixels: ${slug}`);
    titlesByImage.set(hash, title);
  }
  const home = meta(page("index.html"));
  assert.equal(home.get("twitter:card"), "summary");
  assert.ok(home.get("og:image") && !home.get("og:image:width"));
  assert.match(home.get("twitter:image"), /\/assets\/images\/avatar\.png$/);
});

test("the generated article has both static TOCs and keyboard-focusable heading targets", () => {
  let checkedHeadings = 0;
  for (const { slug } of manifest.blog) {
    const nodes = page(`blog/${slug}/index.html`);
    const body = nodes.find((node) => attr(node, "class") === "post-content");
    const headings = [...elements(body)].filter((node) => /^h[1-3]$/.test(node.tagName));
    const lists = nodes.filter((node) => attr(node, "data-toc") !== undefined);
    assert.equal(lists.length, headings.length ? 2 : 0, slug);
    const ids = headings.map((heading) => attr(heading, "id"));
    assert.equal(new Set(ids).size, ids.length, slug);
    const fragments = ids.map((id) => `#${encodeURIComponent(id)}`);
    for (const list of lists) {
      const links = [...elements(list)].filter((node) => node.tagName === "a");
      assert.deepEqual(links.map((node) => attr(node, "href")), fragments, slug);
    }
    headings.forEach((heading, index) => {
      assert.ok(ids[index], slug);
      assert.equal(nodes.filter((node) => attr(node, "id") === ids[index]).length, 1, slug);
      assert.equal(attr(heading, "tabindex"), "-1", slug);
      if (heading.tagName === "h1") return;
      const anchor = [...elements(heading)].find((node) => attr(node, "class") === "heading-anchor");
      assert.ok(anchor, slug);
      assert.equal(attr(anchor, "href"), fragments[index], slug);
      assert.ok(attr(anchor, "aria-label"), slug);
      checkedHeadings++;
    });
  }
  assert.ok(checkedHeadings > 0);
});

test("Atom keeps article headings free of generated permalink controls", () => {
  const xml = readFileSync(join(dist, "atom.xml"), "utf8");
  assert.match(xml, /&lt;h[23]&gt;/);
  assert.doesNotMatch(xml, /heading-anchor|&lt;h[1-3][^&]* tabindex=/);
});
