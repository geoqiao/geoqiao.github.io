import { projectEntries, type Link } from "./config";

export interface Project {
  slug: string;
  title: string;
  repository: string;
  summary: string;
  /** The project's page on this site. */
  path: string;
  featured: boolean;
  language: string | null;
  topics: string[];
  image: string;
  links: Link[];
}

interface Repository {
  language: string | null;
  topics: string[];
}

/** Language and topics from GitHub; null when GitHub cannot be reached. */
async function fetchRepository(repository: string): Promise<Repository | null> {
  const token = process.env.GITHUB_TOKEN;
  try {
    const response = await fetch(`https://api.github.com/repos/${repository}`, {
      headers: {
        accept: "application/vnd.github+json",
        "user-agent": "geoqiao.me",
        ...(token ? { authorization: `Bearer ${token}` } : {}),
      },
      signal: AbortSignal.timeout(10_000),
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    const data = (await response.json()) as { language?: string | null; topics?: string[] };
    return { language: data.language ?? null, topics: data.topics ?? [] };
  } catch (error) {
    console.warn(`Project ${repository}: GitHub metadata unavailable (${error}); using config.yaml.`);
    return null;
  }
}

async function load(): Promise<Project[]> {
  const entries = [...projectEntries].sort(
    (a, b) => (a.order ?? 0) - (b.order ?? 0) || a.slug.localeCompare(b.slug),
  );
  return Promise.all(
    entries.map(async (entry) => {
      const fallback = entry.fallback_metadata ?? {};
      // PROJECT_METADATA=offline builds without the network, from config.yaml alone.
      const fetched =
        entry.repository && process.env.PROJECT_METADATA !== "offline"
          ? await fetchRepository(entry.repository)
          : null;
      return {
        slug: entry.slug,
        title: entry.title,
        repository: entry.repository ?? "",
        summary: entry.summary ?? "",
        path: `/projects/${entry.slug}/`,
        featured: entry.featured ?? false,
        language: fetched?.language || fallback.language || null,
        topics: fetched?.topics.length ? fetched.topics : (fallback.topics ?? []),
        image: entry.image ?? "",
        links: entry.links ?? [],
      };
    }),
  );
}

let loaded: Promise<Project[]> | undefined;

/** The projects of config.yaml, in their configured order. */
export function getProjects(): Promise<Project[]> {
  return (loaded ??= load());
}
