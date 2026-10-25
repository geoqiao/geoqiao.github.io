/* Geo's optional desktop card fan. Links are functional before this runs. */
(() => {
  "use strict";
  const desktop = matchMedia("(min-width: 1000px) and (hover: hover) and (pointer: fine)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  for (const deck of document.querySelectorAll("[data-project-deck]")) {
    if (deck.hasAttribute("data-geo-ready")) continue;
    if (deck.querySelectorAll(".deck-card").length < 3) continue;

    let resizeFrame = 0;
    const configure = () => deck.classList.toggle("deck-enhanced", desktop.matches && !reduced.matches && deck.clientWidth >= 920);

    desktop.addEventListener("change", configure);
    reduced.addEventListener("change", configure);
    window.addEventListener("resize", () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(configure);
    });
    window.addEventListener("pagehide", () => cancelAnimationFrame(resizeFrame));
    // Guard repeated execution with presence, not the truthiness of an empty value.
    deck.setAttribute("data-geo-ready", "true");
    configure();
  }
})();
