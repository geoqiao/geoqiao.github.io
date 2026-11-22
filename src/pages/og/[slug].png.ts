import type { APIRoute, GetStaticPaths, InferGetStaticPropsType } from "astro";
import { posts } from "../../lib/content";
import { loadOgAssets, renderOgImage } from "../../lib/og-image";

export const getStaticPaths = (() =>
  posts.map((post) => ({ params: { slug: post.slug }, props: { title: post.title } }))
) satisfies GetStaticPaths;

let assets: ReturnType<typeof loadOgAssets> | undefined;

export const GET: APIRoute<InferGetStaticPropsType<typeof getStaticPaths>> = async ({ props }) => {
  assets ??= loadOgAssets(posts.map((post) => post.title));
  const png = await renderOgImage(props, await assets);
  return new Response(new Uint8Array(png), { headers: { "Content-Type": "image/png" } });
};
