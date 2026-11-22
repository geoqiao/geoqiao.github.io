// Presentation choices of geoqiao.me. Identity, projects and redirects stay in config.yaml.

/** Blog Issue numbers shown under "Featured writing" on Home, in this order. */
export const featuredPosts = [41, 67, 49];

/** Show the escaping link in the footer. */
export const showPoweredBy = true;

/** Bespoke 4:3 brand cover artworks for homepage deck cards; unlisted projects fall back to project.image. */
export const deckCovers: Record<string, string> = {
  escaping: "/assets/images/projects/cover-escaping.svg",
  md2xarticle: "/assets/images/projects/cover-md2xarticle.svg",
  "boji-club": "/assets/images/projects/cover-boji-club.svg",
};
