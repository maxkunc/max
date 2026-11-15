import photos, { photoNames } from '../images.js';

/** Small thumbnail URL for a photo (built-in: 400px WebP; uploaded: data URL). */
export function thumb(name, uploads) {
  const pic = photos[name];
  if (pic) return (pic.sources.webp || pic.img.src).split(',')[0].trim().split(' ')[0];
  return uploads[name] || '';
}

export function Field({ label, value, onChange, multiline, hint, type = 'text' }) {
  return (
    <label className="f">
      <span className="f__label">{label}</span>
      {multiline ? (
        <textarea rows={Math.max(2, String(value ?? '').split('\n').length)} value={value ?? ''} onChange={(e) => onChange(e.target.value)} />
      ) : (
        <input type={type} value={value ?? ''} onChange={(e) => onChange(type === 'number' ? Number(e.target.value) : e.target.value)} />
      )}
      {hint && <span className="f__hint">{hint}</span>}
    </label>
  );
}

export function Check({ label, value, onChange }) {
  return (
    <label className="f f--check">
      <input type="checkbox" checked={!!value} onChange={(e) => onChange(e.target.checked)} />
      <span>{label}</span>
    </label>
  );
}

export function PhotoSelect({ label = 'Photo', value, onChange, uploads }) {
  const names = [...photoNames, ...Object.keys(uploads).filter((n) => !photos[n])];
  return (
    <div className="f f--photo">
      <span className="f__label">{label}</span>
      <div className="photo-select">
        {value && thumb(value, uploads) ? <img src={thumb(value, uploads)} alt="" /> : <div className="photo-select__empty">?</div>}
        <select value={value} onChange={(e) => onChange(e.target.value)}>
          {!names.includes(value) && <option value={value}>{value} (missing)</option>}
          {names.map((n) => (
            <option key={n} value={n}>{n}{photos[n] ? '' : ' (new upload)'}</option>
          ))}
        </select>
      </div>
    </div>
  );
}

/** Editable list with add / remove / reorder. */
export function ListEditor({ items, onChange, newItem, render, addLabel = 'Add', min = 0, max = Infinity }) {
  const update = (i, v) => onChange(items.map((it, j) => (j === i ? v : it)));
  const move = (i, d) => {
    const next = [...items];
    [next[i], next[i + d]] = [next[i + d], next[i]];
    onChange(next);
  };
  return (
    <div className="list">
      {items.map((item, i) => (
        <div className="list__item" key={i}>
          <div className="list__index">{String(i + 1).padStart(2, '0')}</div>
          <div className="list__body">{render(item, (v) => update(i, v), i)}</div>
          <div className="list__actions">
            <button type="button" title="Move up" disabled={i === 0} onClick={() => move(i, -1)}>↑</button>
            <button type="button" title="Move down" disabled={i === items.length - 1} onClick={() => move(i, 1)}>↓</button>
            <button type="button" title="Remove" className="danger" disabled={items.length <= min} onClick={() => onChange(items.filter((_, j) => j !== i))}>✕</button>
          </div>
        </div>
      ))}
      {items.length < max && (
        <button type="button" className="list__add" onClick={() => onChange([...items, newItem()])}>+ {addLabel}</button>
      )}
    </div>
  );
}
