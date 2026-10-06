import type { APIRoute } from "astro";
import { posts } from "../lib/content";
import { getProjects } from "../lib/projects";

// Read by /assets/js/search.js: titles, summaries and tags of published content.
export const GET: APIRoute = async () => {
  const items = [
    ...posts.map((post) => ({
      title: post.title,
      description: post.description,
      tags: post.tags.map((tag) => tag.name),
      type: "Blog",
      url: post.path,
    })),
    ...(await getProjects()).map((project) => ({
      title: project.title,
      description: project.summary,
      tags: project.topics,
      type: "Project",
      url: project.path,
    })),
  ];
  return new Response(JSON.stringify({ version: 1, items }), {
    headers: { "content-type": "application/json; charset=utf-8" },
  });
};
