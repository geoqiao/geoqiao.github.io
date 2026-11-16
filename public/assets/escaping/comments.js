(function () {
    "use strict";

    var container = document.getElementById("comments-container");
    if (!container || container.dataset.commentsInitialized === "true") return;
    container.dataset.commentsInitialized = "true";

    function loadComments() {
        var loadingMsg = container.querySelector(".comments-loading");
        var commentsRepo = container.dataset.commentsRepo;
        var issueNumber = container.dataset.issueNumber;
        var sourceRepo = container.dataset.sourceRepo;
        var settled = false;
        var timer;
        var themeObserver;

        function theme() {
            if (container.dataset.commentsThemeMode !== "auto") return container.dataset.commentsTheme;
            return document.documentElement.getAttribute("data-theme") === "dark" ? "photon-dark" : "github-light";
        }

        function settle(failed) {
            if (settled) return;
            settled = true;
            clearTimeout(timer);
            if (!loadingMsg) return;
            if (!failed) {
                loadingMsg.hidden = true;
                return;
            }
            loadingMsg.textContent = container.dataset.unavailableText || "Comments may not be available. Your network or browser privacy settings may block third-party content.";
            var link = document.createElement("a");
            link.href = "https://github.com/" + sourceRepo + "/issues/" + issueNumber;
            link.target = "_blank";
            link.rel = "noopener";
            link.textContent = container.dataset.issueLinkText || "View or add comment on GitHub →";
            loadingMsg.append(document.createElement("br"), link);
            loadingMsg.className = "comments-error";
        }

        // Load only after approaching the comments. Remove iframe lazy loading
        // inside this container to avoid WebKit's zero-height embed deadlock.
        var frameObserver = new MutationObserver(function () {
            var iframe = container.querySelector("iframe");
            if (!iframe) return;
            iframe.removeAttribute("loading");
            frameObserver.disconnect();
        });
        frameObserver.observe(container, { childList: true, subtree: true });

        if (container.dataset.commentsThemeMode === "auto") {
            themeObserver = new MutationObserver(function () {
                var iframe = container.querySelector("iframe");
                if (iframe && iframe.contentWindow) iframe.contentWindow.postMessage({ type: "set-theme", theme: theme() }, "https://utteranc.es");
            });
            themeObserver.observe(document.documentElement, { attributes: true, attributeFilter: ["data-theme"] });
        }

        window.addEventListener("message", function (event) {
            if (event.origin !== "https://utteranc.es") return;
            var iframe = container.querySelector("iframe");
            if (!iframe || event.source !== iframe.contentWindow || !event.data) return;
            if (event.data.type === "resize") {
                settle(false);
                // A slow embed can still recover after the timeout message.
                if (loadingMsg) loadingMsg.hidden = true;
            } else if (event.data.type === "error") settle(true);
        });

        var script = document.createElement("script");
        script.src = "https://utteranc.es/client.js";
        script.setAttribute("repo", commentsRepo);
        script.setAttribute("issue-number", issueNumber);
        script.setAttribute("theme", theme());
        script.async = true;
        script.onerror = function () { settle(true); frameObserver.disconnect(); themeObserver?.disconnect(); };
        timer = setTimeout(function () { settle(true); }, 20000);
        container.appendChild(script);
    }

    if ("IntersectionObserver" in window) {
        var observer = new IntersectionObserver(function (entries) {
            if (entries.some(function (entry) { return entry.isIntersecting; })) {
                observer.disconnect();
                loadComments();
            }
        }, { rootMargin: "300px 0px" });
        observer.observe(container);
    } else {
        loadComments();
    }
})();
