import { renderMermaidSVG } from "beautiful-mermaid";
import { escapeHtml } from "./html.ts";

// Mermaid flowcharts are drawn at build time, so readers download no diagram script.
// The SVG keeps its colors in CSS variables (see .diagram in style.css) and follows the page's theme.

/** The author's accessible title and description, which Mermaid reads from the source and the renderer does not. */
function accessibleText(source: string) {
  let title = "";
  let description = "";
  const body = source
    .replace(/^[ \t]*accDescr[ \t]*\{([^}]*)\}[ \t]*$/gm, (_, text: string) => {
      description = text.trim().replace(/\s+/g, " ");
      return "";
    })
    .replace(/^[ \t]*(accTitle|accDescr)[ \t]*:[ \t]*(.*)$/gm, (_, key: string, text: string) => {
      if (key === "accTitle") title = text.trim();
      else description = text.trim();
      return "";
    });
  return { body, title, description };
}

/**
 * The HTML of one diagram, or undefined when the renderer cannot draw the source.
 * `id` keeps the ids of several diagrams on one page apart.
 */
export function renderDiagram(source: string, id: string): string | undefined {
  const { body, title, description } = accessibleText(source);
  let svg: string;
  try {
    // The renderer reads *…* as emphasis; Mermaid does not. U+2217 passes through and is swapped back below.
    svg = renderMermaidSVG(body.replaceAll("*", "\u2217"), { bg: "var(--paper)", fg: "var(--ink)", transparent: true });
  } catch {
    return undefined;
  }
  // The renderer's own stylesheet imports a web font and sets the font; the page's font is inherited instead.
  svg = svg
    .replaceAll("\u2217", "*")
    .replace(/^\s*@import url\([^)]*\);?\n/m, "")
    .replace(/^\s*text \{ font-family:[^}]*\}\n/m, "")
    .replace(/^(\s*)svg \{/m, "$1.diagram svg {")
    .replaceAll('id="arrowhead', `id="${id}-arrowhead`)
    .replaceAll("url(#arrowhead", `url(#${id}-arrowhead`);
  const root = /^<svg [^>]*?viewBox="([^"]+)"[^>]*? width="([\d.]+)"[^>]*? style="([^"]*)">/.exec(svg);
  if (!root) return undefined;
  const label = title || "Diagram";
  const named = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${root[1]}" role="img" aria-labelledby="${id}-title${description ? ` ${id}-desc` : ""}" style="--natural-width:${Math.round(Number(root[2]))}px;${root[3]}">` +
    `<title id="${id}-title">${escapeHtml(label)}</title>` +
    (description ? `<desc id="${id}-desc">${escapeHtml(description)}</desc>` : "");
  return (
    `<div class="diagram" role="region" tabindex="0" aria-label="Diagram, scroll horizontally">${named}${svg.slice(root[0].length)}</div>` +
    `<details class="diagram-source"><summary>Diagram source</summary><pre><code class="language-mermaid">${escapeHtml(source)}</code></pre></details>`
  );
}
