// Cookieless visitor analytics. Sends one "view" per page load, heartbeats with time on
// page + scroll depth, and named events (project opened, contact clicked, …).
// Nothing is stored on the visitor's device except the owner's own "don't count me" flag.
import { SB_URL } from './supabase-config.js';

const ENDPOINT = `${SB_URL}/functions/v1/track`;
export const OPT_OUT_KEY = 'mk-no-track';

let visitId = null;
let pending = []; // events fired before the visit id arrives
let visibleMs = 0;
let visibleSince = null;
let maxScroll = 0;

const optedOut = () => {
  try { return localStorage.getItem(OPT_OUT_KEY) === '1'; } catch { return false; }
};

function send(body, beacon = false) {
  const data = JSON.stringify(body);
  // text/plain keeps it a "simple" request (no CORS preflight), and works with sendBeacon.
  if (beacon && navigator.sendBeacon) return navigator.sendBeacon(ENDPOINT, new Blob([data], { type: 'text/plain' }));
  return fetch(ENDPOINT, { method: 'POST', body: data, headers: { 'Content-Type': 'text/plain' }, keepalive: true })
    .then((r) => r.json()).catch(() => null);
}

const duration = () => Math.round((visibleMs + (visibleSince ? Date.now() - visibleSince : 0)) / 1000);

function ping(beacon) {
  if (visitId) send({ type: 'ping', id: visitId, duration: duration(), scroll: maxScroll }, beacon);
}

/** Record something the visitor did, e.g. track('project_open', { title: 'Lunetic' }). */
export function track(name, props = {}) {
  if (!visitId) { pending.push([name, props]); return; }
  send({ type: 'event', id: visitId, name, props });
}

export function startAnalytics({ site = 'max' } = {}) {
  // Not counted: no backend, owner opt-out, automated browsers, review previews.
  if (!SB_URL || optedOut() || navigator.webdriver || import.meta.env.VITE_USE_BUNDLED_CONTENT === '1') return;
  const params = new URLSearchParams(location.search);
  if (params.has('preview')) return;

  visibleSince = document.visibilityState === 'visible' ? Date.now() : null;
  const onScroll = () => {
    const h = document.documentElement.scrollHeight - innerHeight;
    const pct = h > 0 ? Math.round((scrollY / h) * 100) : 100;
    if (pct > maxScroll) maxScroll = Math.min(100, pct);
  };
  addEventListener('scroll', onScroll, { passive: true });

  send({
    type: 'view',
    site,
    path: location.pathname + location.hash,
    referrer: document.referrer || null,
    utm_source: params.get('utm_source'),
    utm_medium: params.get('utm_medium'),
    utm_campaign: params.get('utm_campaign'),
    screen: `${screen.width}x${screen.height}`,
    viewport: `${innerWidth}x${innerHeight}`,
    language: navigator.language,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }).then((r) => {
    if (!r?.id) return;
    visitId = r.id;
    pending.forEach(([n, p]) => track(n, p));
    pending = [];
  });

  document.addEventListener('visibilitychange', () => {
    if (document.visibilityState === 'hidden') {
      if (visibleSince) visibleMs += Date.now() - visibleSince;
      visibleSince = null;
      ping(true);
    } else {
      visibleSince = Date.now();
    }
  });
  addEventListener('pagehide', () => ping(true));
  // Heartbeat so "live now" and time-on-site stay accurate while the tab is open.
  setInterval(() => { if (document.visibilityState === 'visible') ping(false); }, 20000);

  // Outbound links: email, phone, Instagram, other sites.
  document.addEventListener('click', (e) => {
    const a = e.target.closest?.('a[href]');
    if (!a) return;
    const href = a.getAttribute('href');
    if (/^(mailto:|tel:|https?:)/.test(href) && !href.includes(location.host)) {
      track('outbound_click', { href: href.slice(0, 200), text: a.textContent.trim().slice(0, 60) });
    }
  });
}
