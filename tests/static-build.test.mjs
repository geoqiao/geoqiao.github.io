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
import { parse as parseYaml } from "yaml";
import { renderComment } from "../src/lib/comments.ts";
import { buildTagPages } from "../src/lib/tags.ts";

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

function schema(nodes) {
  const scripts = nodes.filter((node) => node.tagName === "script" && attr(node, "type") === "application/ld+json");
  assert.equal(scripts.length, 1);
  return JSON.parse(textOf(scripts[0]));
}

const origin = "https://geoqiao.me";
const author = {
  "@id": `${origin}/#person`,
  "@type": "Person",
  name: "Geo Qiao",
  url: `${origin}/about/`,
};

test("home and About share one person identity and declare their primary language", () => {
  const home = page("index.html");
  const about = page("about/index.html");
  const [person, website] = schema(home)["@graph"];
  const [profilePage, profilePerson] = schema(about)["@graph"];
  const reference = { "@id": author["@id"] };
  assert.deepEqual(person, {
    ...author,
    image: `${origin}/assets/images/avatar.png`,
    sameAs: ["https://github.com/geoqiao", "https://twitter.com/geoqiao"],
  });
  assert.deepEqual(profilePerson, person);
  assert.equal(website["@type"], "WebSite");
  assert.deepEqual(website.author, reference);
  assert.deepEqual(website.publisher, reference);
  assert.equal(profilePage["@type"], "ProfilePage");
  assert.deepEqual(profilePage.mainEntity, reference);
  for (const [nodes, language, locale] of [[home, "zh-CN", "zh_CN"], [about, "en", "en_US"]]) {
    assert.equal(attr(nodes.find((node) => node.tagName === "html"), "lang"), language);
    assert.equal(meta(nodes).get("og:locale"), locale);
  }
});

test("all articles connect their byline, social card, canonical URL and breadcrumbs", () => {
  for (const { slug } of manifest.blog) {
    const nodes = page(`blog/${slug}/index.html`);
    const tags = meta(nodes);
    const url = `${origin}/blog/${slug}/`;
    const [article, breadcrumbs] = schema(nodes)["@graph"];
    assert.equal(article["@type"], "BlogPosting", slug);
    assert.equal(article.image, tags.get("og:image"), slug);
    assert.deepEqual(article.author, author, slug);
    assert.equal(article.inLanguage, "zh-CN", slug);
    assert.deepEqual(article.mainEntityOfPage, { "@type": "WebPage", "@id": url }, slug);
    assert.equal(breadcrumbs["@type"], "BreadcrumbList", slug);
    assert.deepEqual(breadcrumbs.itemListElement, [
      { "@type": "ListItem", position: 1, name: "Home", item: `${origin}/` },
      { "@type": "ListItem", position: 2, name: "Blog", item: `${origin}/blog/` },
      { "@type": "ListItem", position: 3, name: tags.get("og:title"), item: url },
    ], slug);
    const byline = nodes.find((node) => attr(node, "class") === "article-author");
    assert.equal(byline.tagName, "a", slug);
    assert.equal(attr(byline, "href"), "/about/", slug);
    assert.equal(textOf(byline), author.name, slug);
  }
});

test("project pages publish software or community schema using configured URLs", () => {
  const { projects } = parseYaml(readFileSync("config.yaml", "utf8"));
  for (const { slug, title, summary, repository, website } of projects) {
    const structured = schema(page(`projects/${slug}/index.html`));
    assert.equal(structured["@type"], slug === "boji-club" ? "WebSite" : "SoftwareApplication", slug);
    assert.equal(structured.name, title, slug);
    assert.equal(structured.description, summary, slug);
    assert.equal(structured.url, `${origin}/projects/${slug}/`, slug);
    if (website) assert.ok(structured.sameAs.includes(website), slug);
    if (repository) assert.ok(structured.sameAs.includes(`https://github.com/${repository}`), slug);
  }
});

test("one deterministic tag survives duplicate multi-article sets, while singletons stay noindex", () => {
  const post = (issueNumber, ...keys) => ({ issueNumber, tags: keys.map((key) => ({ key, name: key })) });
  const tags = buildTagPages([
    post(3, "zeta", "alpha", "overlap", "solo", "solo"),
    post(2, "alpha", "zeta"),
    post(1, "overlap", "other-singleton"),
  ]);
  assert.deepEqual(tags.map(({ key, indexable }) => [key, indexable]), [
    ["alpha", true], ["other-singleton", false], ["overlap", true], ["solo", false], ["zeta", false],
  ]);
  assert.equal(tags.find(({ key }) => key === "solo").posts.length, 1);
});

test("sitemap uses editorial article dates and matches each tag page's robots directive", () => {
  const xml = readFileSync(join(dist, "sitemap.xml"), "utf8");
  const entries = [...xml.matchAll(/<url><loc>([^<]+)<\/loc>(?:<lastmod>([^<]+)<\/lastmod>)?<\/url>/g)];
  const urls = new Map(entries.map(([, url, date]) => [decodeURI(url), date]));
  assert.equal(urls.size, entries.length);
  assert.equal(entries.filter(([, , date]) => date).length, manifest.blog.length);
  const posts = manifest.blog.map(({ path, slug }) => {
    const frontmatter = readFileSync(join(process.env.CONTENT_DIR ?? "content", path), "utf8").split("---\n")[1];
    const data = parseYaml(frontmatter);
    assert.equal(urls.get(`${origin}/blog/${slug}/`), data.update_date ?? data.created_date, slug);
    return { issueNumber: data.issue_number, tags: data.tags ?? [] };
  });
  for (const tag of buildTagPages(posts)) {
    const nodes = page(`tags/${tag.key}/index.html`);
    assert.equal(meta(nodes).get("robots"), tag.indexable ? undefined : "noindex, follow", tag.key);
    assert.equal(urls.has(`${origin}${tag.path}`), tag.indexable, tag.key);
  }
});

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


function textOf(node) {
  return node.nodeName === "#text" ? node.value : (node.childNodes ?? []).map(textOf).join("");
}

test("published articles contain the static comment snapshot and link to their original Issues", async () => {
  const { issues } = JSON.parse(readFileSync("data/issue-comments/index.json", "utf8"));
  for (const { issue_number: issue, slug } of manifest.blog) {
    const file = `blog/${slug}/index.html`;
    const html = readFileSync(join(dist, file), "utf8");
    assert.doesNotMatch(html, /utteranc\.es|comments\.js/i, slug);
    const nodes = page(file);
    const section = nodes.find((node) => attr(node, "class") === "comments-section");
    assert.ok(section, slug);
    assert.ok(nodes.some((node) => attr(node, "href") === "#comments-title"), slug);
    const descendants = [...elements(section)];
    const issueUrl = `https://github.com/${manifest.repository}/issues/${issue}`;
    assert.equal(attr(descendants.find((node) => attr(node, "class") === "comments-action"), "href"), issueUrl);
    assert.ok(!descendants.some(({ tagName }) => ["iframe", "img", "script"].includes(tagName)), slug);
    const bodies = descendants.filter((node) => attr(node, "class") === "comment-body");
    const expected = issues[issue];
    assert.equal(bodies.length, expected?.length ?? 0, slug);
    if (!expected?.length) {
      const empty = descendants.find((node) => attr(node, "class") === "comments-empty");
      assert.equal(textOf(empty), expected ? "No comments yet." : "See the discussion on GitHub.");
      continue;
    }
    const permalinks = descendants.filter((node) => attr(node, "class") === "comment-date");
    assert.deepEqual(permalinks.map((link) => attr(link, "href")), expected.map(({ url }) => url));
    for (const [index, comment] of expected.entries()) {
      const expectedHtml = await renderComment(comment.body);
      assert.equal(textOf(bodies[index]), textOf(parse(expectedHtml)), comment.url);
      assert.ok(html.includes(expectedHtml), comment.url);
    }
  }
  const atom = readFileSync(join(dist, "atom.xml"), "utf8");
  assert.doesNotMatch(atom, /comments-section|comment-entry|utteranc\.es|comments\.js/i);
});
