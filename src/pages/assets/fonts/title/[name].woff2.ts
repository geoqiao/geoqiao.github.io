import type { APIRoute } from "astro";
import { posts } from "../../../../lib/content";
import { titleFont, titleFontFile } from "../../../../lib/title-font";

// One small subset of Noto Serif SC per article that has Chinese headings; Base.astro links it.
export async function getStaticPaths() {
  const fonts = (await Promise.all(posts.map(titleFont))).filter((font) => font !== null);
  return fonts.map((font) => ({ params: { name: font.name }, props: { font } }));
}

export const GET: APIRoute = async ({ props }) => {
  const file = await titleFontFile(props.font);
  return new Response(new Uint8Array(file), { headers: { "Content-Type": "font/woff2" } });
};
