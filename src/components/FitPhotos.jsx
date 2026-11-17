import { useLayoutEffect, useRef, useState } from 'react';
import Picture, { photoAspect } from './Picture.jsx';

const GAP = 12;

/** Split items (by aspect ratio) into `rows` consecutive groups with similar total width. */
function split(aspects, rows) {
  const total = aspects.reduce((a, b) => a + b, 0);
  const groups = [];
  let cur = [];
  let acc = 0;
  aspects.forEach((a, i) => {
    const left = aspects.length - i;
    const rowsLeft = rows - groups.length;
    if (cur.length && rowsLeft > 1 && (acc + a / 2 > (total / rows) * (groups.length + 1) || left < rowsLeft)) {
      groups.push(cur);
      cur = [];
    }
    cur.push(i);
    acc += a;
  });
  groups.push(cur);
  return groups;
}

/**
 * Lays out all photos so they fit inside the box at once (no scrolling), keeping each
 * photo's shape. Tries 1–3 rows and keeps whichever shows the photos largest.
 */
function layout(aspects, W, H) {
  let best = null;
  for (let rows = 1; rows <= Math.min(3, aspects.length); rows++) {
    const groups = split(aspects, rows);
    if (groups.length !== rows) continue;
    // Height of each row when it fills the full width.
    const hs = groups.map((g) => (W - (g.length - 1) * GAP) / g.reduce((s, i) => s + aspects[i], 0));
    const totalH = hs.reduce((a, b) => a + b, 0);
    const scale = Math.min(1, (H - (rows - 1) * GAP) / totalH);
    const area = groups.reduce((sum, g, r) => sum + g.reduce((s, i) => s + aspects[i] * (hs[r] * scale) ** 2, 0), 0);
    if (!best || area > best.area) best = { area, rows: groups.map((g, r) => ({ items: g, h: Math.floor(hs[r] * scale) })) };
  }
  return best;
}

export default function FitPhotos({ photos }) {
  const box = useRef(null);
  const [size, setSize] = useState(null);
  const [loaded, setLoaded] = useState({}); // aspect ratios of uploads, once loaded

  useLayoutEffect(() => {
    const el = box.current;
    const ro = new ResizeObserver(([e]) => setSize({ w: e.contentRect.width, h: e.contentRect.height }));
    ro.observe(el);
    return () => ro.disconnect();
  }, []);

  const aspects = photos.map((p, i) => photoAspect(p.photo) || loaded[i] || 0.75);
  const plan = size && size.w > 0 && size.h > 0 ? layout(aspects, size.w, size.h) : null;

  return (
    <div ref={box} className="fit-photos">
      {plan && plan.rows.map((row, r) => (
        <div key={r} className="fit-photos__row" style={{ height: row.h }}>
          {row.items.map((i) => (
            <Picture
              key={i}
              name={photos[i].photo}
              alt={photos[i].alt}
              className="fit-photos__img"
              style={{ width: Math.floor(row.h * aspects[i]), height: row.h }}
              sizes={`${Math.ceil(row.h * aspects[i])}px`}
              eager
              onLoad={(e) => {
                const a = e.currentTarget.naturalWidth / e.currentTarget.naturalHeight;
                if (!photoAspect(photos[i].photo) && a && Math.abs(a - aspects[i]) > 0.01) setLoaded((m) => ({ ...m, [i]: a }));
              }}
            />
          ))}
        </div>
      ))}
    </div>
  );
}
