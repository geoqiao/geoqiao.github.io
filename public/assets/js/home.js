/* Geo's optional desktop card previews. Links are functional before this runs. */
(() => {
  "use strict";
  const desktop = matchMedia("(min-width: 1000px) and (hover: hover) and (pointer: fine)");
  const reduced = matchMedia("(prefers-reduced-motion: reduce)");

  for (const deck of document.querySelectorAll("[data-project-deck]")) {
    if (deck.hasAttribute("data-geo-ready")) continue;
    const cards = [...deck.querySelectorAll(".deck-card")];
    const closeButton = deck.querySelector(".deck-close");
    const hint = deck.querySelector(".deck-hint");
    const status = deck.querySelector("[data-deck-status]");
    if (!closeButton || !hint || !status || cards.length < 3) continue;

    let selected = null;
    let savedScroll = null;
    let manualScroll = false;
    let scrollFrame = 0;
    let resizeFrame = 0;
    const canPreview = () => desktop.matches && !reduced.matches && deck.clientWidth >= 920;
    const details = (card) => card.querySelector(".deck-details");

    function cancelScroll() {
      cancelAnimationFrame(scrollFrame);
      scrollFrame = 0;
    }

    // Follow the available scroll extent while the deck's padding expands.
    // A wheel/touch/scroll-key gesture always takes control away from this glide.
    function glide(target) {
      cancelScroll();
      const start = scrollY;
      const started = performance.now();
      function frame(now) {
        if (manualScroll) return;
        const t = Math.min((now - started) / 480, 1);
        const ease = t < .5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
        const limit = Math.max(0, document.documentElement.scrollHeight - innerHeight);
        window.scrollTo({ top: Math.max(0, Math.min(start + (target - start) * ease, limit)), behavior: "instant" });
        if (t < 1) scrollFrame = requestAnimationFrame(frame);
        else scrollFrame = 0;
      }
      scrollFrame = requestAnimationFrame(frame);
    }

    function position(card) {
      const slot = card.parentElement.getBoundingClientRect();
      const stage = deck.getBoundingClientRect();
      card.style.setProperty("--lift-x", `${stage.left + stage.width / 2 - slot.left - slot.width / 2}px`);
      card.style.setProperty("--lift-y", `${stage.top + 8 - slot.top}px`);
    }

    function close({ focus = false, restore = true } = {}) {
      if (!selected) return;
      const previous = selected;
      selected = null;
      cancelScroll();
      deck.classList.remove("deck-opened");
      previous.parentElement.classList.remove("is-selected");
      previous.setAttribute("aria-expanded", "false");
      details(previous).hidden = canPreview();
      closeButton.hidden = true;
      status.textContent = "Project preview closed.";
      if (focus) previous.focus({ preventScroll: true });
      if (restore && savedScroll !== null && !manualScroll && !reduced.matches) glide(savedScroll);
      savedScroll = null;
    }

    function open(card) {
      const first = selected === null;
      if (first) {
        savedScroll = scrollY;
        manualScroll = false;
      } else {
        selected.parentElement.classList.remove("is-selected");
        selected.setAttribute("aria-expanded", "false");
        details(selected).hidden = true;
      }
      selected = card;
      position(card);
      card.parentElement.classList.add("is-selected");
      card.setAttribute("aria-expanded", "true");
      details(card).hidden = false;
      // Leave a visible gap below the complete preview, even with long summaries.
      const scale = parseFloat(getComputedStyle(deck).getPropertyValue("--lift-scale"));
      const slotTop = card.parentElement.getBoundingClientRect().top - deck.getBoundingClientRect().top;
      const retreatDistance = Math.max(380, Math.ceil(card.offsetHeight * scale + 32 - slotTop));
      deck.style.setProperty("--retreat", `${retreatDistance}px`);
      deck.classList.add("deck-opened");
      closeButton.hidden = false;
      status.textContent = `${card.dataset.projectName} preview. Activate again to open the project, or press Escape to close.`;
      if (first) {
        const stage = deck.getBoundingClientRect();
        const retreat = parseFloat(getComputedStyle(deck).getPropertyValue("--retreat"));
        const totalHeight = stage.height + retreat;
        const target = scrollY + stage.top - Math.max(48, (innerHeight - totalHeight) / 2);
        if (stage.top < 24 || stage.bottom + retreat > innerHeight - 24) glide(Math.max(0, target));
      }
    }

    function configure() {
      const enable = canPreview();
      if (!enable) {
        close({ focus: document.activeElement === closeButton, restore: false });
        cancelScroll();
      }
      deck.classList.toggle("deck-enhanced", enable);
      hint.hidden = !enable;
      for (const card of cards) {
        details(card).hidden = enable && card !== selected;
        if (enable) {
          card.setAttribute("aria-expanded", String(card === selected));
          card.setAttribute("aria-controls", details(card).id);
          card.setAttribute("aria-describedby", hint.id);
        } else {
          card.removeAttribute("aria-expanded");
          card.removeAttribute("aria-controls");
          card.removeAttribute("aria-describedby");
        }
      }
      if (selected) position(selected);
    }

    for (const card of cards) {
      card.addEventListener("click", (event) => {
        if (!canPreview() || event.button !== 0 || event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (card === selected) return;
        event.preventDefault();
        open(card);
      });
    }
    closeButton.addEventListener("click", () => close({ focus: true }));
    document.addEventListener("click", (event) => {
      if (selected && !event.target.closest(".deck-card, .deck-close")) close();
    });
    document.addEventListener("keydown", (event) => {
      // Search and other controls own keys they have already handled.
      if (event.defaultPrevented || event.isComposing) return;
      if (["ArrowDown", "ArrowUp", "PageDown", "PageUp", "Home", "End", " "].includes(event.key)) {
        manualScroll = true;
        cancelScroll();
      } else if (event.key === "Escape" && selected) {
        event.preventDefault();
        close({ focus: deck.contains(document.activeElement) });
      }
    });
    const takeScrollControl = () => { manualScroll = true; cancelScroll(); };
    window.addEventListener("wheel", takeScrollControl, { passive: true });
    window.addEventListener("touchmove", takeScrollControl, { passive: true });
    // Scrollbar drags are pointer gestures outside the card's activation path.
    window.addEventListener("pointerdown", (event) => {
      if (selected && event.clientX >= document.documentElement.clientWidth) takeScrollControl();
    });
    desktop.addEventListener("change", configure);
    reduced.addEventListener("change", configure);
    window.addEventListener("resize", () => {
      cancelAnimationFrame(resizeFrame);
      resizeFrame = requestAnimationFrame(configure);
    });
    window.addEventListener("pagehide", () => { cancelScroll(); cancelAnimationFrame(resizeFrame); });
    // Guard repeated execution with presence, not the truthiness of an empty value.
    deck.setAttribute("data-geo-ready", "true");
    configure();
  }
})();
