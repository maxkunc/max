import { useEffect, useMemo, useRef, useState } from 'react';
import { published, DRAFT_KEY, readDraft } from '../content/index.js';
import photos, { photoNames } from '../images.js';
import { Field, Check, PhotoSelect, ListEditor, thumb } from './fields.jsx';

const TABS = ['Texts', 'Photos', 'Works', 'Services', 'Contacts', 'Publish'];

const clone = (o) => JSON.parse(JSON.stringify(o));
function setIn(obj, path, value) {
  const next = clone(obj);
  let cur = next;
  path.slice(0, -1).forEach((k) => { cur = cur[k]; });
  cur[path.at(-1)] = value;
  return next;
}

function download(name, blob) {
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 1000);
}

/** Downscale an uploaded image to max 1600px JPEG so it fits in browser storage. */
function fileToDataUrl(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => {
      const scale = Math.min(1, 1600 / Math.max(img.width, img.height));
      const c = document.createElement('canvas');
      c.width = Math.round(img.width * scale);
      c.height = Math.round(img.height * scale);
      c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
      resolve(c.toDataURL('image/jpeg', 0.85));
      URL.revokeObjectURL(img.src);
    };
    img.onerror = reject;
    img.src = URL.createObjectURL(file);
  });
}

const slug = (s) => s.toLowerCase().replace(/\.[a-z0-9]+$/, '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '') || 'photo';

export default function Admin() {
  const initial = useMemo(() => readDraft(), []);
  const [content, setContent] = useState(initial?.content || clone(published));
  const [uploads, setUploads] = useState(initial?.uploads || {});
  const [tab, setTab] = useState(() => { try { return sessionStorage.getItem('mk-admin-tab') || 'Texts'; } catch { return 'Texts'; } });
  const [status, setStatus] = useState('');
  const importRef = useRef(null);
  const uploadRef = useRef(null);

  const dirty = JSON.stringify(content) !== JSON.stringify(published) || Object.keys(uploads).length > 0;

  // Autosave the draft in this browser.
  useEffect(() => {
    try {
      if (dirty) localStorage.setItem(DRAFT_KEY, JSON.stringify({ content, uploads, savedAt: Date.now() }));
      else localStorage.removeItem(DRAFT_KEY);
      setStatus('');
    } catch {
      setStatus('Browser storage is full: remove some uploaded photos.');
    }
  }, [content, uploads, dirty]);
  useEffect(() => { try { sessionStorage.setItem('mk-admin-tab', tab); } catch { /* ignore */ } }, [tab]);

  const set = (path) => (value) => setContent((c) => setIn(c, path, value));
  const P = (props) => <PhotoSelect uploads={uploads} {...props} />;

  async function onUpload(e) {
    const files = [...e.target.files];
    e.target.value = '';
    const added = {};
    for (const f of files) {
      let name = slug(f.name);
      while (photos[name] || uploads[name] || added[name]) name += '-2';
      added[name] = await fileToDataUrl(f);
    }
    setUploads((u) => ({ ...u, ...added }));
  }

  function onImport(e) {
    const f = e.target.files[0];
    e.target.value = '';
    if (!f) return;
    f.text().then((t) => {
      try {
        const data = JSON.parse(t);
        if (!data.hero || !data.intro) throw new Error('not a content file');
        setContent(data);
        setStatus('Imported.');
      } catch (err) {
        setStatus(`Import failed: ${err.message}`);
      }
    });
  }

  function discard() {
    if (!confirm('Discard all unpublished changes and uploaded photos in this browser?')) return;
    setContent(clone(published));
    setUploads({});
  }

  function exportPhotos() {
    Object.entries(uploads).forEach(([name, dataUrl], i) => {
      setTimeout(() => fetch(dataUrl).then((r) => r.blob()).then((b) => download(`${name}.jpg`, b)), i * 300);
    });
  }

  const usedPhotos = new Set([
    ...content.hero.photos, ...content.intro.photos.map((p) => p.photo),
    ...content.gallery.map((g) => g.photo), content.about.photo,
  ]);

  return (
    <div className="admin">
      <header className="admin__bar">
        <div className="admin__brand">Max Kunc <span>Admin</span></div>
        <div className={`admin__state${dirty ? ' is-dirty' : ''}`}>
          {dirty ? 'Unpublished changes · saved in this browser' : 'Up to date with the live site'}
        </div>
        <div className="admin__actions">
          <a className="btn" href="../?preview" target="_blank" rel="noreferrer">Preview</a>
          <button type="button" className="btn btn--primary" onClick={() => setTab('Publish')}>Publish…</button>
        </div>
      </header>
      {status && <div className="admin__status">{status}</div>}

      <nav className="admin__tabs">
        {TABS.map((t) => (
          <button key={t} type="button" className={t === tab ? 'is-active' : ''} onClick={() => setTab(t)}>{t}</button>
        ))}
      </nav>

      <main className="admin__main">
        {tab === 'Texts' && (
          <>
            <Card title="Hero">
              <div className="grid3">
                {content.hero.lines.map((l, i) => <Field key={i} label={`Title line ${i + 1}`} value={l} onChange={set(['hero', 'lines', i])} />)}
              </div>
              <div className="grid3">
                <Field label="Left" value={content.hero.studio} onChange={set(['hero', 'studio'])} />
                <Field label="Centre" multiline value={content.hero.tagline} onChange={set(['hero', 'tagline'])} />
                <Field label="Right" value={content.hero.year} onChange={set(['hero', 'year'])} />
              </div>
            </Card>
            <Card title="Name strip & headline">
              <Field label="Full name (fills the screen width)" value={content.intro.name} onChange={set(['intro', 'name'])} />
              <Field label="Headline above the photos" multiline value={content.intro.lead} onChange={set(['intro', 'lead'])} />
            </Card>
            <Card title="Selected work">
              <Field label="[TOOLS]" value={content.work.tools} onChange={set(['work', 'tools'])} />
              <Field label="[BASE]" value={content.work.base} onChange={set(['work', 'base'])} />
              <Field label="Last line (links to contact)" value={content.work.cta} onChange={set(['work', 'cta'])} />
            </Card>
            <Card title="About">
              <div className="grid2">
                <Field label="Heading" multiline value={content.about.heading} onChange={set(['about', 'heading'])} />
                <Field label="Studio" multiline value={content.about.studio} onChange={set(['about', 'studio'])} />
              </div>
              <Field label="Role" multiline value={content.about.role} onChange={set(['about', 'role'])} />
              <Field label="Quote" multiline value={content.about.quote} onChange={set(['about', 'quote'])} />
              <Field label="Photo corner text" multiline value={content.about.corner} onChange={set(['about', 'corner'])} />
              <h4>Photo caption rows</h4>
              <ListEditor
                items={content.about.caption}
                onChange={set(['about', 'caption'])}
                newItem={() => ({ label: '', value: '', note: '' })}
                addLabel="Add row"
                render={(row, up) => (
                  <div className="grid3">
                    <Field label="Label" value={row.label} onChange={(v) => up({ ...row, label: v })} />
                    <Field label="Value" value={row.value} onChange={(v) => up({ ...row, value: v })} />
                    <Field label="Right" value={row.note} onChange={(v) => up({ ...row, note: v })} />
                  </div>
                )}
              />
            </Card>
            <Card title="Contact & footer">
              <Field label="Contact heading" multiline value={content.contact.heading} onChange={set(['contact', 'heading'])} />
              <div className="grid3">
                <Field label="Footer left (also top-left name)" value={content.footer.name} onChange={set(['footer', 'name'])} />
                <Field label="Footer centre" value={content.footer.place} onChange={set(['footer', 'place'])} />
                <Field label="Footer right" value={content.footer.year} onChange={set(['footer', 'year'])} />
              </div>
            </Card>
          </>
        )}

        {tab === 'Photos' && (
          <>
            <Card title="Photo library" action={<button type="button" className="btn" onClick={() => uploadRef.current.click()}>Upload photos</button>}>
              <input ref={uploadRef} type="file" accept="image/*" multiple hidden onChange={onUpload} />
              <p className="note">Pick these in the sections below. Uploaded photos show on Preview straight away; to put them on the live site, follow the steps under Publish.</p>
              <div className="library">
                {[...photoNames, ...Object.keys(uploads)].map((n) => (
                  <figure key={n} className={usedPhotos.has(n) ? 'is-used' : ''}>
                    <img src={thumb(n, uploads)} alt="" loading="lazy" />
                    <figcaption>
                      {n}
                      {uploads[n] && (
                        <>
                          <em>new</em>
                          <button type="button" className="link danger" onClick={() => setUploads(({ [n]: _, ...rest }) => rest)}>remove</button>
                        </>
                      )}
                    </figcaption>
                  </figure>
                ))}
              </div>
            </Card>
            <Card title="Hero (3 photos: left, right, centre/front)">
              <div className="grid3">
                {content.hero.photos.map((p, i) => (
                  <P key={i} label={['Left', 'Right', 'Centre (black & white)'][i]} value={p} onChange={set(['hero', 'photos', i])} />
                ))}
              </div>
            </Card>
            <Card title="Photo grid under the name">
              <p className="note">Phones show the first 9, closed foldables 6, landscape phones 7 or 6, tablets and computers 8.</p>
              <ListEditor
                items={content.intro.photos}
                onChange={set(['intro', 'photos'])}
                newItem={() => ({ photo: photoNames[0], alt: '' })}
                addLabel="Add photo"
                render={(p, up) => (
                  <div className="grid2">
                    <P value={p.photo} onChange={(v) => up({ ...p, photo: v })} />
                    <Field label="Description (for screen readers)" value={p.alt} onChange={(v) => up({ ...p, alt: v })} />
                  </div>
                )}
              />
            </Card>
            <Card title="Projects gallery (horizontal scroll)">
              <ListEditor
                items={content.gallery}
                onChange={set(['gallery'])}
                newItem={() => ({ photo: photoNames[0], alt: '', title: 'New project', count: 1, mono: false })}
                addLabel="Add project"
                render={(g, up) => (
                  <div className="grid2">
                    <P value={g.photo} onChange={(v) => up({ ...g, photo: v })} />
                    <div>
                      <Field label="Title" value={g.title} onChange={(v) => up({ ...g, title: v })} />
                      <div className="grid2">
                        <Field label="Number of images" type="number" value={g.count} onChange={(v) => up({ ...g, count: v })} />
                        <Check label="Black & white" value={g.mono} onChange={(v) => up({ ...g, mono: v })} />
                      </div>
                      <Field label="Description" value={g.alt} onChange={(v) => up({ ...g, alt: v })} />
                    </div>
                  </div>
                )}
              />
            </Card>
            <Card title="About photo">
              <div className="grid2">
                <P value={content.about.photo} onChange={set(['about', 'photo'])} />
                <Field label="Description" value={content.about.photoAlt} onChange={set(['about', 'photoAlt'])} />
              </div>
            </Card>
          </>
        )}

        {tab === 'Works' && (
          <Card title="Selected work list">
            <ListEditor
              items={content.work.items}
              onChange={set(['work', 'items'])}
              newItem={() => ({ title: '', tag: '' })}
              addLabel="Add work"
              render={(w, up) => (
                <div className="grid2">
                  <Field label="Title" value={w.title} onChange={(v) => up({ ...w, title: v })} />
                  <Field label="Tag (shown as [TAG])" value={w.tag} onChange={(v) => up({ ...w, tag: v })} />
                </div>
              )}
            />
          </Card>
        )}

        {tab === 'Services' && (
          <Card title="Services">
            <ListEditor
              items={content.services}
              onChange={set(['services'])}
              newItem={() => ({ title: '', tags: ['', '', ''] })}
              addLabel="Add service"
              render={(s, up) => (
                <>
                  <Field label="Title" value={s.title} onChange={(v) => up({ ...s, title: v })} />
                  <div className="grid3">
                    {s.tags.map((t, j) => (
                      <Field key={j} label={`Tag ${j + 1}`} value={t} onChange={(v) => up({ ...s, tags: s.tags.map((x, k) => (k === j ? v : x)) })} />
                    ))}
                  </div>
                </>
              )}
            />
          </Card>
        )}

        {tab === 'Contacts' && (
          <Card title="Contacts">
            <ListEditor
              items={content.contact.items}
              onChange={set(['contact', 'items'])}
              newItem={() => ({ label: '', text: '', href: 'https://' })}
              addLabel="Add contact"
              render={(c, up) => (
                <div className="grid3">
                  <Field label="Label" value={c.label} onChange={(v) => up({ ...c, label: v })} />
                  <Field label="Shown text" value={c.text} onChange={(v) => up({ ...c, text: v })} />
                  <Field label="Link" value={c.href} onChange={(v) => up({ ...c, href: v })} hint="tel:+420…, mailto:…, https://…" />
                </div>
              )}
            />
          </Card>
        )}

        {tab === 'Publish' && (
          <Card title="Publish your changes">
            <p className="note">
              The admin isn’t connected to a database yet, so changes are saved only in this browser.
              Use <strong>Preview</strong> to check them, then publish them by updating the repository:
            </p>
            <ol className="steps">
              <li>
                <button type="button" className="btn btn--primary" onClick={() => download('content.json', new Blob([JSON.stringify(content, null, 2) + '\n'], { type: 'application/json' }))}>Download content.json</button>
                <span>Replace <code>src/content/content.json</code> in the repository with it.</span>
              </li>
              {Object.keys(uploads).length > 0 && (
                <li>
                  <button type="button" className="btn" onClick={exportPhotos}>Download {Object.keys(uploads).length} new photo(s)</button>
                  <span>Add them to <code>src/assets/photos/</code> without renaming.</span>
                </li>
              )}
              <li><span>Commit to <code>main</code>. The site rebuilds and goes live in about a minute.</span></li>
              <li><span>Then click <strong>Discard draft</strong> below so this browser shows the live content again.</span></li>
            </ol>
            <div className="row">
              <button type="button" className="btn" onClick={() => importRef.current.click()}>Import content.json</button>
              <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
              <button type="button" className="btn btn--danger" disabled={!dirty} onClick={discard}>Discard draft</button>
            </div>
          </Card>
        )}
      </main>
    </div>
  );
}

function Card({ title, action, children }) {
  return (
    <section className="card">
      <div className="card__head"><h3>{title}</h3>{action}</div>
      {children}
    </section>
  );
}
