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

## Structure

```
src/
  content.js          all copy: nav, services, work list, gallery, contacts
  images.js           build-time AVIF/WebP/JPEG at 400/800/1200 px (vite-imagetools)
  styles.css          design tokens + globals
  components/
    Hero, Header      hero (≥16:9), stacked photos, scaling title
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
2. Reference it by file name (without `.jpg`) in `src/content.js` — `HIGHLIGHTS` or `GALLERY`.

## Deploy (GitHub Pages)

`.github/workflows/deploy.yml` builds and publishes on every push to `main`.
One-time setup: **Settings → Pages → Build and deployment → Source: GitHub Actions**.

The site URL used for the canonical link and Open Graph tags is `VITE_SITE_URL` in `.env`
(default `https://maxkunc.github.io/max/`). Update it if you attach a custom domain.

## Open items

- Skatesound photos still to come.
- Lunetic (O2 Universum) photos from the portfolio deck could be added to the gallery.
