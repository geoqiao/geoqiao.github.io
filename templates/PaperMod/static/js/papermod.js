// theme toggle and simple TOC builder
(function () {
    const themeBtn = document.querySelector('.theme-toggle');
    const applyTheme = (t) => { document.documentElement.setAttribute('data-theme', t); themeBtn.textContent = t === 'dark' ? '☀️' : '🌙'; localStorage.setItem('theme', t) };
    const saved = localStorage.getItem('theme');
    if (saved) applyTheme(saved); else { const prefers = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches; applyTheme(prefers ? 'dark' : 'light') }
    if (themeBtn) themeBtn.addEventListener('click', () => { const cur = document.documentElement.getAttribute('data-theme') || 'light'; applyTheme(cur === 'dark' ? 'light' : 'dark') });

    // Simple TOC builder: find headings inside post-content
    const toc = document.getElementById('toc');
    if (toc) {
        const content = document.querySelector('.post-content');
        if (content) {
            const headings = content.querySelectorAll('h2,h3');
            if (headings.length) {
                const ul = document.createElement('ul'); ul.style.listStyle = 'none'; ul.style.padding = 0; ul.style.margin = 0;
                headings.forEach(h => {
                    if (!h.id) { h.id = h.textContent.trim().toLowerCase().replace(/[^a-z0-9]+/g, '-'); }
                    const li = document.createElement('li'); li.style.marginBottom = '0.45rem';
                    const a = document.createElement('a'); a.href = '#' + h.id; a.textContent = h.textContent; a.style.color = '#111'; a.style.textDecoration = 'none'; a.style.fontSize = '0.95rem';
                    li.appendChild(a); ul.appendChild(li);
                })
                toc.appendChild(ul);
            }
        }
    }
})();