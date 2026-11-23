// Runs after `vite build`: renders the site to static HTML with the live content
// (from Supabase, falling back to src/content/content.json) and adds schema.org data,
// so crawlers and AI assistants that don't run JavaScript see the full portfolio.
import { readFileSync, writeFileSync, rmSync } from 'node:fs';
import { resolve } from 'node:path';
import { pathToFileURL } from 'node:url';
import { loadEnv } from 'vite';

const root = resolve(import.meta.dirname, '..');
const env = loadEnv('production', root, 'VITE_');
const SITE = env.VITE_SITE_URL || 'https://maxkunc.github.io/max/';

async function liveContent() {
  if (!env.VITE_SUPABASE_URL || !env.VITE_SUPABASE_KEY) return null;
  try {
    const r = await fetch(`${env.VITE_SUPABASE_URL}/rest/v1/site_content?id=eq.main&select=content`, {
      headers: { apikey: env.VITE_SUPABASE_KEY, Authorization: `Bearer ${env.VITE_SUPABASE_KEY}` },
      signal: AbortSignal.timeout(10000),
    });
    if (!r.ok) throw new Error(`HTTP ${r.status}`);
    return (await r.json())[0]?.content || null;
  } catch (e) {
    console.warn(`prerender: live content unavailable (${e.message}), using content.json`);
    return null;
  }
}

const slug = (t = '') => t.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '');
const hasDetails = (w) => !!(w && (w.description || w.photos?.length || w.role || w.date || w.place));
/** "14.2.2026" or "22.–23.5.2026" → "2026-02-14" (first day). */
function isoDate(d = '') {
  const m = /(\d{1,2})\.(?:\s*[–-]\s*\d{1,2}\.)?\s*(\d{1,2})\.(\d{4})/.exec(d);
  return m ? `${m[3]}-${m[2].padStart(2, '0')}-${m[1].padStart(2, '0')}` : undefined;
}

function structuredData(c) {
  const contact = c.contact.items;
  const email = contact.find((x) => x.href?.startsWith('mailto:'))?.href.slice(7);
  const sameAs = contact.filter((x) => /^https?:/.test(x.href)).map((x) => x.href);
  const areas = [
    { '@type': 'City', name: 'Hradec Králové' },
    { '@type': 'City', name: 'Prague' },
    { '@type': 'Country', name: 'Czech Republic' },
  ];
  const person = {
    '@type': 'Person',
    '@id': `${SITE}#max`,
    name: 'Max Kunc',
    alternateName: 'Maxmilian Kunc',
    jobTitle: 'Event filmmaker & photographer',
    description: `Filmmaker and photographer based in Hradec Králové, working in Prague and elsewhere when travel is covered. Concerts, festivals, live events, dance, brand events and sport: camera, photography and editing.`,
    url: SITE,
    email,
    image: new URL('og-image.jpg', SITE).href,
    address: { '@type': 'PostalAddress', addressLocality: 'Hradec Králové', addressCountry: 'CZ' },
    homeLocation: { '@type': 'City', name: 'Hradec Králové' },
    workLocation: areas,
    worksFor: { '@type': 'Organization', name: 'REDDOS Productions', sameAs: contact.find((x) => x.label === 'Studio')?.href },
    knowsAbout: ['Concert photography', 'Concert videography', 'Event videography', 'Event photography', 'Aftermovies', 'Video editing', 'DaVinci Resolve', 'Adobe Lightroom', 'Sound design', 'Short-form social content', 'Sports videography'],
    sameAs,
  };
  const service = {
    '@type': 'ProfessionalService',
    '@id': `${SITE}#service`,
    name: 'Max Kunc — event photo & video',
    url: SITE,
    email,
    image: new URL('og-image.jpg', SITE).href,
    founder: { '@id': `${SITE}#max` },
    address: { '@type': 'PostalAddress', addressLocality: 'Hradec Králové', addressCountry: 'CZ' },
    areaServed: areas,
    description: 'Video and photo for concerts, festivals, live events, dance competitions, brand events and sport, from shooting on the night to the finished edit. Based in Hradec Králové, regularly in Prague, elsewhere when travel is covered.',
    hasOfferCatalog: {
      '@type': 'OfferCatalog',
      name: 'Services',
      itemListElement: c.services.map((s) => ({
        '@type': 'Offer',
        itemOffered: { '@type': 'Service', name: s.title, description: s.tags.join(', ') },
      })),
    },
  };
  const works = c.work.items.filter(hasDetails).map((w) => ({
    '@type': 'CreativeWork',
    name: w.title,
    url: `${SITE}#project-${slug(w.title)}`,
    genre: w.tag,
    description: w.description,
    dateCreated: isoDate(w.date),
    locationCreated: w.place ? { '@type': 'Place', name: w.place } : undefined,
    creator: { '@id': `${SITE}#max`, roleName: w.role },
    sourceOrganization: w.client ? { '@type': 'Organization', name: w.client } : undefined,
  }));
  return { '@context': 'https://schema.org', '@graph': [person, service, ...works] };
}

const content = (await liveContent()) || JSON.parse(readFileSync(resolve(root, 'src/content/content.json'), 'utf8'));
const { render } = await import(pathToFileURL(resolve(root, 'dist-ssr/entry-server.js')).href);
const markup = render(content);

const safeJson = (o) => JSON.stringify(o).replace(/</g, '\\u003c');
const file = resolve(root, 'dist/index.html');
let html = readFileSync(file, 'utf8');
if (!html.includes('<div id="root"></div>')) throw new Error('prerender: #root placeholder not found');
html = html.replace(
  '<div id="root"></div>',
  `<div id="root">${markup}</div>\n    <script id="__content" type="application/json">${safeJson(content)}</script>`,
);
html = html.replace('</head>', `  <script type="application/ld+json">${safeJson(structuredData(content))}</script>\n  </head>`);
writeFileSync(file, html);
rmSync(resolve(root, 'dist-ssr'), { recursive: true, force: true });
console.log(`prerender: wrote ${(markup.length / 1024).toFixed(1)} KB of HTML + structured data (${content.work.items.length} works)`);
