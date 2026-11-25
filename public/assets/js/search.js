(() => {
  "use strict";
  const script = document.querySelector("script[data-search-index]");
  const dialog = document.querySelector("#site-search");
  const trigger = document.querySelector(".search-toggle");
  if (!script || !dialog || !trigger || typeof dialog.showModal !== "function") return;

  const form = dialog.querySelector("form");
  const query = dialog.querySelector("#search-query");
  const results = dialog.querySelector(".search-results");
  const status = dialog.querySelector(".search-status");
  const error = dialog.querySelector(".search-error");
  let items = null;
  let pending = null;
  let agentRequest = null;
  let returnFocus = null;
  let composing = false;
  const resultLimit = 20;
  const normalize = value => value.normalize("NFKC").toLowerCase();

  function validItem(item) {
    if (!item || typeof item.title !== "string" || typeof item.description !== "string"
      || !["Blog", "Idea", "Project"].includes(item.type)
      || !Array.isArray(item.tags) || !item.tags.every(tag => typeof tag === "string")
      || typeof item.url !== "string") return false;
    // Even a malformed/replaced static response must not create executable links.
    if (!/^(https:\/\/|\/(?!\/))/.test(item.url) || /[\s\\\u0000-\u001f]/u.test(item.url)) return false;
    try {
      const url = new URL(item.url, location.origin);
      return !url.username && !url.password
        && (item.url.startsWith("/") ? url.origin === location.origin : url.protocol === "https:");
    } catch { return false; }
  }

  function find(value, blogOnly = false) {
    const words = normalize(value).trim().split(/\s+/u).filter(Boolean);
    return items.map(item => {
      if (blogOnly && item.type !== "Blog") return null;
      const title = normalize(item.title);
      const tags = normalize(item.tags.join(" "));
      const description = normalize(item.description);
      let score = 0;
      for (const word of words) {
        if (title.includes(word)) score += 3;
        else if (tags.includes(word)) score += 2;
        else if (description.includes(word)) score += 1;
        else return null;
      }
      return { item, score };
    }).filter(Boolean).sort((a, b) => b.score - a.score).map(({ item }) => item);
  }

  function render(matches, value, blogOnly = false) {
    results.replaceChildren();
    for (const item of matches.slice(0, resultLimit)) {
      const li = document.createElement("li");
      const link = document.createElement("a");
      link.href = item.url;
      for (const [className, text] of [
        ["search-result-type", item.type],
        ["search-result-title", item.title],
        ["search-result-description", item.description],
      ]) {
        const span = document.createElement("span");
        span.className = className;
        span.textContent = text;
        link.append(span);
      }
      li.append(link);
      results.append(li);
    }
    results.scrollTop = 0;
    if (!items.length) status.textContent = "No published content to search yet.";
    else if (!matches.length) status.textContent = blogOnly
      ? "No results. Try a title, topic or tag."
      : "No results. Try a title, topic or project name.";
    else if (!normalize(value).trim()) status.textContent = "Browse recent writing, ideas and projects.";
    else status.textContent = `${matches.length} result${matches.length === 1 ? "" : "s"}${matches.length > resultLimit ? ` · Showing the first ${resultLimit}; refine your search` : ""}.`;
  }

  function renderVisitorResults() {
    if (items !== null) render(find(query.value), query.value);
  }

  function showLoadError() {
    status.textContent = "Could not load search. Retry or browse the archives.";
    error.hidden = false;
  }

  function load() {
    if (pending) return pending;
    error.hidden = true;
    status.textContent = "Loading search…";
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), 10_000);
    pending = (async () => {
      try {
        const response = await fetch(script.dataset.searchIndex, {
          signal: controller.signal, credentials: "omit", mode: "same-origin",
        });
        if (!response.ok) throw new Error("Search unavailable");
        const data = await response.json();
        if (data?.version !== 1 || !Array.isArray(data.items) || !data.items.every(validItem)) {
          throw new Error("Invalid search index");
        }
        items = data.items;
      } catch {
        // Let each caller report the failure if it still owns the search UI.
      } finally {
        clearTimeout(timer);
        pending = null;
      }
    })();
    return pending;
  }

  async function refresh() {
    if (agentRequest) return;
    if (items === null) await load();
    if (agentRequest || !dialog.open) return;
    if (items === null) showLoadError();
    else renderVisitorResults();
  }

  // iOS keeps the layout viewport under the keyboard, so size the sheet to the visible area.
  const viewport = window.visualViewport;
  function fit() {
    if (viewport) dialog.style.setProperty("--search-max-height", `${viewport.height}px`);
  }
  viewport?.addEventListener("resize", fit);

  function showSearchDialog(event) {
    if (!dialog.open) {
      returnFocus = event?.currentTarget === trigger || document.activeElement === document.body
        ? trigger : document.activeElement;
      dialog.showModal();
      document.documentElement.classList.add("search-open");
    }
    fit();
    query.focus();
  }

  function open(event) {
    showSearchDialog(event);
    refresh();
  }

  async function searchForAgent(value) {
    const term = value.trim();
    const request = {};
    agentRequest = request;
    try {
      if (!normalize(term).trim() || value.length > query.maxLength) {
        return { query: term, error: "Enter a search term of 1–200 characters." };
      }

      showSearchDialog();
      results.replaceChildren();
      if (items === null) await load();
      if (items === null) {
        if (agentRequest === request) showLoadError();
        return { query: term, error: "Could not load the search index." };
      }

      const matches = find(term, true);
      if (agentRequest === request && dialog.open) render(matches, term, true);
      return {
        query: term,
        total: matches.length,
        results: matches.slice(0, resultLimit).map(({ title, date, tags, description, url }) => ({
          title, date: typeof date === "string" ? date : null, tags, description, url: new URL(url, location.origin).href,
        })),
      };
    } finally {
      if (agentRequest === request) agentRequest = null;
    }
  }

  const modelContext = document.modelContext;
  const toolEventTarget = type => `on${type}` in (modelContext ?? {}) ? modelContext : window;
  const toolName = form.getAttribute("toolname");
  toolEventTarget("toolactivated").addEventListener("toolactivated", event => {
    if (event.toolName === toolName && agentRequest && dialog.open) {
      status.textContent = "Searching blog posts…";
    }
  });
  toolEventTarget("toolcancel").addEventListener("toolcancel", event => {
    if (event.toolName !== toolName) return;
    if (agentRequest && dialog.open) status.textContent = "Search canceled.";
    agentRequest = null;
  });

  trigger.hidden = false;
  trigger.addEventListener("click", open);
  dialog.querySelector(".search-close").addEventListener("click", () => dialog.close());
  dialog.querySelector(".search-retry").addEventListener("click", () => { refresh(); query.focus(); });
  form.addEventListener("submit", event => {
    event.preventDefault();
    if (event.agentInvoked) {
      event.respondWith(searchForAgent(query.value));
      return;
    }
    if (!composing) results.querySelector("a")?.click();
  });
  query.addEventListener("compositionstart", () => { composing = true; });
  function updateVisitorResults() {
    agentRequest = null;
    if (composing) return;
    if (pending) refresh();
    else renderVisitorResults();
  }
  query.addEventListener("compositionend", () => {
    composing = false;
    updateVisitorResults();
  });
  query.addEventListener("input", updateVisitorResults);
  dialog.addEventListener("click", event => {
    if (event.target !== dialog) return;
    const bounds = dialog.getBoundingClientRect();
    if (event.clientX < bounds.left || event.clientX > bounds.right
      || event.clientY < bounds.top || event.clientY > bounds.bottom) dialog.close();
  });
  dialog.addEventListener("close", () => {
    agentRequest = null;
    document.documentElement.classList.remove("search-open");
    const target = [returnFocus, document.querySelector(".navigation-toggle"), trigger]
      .find(element => element?.isConnected && element.getClientRects().length);
    target?.focus({ preventScroll: true });
  });
  dialog.addEventListener("keydown", event => {
    if (composing || event.isComposing) return;
    if (event.key === "Escape") {
      // type=search otherwise consumes Escape to clear a populated input first.
      event.preventDefault();
      dialog.close();
      return;
    }
    if (!["ArrowDown", "ArrowUp"].includes(event.key)) return;
    const links = [...results.querySelectorAll("a")];
    const index = links.indexOf(document.activeElement);
    if (!links.length || (document.activeElement !== query && index < 0)) return;
    event.preventDefault();
    if (event.key === "ArrowDown") links[Math.min(index + 1, links.length - 1)].focus();
    else if (index <= 0) query.focus();
    else links[index - 1].focus();
  });
  document.addEventListener("keydown", event => {
    if (event.isComposing || event.altKey || !(event.metaKey || event.ctrlKey)
      || event.key.toLowerCase() !== "k") return;
    if (event.target.closest("input, textarea, [contenteditable]")) return;
    event.preventDefault();
    open();
  });
  // A back/forward-cache restore must not reopen an old modal or keep scroll locked.
  window.addEventListener("pagehide", () => {
    if (dialog.open) dialog.close();
    document.documentElement.classList.remove("search-open");
  });
})();
