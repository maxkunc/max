# Max Kunc — Portfolio

Production build of the approved design in [`design/index.html`](design/index.html)
(handoff notes: [`design/HANDOFF.md`](design/HANDOFF.md)). React + Vite, plain CSS, deployed to GitHub Pages.

## Develop

```bash
npm install
npm run dev       # http://localhost:5173
npm run build     # static site in dist/
npm run preview   # serve dist/
```

## Admin (`/admin`)

https://maxkunc.github.io/max/admin/ edits texts, photos, works, services and contacts.
It's backed by Supabase (project `gkmodvmafwtuuzsdochu`):

- **`site_content`**: one row (`id = 'main'`) holding the whole site as JSON. Everyone can read it;
  only admins can write it. The public site fetches it on load and falls back to the bundled
  `src/content/content.json` if Supabase can't be reached.
- **`admins`**: emails allowed to edit. Add one in the Supabase SQL editor:
  `insert into public.admins (email) values ('someone@example.com');`
- **Storage bucket `photos`**: uploads from /admin, saved as `<id>/800.jpg` and `<id>/1600.jpg`
  and referenced in content as `up:<id>`.

In /admin: sign in, edit, **Preview** (your unpublished edits, yellow bar), then **Publish**: the
live site updates immediately, no rebuild needed. **Publish → Backup** downloads or restores the JSON.

Supabase URL + publishable key live in `.env`; they're public by design, and row-level security
protects writes.

## Structure

```
src/
  content/content.json  fallback copy of the content (live content is in Supabase)
  supabase-config.js  Supabase URL/key + uploaded-photo URLs
  admin/              the /admin editor
  images.js           build-time AVIF/WebP/JPEG at 400/800/1200 px (vite-imagetools)
  styles.css          design tokens + globals
  components/
    Hero, Header      hero (fills the first screen), stacked photos, scaling title
    Intro             full-width SVG name strip + highlight photo grid
    Services          numbered service rows
    SelectedWork      index list (#work)
    Gallery           horizontal scroll-snap project cards
    About             photo + quote (#about)
    Contact, Footer   (#contact)
  assets/photos/      source JPEGs — drop new photos here
public/               favicon, apple-touch-icon, og-image.jpg
```

Each component has a co-located `.css` file. Only the hero photos load eagerly; everything
below the fold is `loading="lazy"` with `srcset`/`sizes`.

## Adding photos

1. Put the JPEG in `src/assets/photos/` (e.g. `skatesound-1.jpg`).
2. Or simply upload it in /admin, no commit needed.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The site URL used for the canonical link and Open Graph tags is `VITE_SITE_URL` in `.env`
(default `https://maxkunc.github.io/max/`). Update it if you attach a custom domain.

## Open items

- Skatesound photos still to come.
- Lunetic (O2 Universum) photos from the portfolio deck could be added to the gallery.
