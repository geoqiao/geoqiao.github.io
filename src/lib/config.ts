import { readFileSync } from "node:fs";
import { resolve } from "node:path";
import { parse } from "yaml";

export interface Link {
  name: string;
  url: string;
}

export interface ProjectEntry {
  slug: string;
  title: string;
  repository?: string;
  website?: string;
  summary?: string;
  image?: string;
  featured?: boolean;
  order?: number;
  links?: Link[];
  fallback_metadata?: { language?: string; topics?: string[] };
}

interface Config {
  github: { repo: string };
  site: {
    title: string;
    url: string;
    author: string;
    description: string;
    language: string;
    navigation?: { items?: Link[] };
  };
  profile?: { bio?: string; avatar?: string; links?: Link[] };
  paths?: { page_size?: number };
  seo?: { google_search_console?: string; social_image?: string; social_image_alt?: string };
  comments?: { enabled?: boolean; repo?: string };
  redirects?: Record<string, string>;
  projects?: ProjectEntry[];
}

// config.yaml is shared with escaping, which reads the repository, the allowed
// authors and the About Issue from it. The site reads the rest.
const config = parse(readFileSync(resolve(process.cwd(), "config.yaml"), "utf8")) as Config;

/** The origin without a trailing slash, e.g. https://geoqiao.me */
export const origin = config.site.url.replace(/\/+$/, "");

export const site = {
  title: config.site.title,
  author: config.site.author,
  description: config.site.description,
  language: config.site.language,
  url: `${origin}/`,
  repo: config.github.repo,
  navigation: config.site.navigation?.items ?? [],
  profile: {
    bio: config.profile?.bio ?? "",
    avatar: config.profile?.avatar ?? "",
    links: config.profile?.links ?? [],
  },
  seo: {
    googleSearchConsole: config.seo?.google_search_console ?? "",
    socialImage: config.seo?.social_image ?? "",
    socialImageAlt: config.seo?.social_image_alt ?? "",
  },
  comments: {
    enabled: config.comments?.enabled ?? false,
    repo: config.comments?.repo || config.github.repo,
  },
  pageSize: config.paths?.page_size ?? 10,
};

export const redirectMap: Record<string, string> = config.redirects ?? {};
export const projectEntries: ProjectEntry[] = config.projects ?? [];

/** The full address of a path of this site. */
export function absolute(path: string): string {
  return `${origin}${path}`;
}
