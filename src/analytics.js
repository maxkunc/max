// Umami Cloud analytics (cookieless). Loads only when VITE_UMAMI_WEBSITE_ID is set.
// Owner opt-out: Umami itself skips any browser where localStorage "umami.disabled" = "1"
// (toggle it in /admin → Publish → Account).
const WEBSITE_ID = import.meta.env.VITE_UMAMI_WEBSITE_ID;
const SCRIPT = import.meta.env.VITE_UMAMI_SCRIPT || 'https://cloud.umami.is/script.js';
export const OPT_OUT_KEY = 'umami.disabled';

let queue = [];

/** Record a custom event, e.g. track('project-open', { title: 'Lunetic' }). */
export function track(name, data) {
  if (window.umami?.track) window.umami.track(name, data);
  else if (queue) queue.push([name, data]);
}

export function startAnalytics() {
  if (!WEBSITE_ID) return;
  // Review previews and admin "Preview" links aren't real visits.
  if (import.meta.env.VITE_USE_BUNDLED_CONTENT === '1' || new URLSearchParams(location.search).has('preview')) return;

  const s = document.createElement('script');
  s.src = SCRIPT;
  s.defer = true;
  s.dataset.websiteId = WEBSITE_ID;
  s.onload = () => {
    const q = queue;
    queue = null;
    q.forEach(([n, d]) => track(n, d));
  };
  document.head.appendChild(s);

  // Email, Instagram and other outbound links.
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (/^(mailto:|tel:|https?:)/.test(href) && !href.includes(location.host)) {
      track('outbound-click', { link: a.textContent.trim().slice(0, 60) || href.slice(0, 100) });
    }
  });
}
