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

https://maxkunc.github.io/max/admin/ lets you edit texts, photos, works, services and contacts.
It isn't connected to a database yet: edits are saved only in your browser.

- **Preview** opens the site with your edits (yellow bar at the bottom).
- **Publish → Download content.json**, replace `src/content/content.json` with it, add any new photos
  to `src/assets/photos/`, and commit to `main`. The site redeploys automatically.

The admin page has no login. It can't change the live site; it only edits a copy in the visitor's browser.

## Structure

```
src/
  content/content.json  all texts, photo choices, works, services, contacts (edited via /admin)
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
2. Pick it in /admin (or reference it by file name, without `.jpg`, in `src/content/content.json`).

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The site URL used for the canonical link and Open Graph tags is `VITE_SITE_URL` in `.env`
(default `https://maxkunc.github.io/max/`). Update it if you attach a custom domain.

## Open items

- Skatesound photos still to come.
- Lunetic (O2 Universum) photos from the portfolio deck could be added to the gallery.
