import { useCallback, useEffect, useRef, useState } from 'react';
import { bundled, DRAFT_KEY, readDraft } from '../content/index.js';
import { photoNames } from '../images.js';
import { PHOTO_BUCKET, UPLOAD_PREFIX, isUpload, uploadId } from '../supabase-config.js';
import { supabase } from './supabase.js';
import { Field, Check, PhotoSelect, ListEditor, thumb } from './fields.jsx';

const TABS = ['Texts', 'Photos', 'Works', 'Services', 'Contacts', 'Publish'];

const clone = (o) => JSON.parse(JSON.stringify(o));
const same = (a, b) => JSON.stringify(a) === JSON.stringify(b);
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

/** Resize an image file to a JPEG blob no larger than `max` px on its long side. */
function resize(img, max) {
  const scale = Math.min(1, max / Math.max(img.naturalWidth, img.naturalHeight));
  const c = document.createElement('canvas');
  c.width = Math.round(img.naturalWidth * scale);
  c.height = Math.round(img.naturalHeight * scale);
  c.getContext('2d').drawImage(img, 0, 0, c.width, c.height);
  return new Promise((resolve) => c.toBlob(resolve, 'image/jpeg', 0.85));
}
function loadImage(file) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error(`${file.name} is not an image this browser can read`));
    img.src = URL.createObjectURL(file);
  });
}

const slug = (s) => s.toLowerCase().replace(/\.[a-z0-9]+$/, '').normalize('NFD').replace(/[̀-ͯ]/g, '')
  .replace(/[^a-z0-9]+/g, '-').replace(/^-|-$/g, '').slice(0, 40) || 'photo';

const when = (iso) => new Date(iso).toLocaleString();

export default function Admin() {
  const [session, setSession] = useState(undefined);
  const [allowed, setAllowed] = useState(undefined);

  useEffect(() => {
    supabase.auth.getSession().then(({ data }) => setSession(data.session));
    const { data } = supabase.auth.onAuthStateChange((_e, s) => setSession(s));
    return () => data.subscription.unsubscribe();
  }, []);

  useEffect(() => {
    setAllowed(undefined);
    if (!session) return;
    supabase.rpc('is_admin').then(({ data }) => setAllowed(!!data));
  }, [session?.user?.id]);

  if (session === undefined || (session && allowed === undefined)) return <div className="gate"><p>Loading…</p></div>;
  if (!session) return <Login />;
  if (!allowed) {
    return (
      <div className="gate">
        <div className="gate__box">
          <h1>No access</h1>
          <p className="note"><strong>{session.user.email}</strong> isn’t on the list of site editors. Ask the site owner to add it.</p>
          <button type="button" className="btn" onClick={() => supabase.auth.signOut()}>Sign out</button>
        </div>
      </div>
    );
  }
  return <Editor email={session.user.email} />;
}

function Login() {
  const [mode, setMode] = useState('in');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [msg, setMsg] = useState('');
  const [busy, setBusy] = useState(false);

  async function submit(e) {
    e.preventDefault();
    setBusy(true);
    setMsg('');
    const creds = { email: email.trim(), password };
    const { data, error } = mode === 'in'
      ? await supabase.auth.signInWithPassword(creds)
      : await supabase.auth.signUp({ ...creds, options: { emailRedirectTo: window.location.href } });
    setBusy(false);
    if (error) setMsg(error.message);
    else if (mode === 'up' && !data.session) setMsg('Check your inbox and click the confirmation link, then sign in here.');
  }

  return (
    <div className="gate">
      <form className="gate__box" onSubmit={submit}>
        <h1>Max Kunc <span>Admin</span></h1>
        <Field label="Email" type="email" value={email} onChange={setEmail} />
        <Field label="Password" type="password" value={password} onChange={setPassword} />
        {msg && <p className="gate__msg">{msg}</p>}
        <button type="submit" className="btn btn--primary" disabled={busy || !email || password.length < 6}>
          {mode === 'in' ? 'Sign in' : 'Create account'}
        </button>
        <button type="button" className="link" onClick={() => { setMode(mode === 'in' ? 'up' : 'in'); setMsg(''); }}>
          {mode === 'in' ? 'First time? Create an account' : 'Have an account? Sign in'}
        </button>
      </form>
    </div>
  );
}

function Editor({ email }) {
  const [live, setLive] = useState(null); // { content, updated_at, updated_by }
  const [content, setContent] = useState(null);
  const [uploads, setUploads] = useState([]);
  const [tab, setTab] = useState(() => { try { return sessionStorage.getItem('mk-admin-tab') || 'Texts'; } catch { return 'Texts'; } });
  const [status, setStatus] = useState(null); // { kind: 'ok' | 'error', text }
  const [busy, setBusy] = useState(false);
  const importRef = useRef(null);
  const uploadRef = useRef(null);

  const say = (text, kind = 'ok') => setStatus({ text, kind });

  const loadUploads = useCallback(async () => {
    const { data, error } = await supabase.storage.from(PHOTO_BUCKET).list('', { limit: 1000, sortBy: { column: 'name', order: 'asc' } });
    if (error) return say(`Couldn’t list uploaded photos: ${error.message}`, 'error');
    setUploads(data.filter((d) => d.id === null).map((d) => UPLOAD_PREFIX + d.name));
  }, []);

  useEffect(() => {
    (async () => {
      const { data, error } = await supabase.from('site_content').select('content, updated_at, updated_by').eq('id', 'main').maybeSingle();
      if (error) say(`Couldn’t load the live content: ${error.message}`, 'error');
      const current = data || { content: bundled, updated_at: null, updated_by: null };
      setLive(current);
      const draft = readDraft();
      setContent(draft?.content || clone(current.content));
      loadUploads();
    })();
  }, [loadUploads]);

  const dirty = !!(live && content && !same(content, live.content));

  // Keep unpublished edits in this browser so nothing is lost on reload.
  useEffect(() => {
    if (!content || !live) return;
    try {
      if (dirty) localStorage.setItem(DRAFT_KEY, JSON.stringify({ content, savedAt: Date.now() }));
      else localStorage.removeItem(DRAFT_KEY);
    } catch { /* storage unavailable: edits still work, just not kept on reload */ }
  }, [content, live, dirty]);
  useEffect(() => { try { sessionStorage.setItem('mk-admin-tab', tab); } catch { /* ignore */ } }, [tab]);

  if (!content || !live) return <div className="gate"><p>Loading content…</p></div>;

  const set = (path) => (value) => setContent((c) => setIn(c, path, value));
  const P = (props) => <PhotoSelect uploads={uploads} {...props} />;

  async function publish() {
    setBusy(true);
    const { data, error } = await supabase.from('site_content')
      .upsert({ id: 'main', content })
      .select('content, updated_at, updated_by')
      .single();
    setBusy(false);
    if (error) return say(`Publishing failed: ${error.message}`, 'error');
    setLive(data);
    say('Published. The live site shows your changes now.');
  }

  function discard() {
    if (!confirm('Discard your unpublished changes and go back to what is live?')) return;
    setContent(clone(live.content));
    say('Changes discarded.');
  }

  async function onUpload(e) {
    const files = [...e.target.files];
    e.target.value = '';
    if (!files.length) return;
    setBusy(true);
    let done = 0;
    for (const f of files) {
      try {
        say(`Uploading ${f.name}…`);
        const img = await loadImage(f);
        const id = `${slug(f.name)}-${Date.now().toString(36)}`;
        for (const size of [800, 1600]) {
          const blob = await resize(img, size);
          const { error } = await supabase.storage.from(PHOTO_BUCKET)
            .upload(`${id}/${size}.jpg`, blob, { contentType: 'image/jpeg', cacheControl: '31536000' });
          if (error) throw error;
        }
        URL.revokeObjectURL(img.src);
        done += 1;
      } catch (err) {
        say(`Upload of ${f.name} failed: ${err.message}`, 'error');
      }
    }
    setBusy(false);
    await loadUploads();
    if (done) say(`${done} photo${done > 1 ? 's' : ''} uploaded. Choose where to use ${done > 1 ? 'them' : 'it'} below.`);
  }

  async function deleteUpload(name) {
    if (!confirm(`Delete ${uploadId(name)} permanently?`)) return;
    const id = uploadId(name);
    const { error } = await supabase.storage.from(PHOTO_BUCKET).remove([`${id}/800.jpg`, `${id}/1600.jpg`]);
    if (error) return say(`Delete failed: ${error.message}`, 'error');
    await loadUploads();
    say('Photo deleted.');
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
        say('Backup loaded. Check it with Preview, then Publish.');
      } catch (err) {
        say(`Import failed: ${err.message}`, 'error');
      }
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
          {dirty ? 'Unpublished changes' : 'Up to date with the live site'}
          {live.updated_at && <span className="admin__when"> · last published {when(live.updated_at)}{live.updated_by ? ` by ${live.updated_by}` : ''}</span>}
        </div>
        <div className="admin__actions">
          <a className="btn" href="../?preview" target="_blank" rel="noreferrer">Preview</a>
          <button type="button" className="btn btn--primary" disabled={!dirty || busy} onClick={publish}>{busy ? 'Working…' : 'Publish'}</button>
        </div>
      </header>
      {status && (
        <div className={`admin__status${status.kind === 'error' ? ' is-error' : ''}`}>
          {status.text}
          <button type="button" className="link" onClick={() => setStatus(null)}>dismiss</button>
        </div>
      )}

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
            <Card title="Photo library" action={<button type="button" className="btn" disabled={busy} onClick={() => uploadRef.current.click()}>{busy ? 'Uploading…' : 'Upload photos'}</button>}>
              <input ref={uploadRef} type="file" accept="image/*" multiple hidden onChange={onUpload} />
              <p className="note">Uploaded photos are stored online straight away. Pick them in the sections below, then press Publish. Faded photos aren’t used on the site.</p>
              <div className="library">
                {[...photoNames, ...uploads].map((n) => (
                  <figure key={n} className={usedPhotos.has(n) ? 'is-used' : ''}>
                    <img src={thumb(n)} alt="" loading="lazy" />
                    <figcaption>
                      {isUpload(n) ? uploadId(n) : n}
                      {isUpload(n) && (
                        <>
                          <em>uploaded</em>
                          {!usedPhotos.has(n) && (
                            <button type="button" className="link danger" onClick={() => deleteUpload(n)}>delete</button>
                          )}
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
          <>
            <Card title="Publish">
              <p className="note">
                {dirty ? 'You have changes that aren’t live yet.' : 'Everything you see here is live.'}{' '}
                Check them with <strong>Preview</strong>, then press <strong>Publish</strong>: the site updates immediately for everyone.
              </p>
              <div className="row">
                <button type="button" className="btn btn--primary" disabled={!dirty || busy} onClick={publish}>Publish now</button>
                <button type="button" className="btn btn--danger" disabled={!dirty} onClick={discard}>Discard changes</button>
              </div>
            </Card>
            <Card title="Backup">
              <p className="note">Save a copy of all texts and photo choices as a file, or restore one.</p>
              <div className="row">
                <button type="button" className="btn" onClick={() => download('content.json', new Blob([JSON.stringify(content, null, 2) + '\n'], { type: 'application/json' }))}>Download backup</button>
                <button type="button" className="btn" onClick={() => importRef.current.click()}>Restore from file</button>
                <input ref={importRef} type="file" accept="application/json,.json" hidden onChange={onImport} />
              </div>
            </Card>
            <Card title="Account">
              <p className="note">Signed in as <strong>{email}</strong>.</p>
              <div className="row"><button type="button" className="btn" onClick={() => supabase.auth.signOut()}>Sign out</button></div>
            </Card>
          </>
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
