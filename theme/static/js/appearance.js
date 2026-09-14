(() => {
  let theme;
  try { theme = localStorage.getItem("geo-theme"); } catch { /* Storage is optional. */ }
  const root = document.documentElement;
  root.dataset.theme = ["light", "dark"].includes(theme)
    ? theme : (matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light");
})();
