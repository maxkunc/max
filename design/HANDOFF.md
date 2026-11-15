# Max Kunc — Portfolio Website · Handoff for Claude Code

`index.html` is the finished design exported from the Claude Design canvas as one static, responsive page, and it is the source of truth. Build it into a real website that matches this design pixel for pixel at every width.

## Prompt to paste into Claude Code

> This folder holds my approved portfolio site design (`index.html` + `assets/`). Turn it into a production website.
> - Keep the look, copy, spacing and responsive behaviour exactly as in `index.html`; open it in a browser and compare at 375, 768, 1280 and 1920 px wide.
> - Split it into clean components and sections (Hero, Services, Selected Work gallery, About, Contact, Footer) and move the inline styles into CSS/Tailwind.
> - Optimise the images (WebP/AVIF, `srcset`, lazy-load everything below the hero).
> - Add SEO basics: title, meta description, Open Graph image, favicon, `lang`.
> - Ask me which stack and hosting I want before you scaffold anything. A plain static site is fine; React + Vite is what my current site maxkunc.lovable.app uses.

## Design tokens

| Token | Value |
|---|---|
| Background | `#111111` |
| Text (cream) | `#ece7d9` |
| Light section ground | `#efebdf` / `#f3f0e3` |
| Ink on light | `#141414` |
| Main font | Inter Tight 400–800 (Google Fonts) |
| Mono / labels | IBM Plex Mono 400–500 |
| Label style | uppercase bracket tags, e.g. `[ROLE]` |
| Headlines | weight 500–800, letter-spacing −0.035 to −0.055em, line-height ~0.82 |

## Behaviour to keep

- **Hero:** at least 16:9 (`min-height: 56.25vw`). The title scales with `max(48px, 11vw)` and has a soft `text-shadow: 0 0 0.35em rgba(0,0,0,.45)`.
- **Full-name strip under the hero:** an SVG `<text textLength="1000" lengthAdjust="spacing">`, so "MAXMILIAN KUNC" always fills the full width on any device.
- **Selected Work gallery:** horizontal scroll with scroll-snap and a thin custom scrollbar (`.gal` rules in `<head>`).
- **Fluid spacing:** `clamp()` throughout. The nav wraps on phones.
- **Links:**

  | Link | Target |
  |---|---|
  | Instagram | `@max.kunc` |
  | Phone | `tel:+420601003311` |
  | Email | `mailto:` |
  | REDDOS | reddos.lovable.app |
  | Section anchors | `#top`, `#work`, `#services`, `#about`, `#contact` |

## Assets (`assets/`)

| File | Content |
|---|---|
| `p1-portrait.jpg` | Portrait |
| `jump.jpg` | Hero action shot |
| `dance.jpg` | Dance |
| `o5-1.jpg`, `o5-2.jpg` | O5 a Radeček, O2 Universum |
| `dj-stayer-1.jpg`, `dj-stayer-2.jpg` | DJ Stayer music video |
| `cdm-1.jpg`, `cdm-3.jpg` | Czech Dance Masters, Hradec |
| `gapa-1.jpg`, `gapa-huddle.jpg`, `gapa-coach.jpg` | BK GAPA basketball |

## Open items

- No real Skatesound photos yet; use placeholders until Max sends them.
- Lunetic (O2 Universum) photos exist in the portfolio deck and could be added to the gallery.
