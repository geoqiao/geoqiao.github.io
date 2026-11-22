import assert from "node:assert/strict";
import { mkdtemp, readFile, rm, writeFile } from "node:fs/promises";
import { tmpdir } from "node:os";
import { join } from "node:path";
import { test } from "node:test";
import { renderComment } from "../src/lib/comments.ts";
import { syncIssueComments } from "../scripts/sync-issue-comments.mjs";

const repo = "geoqiao/geoqiao.github.io";
const root = `https://api.github.com/repos/${repo}`;
const issueUrl = (number) => `${root}/issues/${number}`;
const makeComment = (id, issue, body = `Comment ${id}`) => ({
  id, issue_url: issueUrl(issue), body,
  user: { login: "reader", avatar_url: null, email: "ignored" },
  author_association: "NONE", created_at: "2026-11-22T00:00:00Z", updated_at: "2026-11-22T01:00:00Z",
  author_email: "ignored",
});
const json = (value, headers) => Response.json(value, { headers });

async function fixture(t, blog, fetcher, previous) {
  const dir = await mkdtemp(join(tmpdir(), "geo-comments-test-"));
  t.after(() => rm(dir, { force: true, recursive: true }));
  await writeFile(join(dir, "manifest.json"), JSON.stringify({ repository: repo, blog: blog.map((issue_number) => ({ issue_number })) }));
  const snapshotPath = join(dir, "index.json");
  if (previous) await writeFile(snapshotPath, JSON.stringify({ issues: previous, avatars: {} }));
  return {
    read: () => readFile(snapshotPath, "utf8"),
    sync: (issue) => syncIssueComments({
      contentDir: dir, snapshotPath, token: "test-token", issue,
      fetcher: (url, options) => url === root
        ? json({ private: false, visibility: "public", id: 123 })
        : fetcher(url, options),
    }),
  };
}

test("full sync walks both paginated lists, filters PR and unpublished comments, and prunes stale snapshots", async (t) => {
  const lists = new Map([
    [`${root}/issues?state=all&per_page=100`, json(
      [{ number: 18 }, { number: 20, pull_request: {} }, { number: 99 }],
      { link: '<https://api.github.com/repositories/123/issues?page=2>; rel="next"' },
    )],
    ["https://api.github.com/repositories/123/issues?page=2", json([{ number: 129 }])],
    [`${root}/issues/comments?per_page=100`, json(
      [makeComment(21, 20), makeComment(22, 99), makeComment(25, 18)],
      { link: '<https://api.github.com/repositories/123/issues/comments?page=2>; rel="next"' },
    )],
    ["https://api.github.com/repositories/123/issues/comments?page=2", json([makeComment(24, 18)])],
  ]);
  const f = await fixture(t, [18, 20, 129], (url) => lists.get(url), { 19: [{ body: "retired" }] });
  assert.deepEqual(await f.sync(), { issues: 2, comments: 2 });
  const { issues, avatars } = JSON.parse(await f.read());
  assert.deepEqual(Object.keys(issues), ["18", "129"]);
  assert.deepEqual(issues[129], []);
  assert.deepEqual(issues[18].map(({ id }) => id), [24, 25]);
  assert.deepEqual(Object.keys(issues[18][0]), [
    "id", "url", "author", "avatarUrl", "authorAssociation", "createdAt", "updatedAt", "body",
  ]);
  assert.equal(issues[18][0].url, `https://github.com/${repo}/issues/18#issuecomment-24`);
  assert.deepEqual(avatars, {});
});

test("incremental sync skips unpublished Issues and PRs, replaces edits and deletions, and leaves other entries intact", async (t) => {
  let comments = [makeComment(1, 18, "edited")];
  const requests = [];
  const f = await fixture(t, [18, 20, 129], (url) => {
    requests.push(url);
    if (url === issueUrl(18)) return json({ number: 18 });
    if (url === issueUrl(20)) return json({ number: 20, pull_request: {} });
    assert.equal(url, `${issueUrl(18)}/comments?per_page=100`);
    return json(comments);
  }, { 18: [{ id: 1, body: "old" }, { id: 2, body: "deleted" }], 129: [] });
  assert.deepEqual(await f.sync(91), { skipped: true });
  assert.deepEqual(requests, []);
  assert.deepEqual(await f.sync(20), { skipped: true });
  await f.sync(18);
  let { issues } = JSON.parse(await f.read());
  assert.deepEqual(issues[18].map(({ id, body }) => [id, body]), [[1, "edited"]]);
  assert.deepEqual(issues[129], []);
  comments = [];
  await f.sync(18);
  ({ issues } = JSON.parse(await f.read()));
  assert.deepEqual(issues, { 18: [], 129: [] });
  const current = await f.read();
  await f.sync(18);
  assert.equal(await f.read(), current);
});

for (const status of [403, 429, 500, "network"]) {
  test(`a ${status} failure on a later page preserves the entire previous snapshot`, async (t) => {
    const f = await fixture(t, [18, 129], (url) => {
      if (url === `${root}/issues?state=all&per_page=100`) return json([{ number: 18 }]);
      if (url === `${root}/issues/comments?per_page=100`) {
        return json([makeComment(2, 18)], { link: `<${root}/issues/comments?page=2>; rel="next"` });
      }
      if (status === "network") throw new TypeError("fetch failed");
      return new Response("", { status });
    }, { 18: [{ id: 1, body: "old" }], 129: [] });
    const before = await f.read();
    await assert.rejects(f.sync(), status === "network" ? /fetch failed/ : new RegExp(`HTTP ${status}`));
    assert.equal(await f.read(), before);
  });
}

test("comment formatting keeps the safe Markdown subset", async () => {
  const html = await renderComment([
    "A **bold** *italic* ~~strike~~ and `code`.",
    "> Quote",
    "- Item",
    "2. Numbered",
    "```js\n<sample>\n```",
    "https://example.com/",
  ].join("\n\n"));
  for (const tag of ["strong", "em", "del", "code", "pre", "blockquote", "ul", "ol", "li"]) assert.match(html, new RegExp(`<${tag}[ >]`));
  assert.match(html, /&#x3C;sample>/);
  assert.match(html, /href="https:\/\/example\.com\/" rel="nofollow noopener noreferrer"/);
});

test("comments cannot emit raw markup, unsafe links, or automatic media", async () => {
  const html = await renderComment([
    "<script>alert('script')</script>",
    '<img src="https://example.com/tracker.gif" onerror="alert(1)">',
    'Text <iframe src="https://example.com/"></iframe> and <a href="#bad" onclick="x()">raw link</a>.',
    "[bad](jAvAsCrIpT:alert(1)) [encoded](java&#x73;cript:alert(1)) [relative](//example.com/tracker) [mail](mailto:example@example.com)",
    "![Tracked image](https://example.com/image.png)",
    "[**![Nested image](https://example.com/hide.gif)**](https://example.com/outer)",
    "![Unsafe image](data:image/gif;base64,R0lGODlh)",
  ].join("\n\n"));
  assert.doesNotMatch(html, /<script|<img|<iframe|onclick|onerror|javascript:|mailto:|tracker|href="\/\//i);
  assert.match(html, /href="https:\/\/example\.com\/image\.png" rel="nofollow noopener noreferrer">Tracked image<\/a>/);
  assert.match(html, /href="https:\/\/example\.com\/outer" rel="nofollow noopener noreferrer"><strong>Nested image<\/strong><\/a>/);
  assert.match(html, /<p>Unsafe image<\/p>/);
});


test("avatar fetches omit credentials and upstream failure preserves the last successful snapshot", async (t) => {
  const url = "https://avatars.githubusercontent.com/u/456?v=4";
  const comment = makeComment(2, 18);
  comment.user.avatar_url = url;
  let status = 503;
  const f = await fixture(t, [18], (requestUrl, { headers }) => {
    if (requestUrl === issueUrl(18)) return json({ number: 18 });
    if (requestUrl === `${issueUrl(18)}/comments?per_page=100`) return json([comment]);
    assert.equal(requestUrl, `${url}&s=64`);
    assert.equal(headers, undefined);
    return new Response(null, { status });
  }, { 18: [{ id: 1, body: "old" }] });
  const previous = await f.read();
  await assert.rejects(f.sync(18), /avatar returned HTTP 503/);
  assert.equal(await f.read(), previous);
  status = 404;
  await f.sync(18);
  const { issues, avatars } = JSON.parse(await f.read());
  assert.equal(issues[18][0].id, 2);
  assert.deepEqual(avatars, {});
});
