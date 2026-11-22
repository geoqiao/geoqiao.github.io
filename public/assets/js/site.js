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
    const target = root.dataset.theme === "dark" ? "light" : "dark";
    choice = target === (system.matches ? "dark" : "light") ? null : target;
    setAppearance(target);
    try {
      if (choice) localStorage.setItem("geo-theme", choice);
      else localStorage.removeItem("geo-theme");
    } catch { /* Keep the in-memory choice. */ }
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

    // Headroom: on compact screens the sticky header leaves on scroll down and returns on scroll up.
    const header = document.querySelector(".site-header");
    let lastY = scrollY;
    let hidden = false;
    let frame = 0;
    function setHidden(next) {
      if (next === hidden) return;
      hidden = next;
      header.classList.toggle("is-hidden", next);
    }
    function updateHeader() {
      frame = 0;
      const max = root.scrollHeight - innerHeight;
      const y = scrollY;
      // Elastic overscroll reports positions outside the document; ignore it.
      if (y < 0 || y > max) return;
      const delta = y - lastY;
      if (!compactNavigation.matches || y < header.offsetHeight
        || menu.getAttribute("aria-expanded") === "true" || header.contains(document.activeElement)) {
        setHidden(false);
        lastY = y;
      } else if (Math.abs(delta) > 6) {
        setHidden(delta > 0);
        lastY = y;
      }
    }
    window.addEventListener("scroll", () => { frame ||= requestAnimationFrame(updateHeader); }, { passive: true });
    header.addEventListener("focusin", () => setHidden(false));
    compactNavigation.addEventListener("change", () => setHidden(false));
  }

  const body = document.querySelector(".post-content");
  if (!body) return;
  const headings = [...body.querySelectorAll("h1[id], h2[id], h3[id]")];
  const lists = [...document.querySelectorAll("[data-toc]")].map((nav) => [...nav.querySelectorAll("a")]);
  if (headings.length && lists.length) {
    const desktopToc = document.querySelector(".reading-margin [data-toc]");
    let current = -1;
    let scheduled = false;
    function updateLocation() {
      scheduled = false;
      let active = 0;
      headings.forEach((heading, index) => {
        if (heading.getBoundingClientRect().top <= 160) active = index;
      });
      if (active === current) return;
      for (const links of lists) {
        links[current]?.removeAttribute("aria-current");
        links[active].setAttribute("aria-current", "location");
      }
      current = active;
      // Move only the sidebar's scroll position, never the article or keyboard focus.
      const link = desktopToc?.querySelector('[aria-current="location"]');
      if (link && desktopToc.clientHeight && !desktopToc.matches(":focus-within")) {
        const viewport = desktopToc.getBoundingClientRect();
        const item = link.getBoundingClientRect();
        const offset = item.top < viewport.top ? item.top - viewport.top : Math.max(0, item.bottom - viewport.bottom);
        desktopToc.scrollTo({ top: desktopToc.scrollTop + offset });
      }
    }
    function scheduleLocation() {
      if (!scheduled) {
        scheduled = true;
        requestAnimationFrame(updateLocation);
      }
    }
    window.addEventListener("scroll", scheduleLocation, { passive: true });
    window.addEventListener("resize", scheduleLocation);
    updateLocation();
  }

  const headingStatus = document.querySelector("[data-heading-status]");
  if (headingStatus && navigator.clipboard?.writeText) {
    body.querySelectorAll(".heading-anchor").forEach((anchor) => {
      anchor.title = "复制章节链接";
      anchor.addEventListener("click", async (event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        try {
          await navigator.clipboard.writeText(anchor.href);
        } catch {
          return; // The native link still jumps to the heading.
        }
        headingStatus.textContent = "已复制章节链接";
        const mark = anchor.firstElementChild;
        mark.textContent = "✓";
        window.setTimeout(() => { mark.textContent = "#"; }, 1500);
      });
    });
  }

  body.querySelectorAll("pre").forEach((element) => {
    element.tabIndex = 0;
    element.setAttribute("role", "region");
    element.setAttribute("aria-label", element.querySelector(".language-mermaid")
      ? "Diagram source, scroll horizontally"
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

// Name the link that opens an article so its title can glide into the heading (style.css names the heading).
// Only one element carries the name at a time. Without a transition (reduced motion, no support) this does nothing.
addEventListener("pageswap", (event) => {
  if (!event.viewTransition || !event.activation?.entry) return;
  const { pathname } = new URL(event.activation.entry.url);
  if (!/^\/blog\/[^/]+\/$/.test(pathname)) return;
  const link = [...document.querySelectorAll(".entry h2 a, .home-writing a")].find((a) => a.pathname === pathname);
  const title = link?.closest(".home-writing") ? link.firstElementChild : link;
  if (!title) return;
  title.style.viewTransitionName = "post-title";
  event.viewTransition.finished.finally(() => { title.style.viewTransitionName = ""; });
});
