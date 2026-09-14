(() => {
  "use strict";
  const root = document.documentElement;
  const themeToggle = document.querySelector(".theme-toggle");
  const system = matchMedia("(prefers-color-scheme: dark)");
  let choice;
  try { choice = localStorage.getItem("geo-theme"); } catch { /* Private mode still works. */ }
  if (!["light", "dark"].includes(choice)) choice = null;

  function setAppearance(theme) {
    root.dataset.theme = theme;
    themeToggle.setAttribute("aria-pressed", String(theme === "dark"));
  }
  setAppearance(choice || (system.matches ? "dark" : "light"));
  system.addEventListener("change", () => {
    if (!choice) setAppearance(system.matches ? "dark" : "light");
  });
  themeToggle.addEventListener("click", () => {
    choice = root.dataset.theme === "dark" ? "light" : "dark";
    setAppearance(choice);
    try { localStorage.setItem("geo-theme", choice); } catch { /* Keep the in-memory choice. */ }
  });
  themeToggle.hidden = false;

  root.classList.add("js");

  const navigation = document.getElementById("site-navigation");
  const menu = document.querySelector(".navigation-toggle");
  if (navigation && menu) {
    const compactNavigation = matchMedia("(max-width: 1080px)");
    let lastNavigationFocus;
    function closeNavigation() {
      menu.setAttribute("aria-expanded", "false");
      navigation.classList.remove("is-open");
    }
    menu.addEventListener("click", () => {
      const open = menu.getAttribute("aria-expanded") !== "true";
      menu.setAttribute("aria-expanded", String(open));
      navigation.classList.toggle("is-open", open);
    });
    document.addEventListener("keydown", (event) => {
      if (event.key === "Escape" && menu.getAttribute("aria-expanded") === "true") {
        closeNavigation();
        menu.focus({ preventScroll: true });
      }
    });
    document.addEventListener("pointerdown", (event) => {
      if (!event.target.closest(".navigation-area")) closeNavigation();
    });
    document.addEventListener("focusin", (event) => {
      lastNavigationFocus = event.target;
      if (!event.target.closest(".navigation-area")) closeNavigation();
    });
    compactNavigation.addEventListener("change", () => {
      // A breakpoint may hide the focused element before this event runs.
      const active = document.activeElement === document.body ? lastNavigationFocus : document.activeElement;
      closeNavigation();
      if (compactNavigation.matches && navigation.contains(active)) menu.focus({ preventScroll: true });
      if (!compactNavigation.matches && active === menu) {
        (navigation.querySelector('[aria-current="page"]') || navigation.querySelector("a"))?.focus({ preventScroll: true });
      }
    });
    // Hide the compact fallback only once every disclosure handler is ready.
    root.classList.add("navigation-ready");
  }

  const body = document.querySelector(".post-content");
  if (!body) return;
  const headings = [...body.querySelectorAll("h1, h2, h3")];
  const toc = document.querySelector("[data-toc]");
  if (headings.length && toc) {
    const links = headings.map((heading, index) => {
      if (!heading.id) {
        let id = heading.textContent.trim().toLowerCase()
          .replace(/[^\p{L}\p{N}]+/gu, "-").replace(/^-|-$/g, "") || `section-${index + 1}`;
        while (document.getElementById(id)) id += "-section";
        heading.id = id;
      }
      heading.tabIndex = -1;
      const link = document.createElement("a");
      link.href = `#${encodeURIComponent(heading.id)}`;
      link.textContent = heading.textContent;
      link.dataset.level = heading.tagName.slice(1);
      toc.appendChild(link);
      return link;
    });
    const margin = document.querySelector(".reading-margin");
    margin.hidden = false;
    const details = document.querySelector(".toc");
    const compact = matchMedia("(max-width: 1160px)");
    details.open = !compact.matches;
    compact.addEventListener("change", () => { details.open = !compact.matches; });
    // Long TOCs scroll with the page, never in a nested or clipped panel.
    function sizeToc() {
      margin.classList.toggle("toc-long", details.scrollHeight > innerHeight - 96);
    }
    new ResizeObserver(sizeToc).observe(details);
    window.addEventListener("resize", sizeToc);
    details.addEventListener("toggle", sizeToc);
    sizeToc();
    let scheduled = false;
    function updateLocation() {
      // One scan per animation frame keeps the active heading in sync with scrolling.
      let active = 0;
      headings.forEach((heading, index) => {
        if (heading.getBoundingClientRect().top <= 160) active = index;
      });
      links.forEach((link, index) => {
        if (index === active) link.setAttribute("aria-current", "location");
        else link.removeAttribute("aria-current");
      });
      scheduled = false;
    }
    window.addEventListener("scroll", () => {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(updateLocation);
      }
    }, { passive: true });
    updateLocation();
    if (location.hash) {
      let target;
      try { target = headings.find((heading) => heading.id === decodeURIComponent(location.hash.slice(1))); } catch { /* An invalid fragment is not a reading error. */ }
      window.addEventListener("load", () => { target?.scrollIntoView(); }, { once: true });
    }
  }

  body.querySelectorAll("pre, table").forEach((element) => {
    element.tabIndex = 0;
    if (element.tagName === "PRE") element.setAttribute("role", "region");
    element.setAttribute("aria-label", element.tagName === "TABLE"
      ? "Table, scroll horizontally"
      : element.querySelector(".language-mermaid") || element.classList.contains("mermaid")
        ? "Diagram, scroll horizontally"
        : "Code, scroll horizontally");
  });
  body.querySelectorAll("pre > code:not(.language-mermaid)").forEach((code) => {
    const pre = code.parentElement;
    if (pre.classList.contains("mermaid")) return;
    const block = document.createElement("div");
    block.className = "code-block";
    const bar = document.createElement("div");
    bar.className = "code-tools";
    const language = document.createElement("span");
    language.className = "code-language";
    language.textContent = [...code.classList].find(name => name.startsWith("language-"))?.slice(9) || "text";
    const button = document.createElement("button");
    button.type = "button";
    button.className = "copy-code";
    button.textContent = "Copy code";
    button.setAttribute("aria-live", "polite");
    button.addEventListener("click", async () => {
      try {
        await navigator.clipboard.writeText(code.textContent);
        button.textContent = "Copied";
      } catch {
        button.textContent = "Select the code to copy manually";
      }
    });
    bar.append(language, button);
    pre.before(block);
    block.append(bar, pre);
  });
})();
