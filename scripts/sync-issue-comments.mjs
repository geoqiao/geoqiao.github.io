import { randomUUID } from "node:crypto";
import { mkdir, readFile, rename, rm, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { pathToFileURL } from "node:url";

const apiOrigin = "https://api.github.com";
const repo = "geoqiao/geoqiao.github.io";
const repoPath = `/repos/${repo}`;
const githubAvatar = /^https:\/\/avatars\.githubusercontent\.com\/u\/\d+(?:\?v=\d+)?$/;
const issueUrl = (number) => `${apiOrigin}${repoPath}/issues/${number}`;

function githubClient(fetcher, token) {
  const headers = {
    accept: "application/vnd.github+json",
    authorization: `Bearer ${token}`,
  };

  async function request(url) {
    const response = await fetcher(url, {
      headers, redirect: "error", signal: AbortSignal.timeout(20_000),
    });
    if (!response.ok) throw new Error(`GitHub returned HTTP ${response.status} for ${new URL(url).pathname}`);
    return { data: await response.json(), link: response.headers.get("link") ?? "" };
  }

  async function* pages(first, repositoryId) {
    const endpoint = new URL(first);
    const canonicalPath = endpoint.pathname.replace(repoPath, `/repositories/${repositoryId}`);
    const visited = new Set();
    let url = endpoint.href;
    while (url) {
      const page = new URL(url);
      if (page.origin !== apiOrigin || ![endpoint.pathname, canonicalPath].includes(page.pathname) || visited.has(url)) {
        throw new Error("Unexpected GitHub pagination URL");
      }
      visited.add(url);
      const { data, link } = await request(url);
      if (!Array.isArray(data)) throw new Error("Expected a paginated GitHub list");
      yield* data;
      url = /<([^>]+)>;\s*rel="next"/.exec(link)?.[1];
    }
  }

  return { request, pages };
}

// Inline a small GitHub-hosted avatar so rendering requires no third-party request.
// The map deduplicates downloads and the resulting data across all comments.
async function avatarData(url, fetcher) {
  if (!url) return null;
  const avatar = new URL(url);
  avatar.searchParams.set("s", "64");
  const response = await fetcher(avatar.href, { redirect: "error", signal: AbortSignal.timeout(8_000) });
  if (response.status === 404 || response.status === 410) return null;
  if (!response.ok) throw new Error(`GitHub avatar returned HTTP ${response.status}`);
  const type = response.headers.get("content-type");
  if (!/^image\/(?:png|jpeg|webp|gif)$/.test(type ?? "")) return null;
  const image = Buffer.from(await response.arrayBuffer());
  return image.length > 0 && image.length <= 32_768 ? `data:${type};base64,${image.toString("base64")}` : null;
}

function publicComment(comment, number) {
  const { id, body, user, author_association, created_at, updated_at } = comment;
  if (
    !Number.isSafeInteger(id) || id <= 0 || typeof body !== "string" ||
    ![created_at, updated_at].every((date) => typeof date === "string" && /^\d{4}-\d\d-\d\dT\d\d:\d\d:\d\dZ$/.test(date))
  ) throw new Error(`Unexpected comment data for Issue #${number}`);
  return {
    id,
    url: `https://github.com/${repo}/issues/${number}#issuecomment-${id}`,
    author: user?.login ?? "ghost",
    avatarUrl: githubAvatar.test(user?.avatar_url ?? "") ? user.avatar_url : null,
    authorAssociation: author_association ?? "NONE",
    createdAt: created_at,
    updatedAt: updated_at,
    body,
  };
}

export async function syncIssueComments({
  contentDir = process.env.CONTENT_DIR || "content",
  snapshotPath = "data/issue-comments/index.json",
  fetcher = fetch,
  token = process.env.GITHUB_TOKEN,
  issue,
} = {}) {
  const manifest = JSON.parse(await readFile(join(contentDir, "manifest.json"), "utf8"));
  if (manifest.repository !== repo || !Array.isArray(manifest.blog)) throw new Error("Invalid blog manifest");
  const published = new Set(manifest.blog.map(({ issue_number }) => {
    if (!Number.isSafeInteger(issue_number) || issue_number <= 0) throw new Error("Invalid manifest Issue number");
    return issue_number;
  }));
  if (issue !== undefined && !published.has(issue)) return { skipped: true };
  if (!token) throw new Error("Set GITHUB_TOKEN to sync public Issue comments");

  const github = githubClient(fetcher, token);
  const { data: repository } = await github.request(`${apiOrigin}${repoPath}`);
  if (repository.private !== false || repository.visibility !== "public" || !Number.isSafeInteger(repository.id)) {
    throw new Error("Comment snapshots require a public source repository");
  }

  let previousText;
  try {
    previousText = await readFile(snapshotPath, "utf8");
  } catch (error) {
    if (error.code !== "ENOENT") throw error;
  }
  const previous = previousText ? JSON.parse(previousText) : { issues: {}, avatars: {} };
  const issues = issue === undefined ? {} : { ...previous.issues };
  if (issue !== undefined) {
    const { data } = await github.request(issueUrl(issue));
    if (data.number !== issue) throw new Error(`Unexpected GitHub response for Issue #${issue}`);
    if (data.pull_request) return { skipped: true };
    issues[issue] = [];
    for await (const comment of github.pages(`${issueUrl(issue)}/comments?per_page=100`, repository.id)) {
      issues[issue].push(publicComment(comment, issue));
    }
  } else {
    const base = `${apiOrigin}${repoPath}/issues`;
    for await (const entry of github.pages(`${base}?state=all&per_page=100`, repository.id)) {
      if (published.has(entry.number) && !entry.pull_request) issues[entry.number] = [];
    }
    for await (const comment of github.pages(`${base}/comments?per_page=100`, repository.id)) {
      const number = Number(comment.issue_url?.slice(base.length + 1));
      if (comment.issue_url === issueUrl(number) && Object.hasOwn(issues, number)) {
        issues[number].push(publicComment(comment, number));
      }
    }
  }

  for (const comments of Object.values(issues)) {
    comments.sort((a, b) => a.id - b.id);
  }
  const refreshed = issue === undefined ? Object.values(issues).flat() : issues[issue];
  const avatarUrls = new Set(Object.values(issues).flat().map(({ avatarUrl }) => avatarUrl).filter(Boolean));
  const refreshAvatars = new Set(refreshed.map(({ avatarUrl }) => avatarUrl));
  // Reuse cached avatars for authors outside this refresh. Drop unreferenced entries.
  const avatars = {};
  for (const url of [...avatarUrls].sort()) {
    const image = refreshAvatars.has(url) ? await avatarData(url, fetcher) : previous.avatars[url];
    if (image) avatars[url] = image;
  }

  const next = JSON.stringify({ issues, avatars }, null, 2) + "\n";
  if (next !== previousText) {
    await mkdir(dirname(snapshotPath), { recursive: true });
    const temp = `${snapshotPath}.${randomUUID()}.tmp`;
    try {
      await writeFile(temp, next, { flag: "wx" });
      await rename(temp, snapshotPath);
    } finally {
      await rm(temp, { force: true });
    }
  }
  return { issues: Object.keys(issues).length, comments: Object.values(issues).flat().length };
}

if (process.argv[1] && import.meta.url === pathToFileURL(resolve(process.argv[1])).href) {
  try {
    const args = process.argv.slice(2);
    if (args.length && !(args.length === 2 && args[0] === "--issue" && /^[1-9]\d*$/.test(args[1]) && Number.isSafeInteger(Number(args[1])))) {
      throw new Error("Usage: node scripts/sync-issue-comments.mjs [--issue <number>]");
    }
    const result = await syncIssueComments({ issue: args.length ? Number(args[1]) : undefined });
    console.log(result.skipped
      ? "Skipped: this is not a published blog Issue."
      : `Snapshot contains ${result.comments} comments across ${result.issues} published Issues.`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
