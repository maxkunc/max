import { useCallback, useEffect, useState } from 'react';
import Hero from './components/Hero.jsx';
import Intro from './components/Intro.jsx';
import Services from './components/Services.jsx';
import SelectedWork from './components/SelectedWork.jsx';
import Gallery from './components/Gallery.jsx';
import About from './components/About.jsx';
import Contact from './components/Contact.jsx';
import ProjectDialog, { hasDetails, projectSlug } from './components/ProjectDialog.jsx';
import { isPreview } from './content/index.js';
import { track } from './analytics.js';

export default function App({ content: c }) {
  // Each project has a shareable link: …/#project-<slug> opens it directly.
  const findBySlug = useCallback((hash) => {
    const m = /^#project-(.+)$/.exec(hash || '');
    return m ? c.work.items.findIndex((w) => hasDetails(w) && projectSlug(w.title) === decodeURIComponent(m[1])) : -1;
  }, [c]);
  const [open, setOpenState] = useState(-1);
  const setHash = (h) => window.history.replaceState(null, '', h || window.location.pathname + window.location.search);
  const setOpen = useCallback((i, from = 'list') => {
    setOpenState(i);
    if (i >= 0) {
      setHash(`#project-${projectSlug(c.work.items[i].title)}`);
      track('project-open', { title: c.work.items[i]?.title, from });
    }
  }, [c]);
  const close = useCallback(() => { setOpenState(-1); if (/^#project-/.test(window.location.hash)) setHash(''); }, []);
  useEffect(() => {
    const onHash = () => { const i = findBySlug(window.location.hash); if (i >= 0) setOpenState(i); };
    onHash(); // a shared link like …/#project-lunetic opens that project
    window.addEventListener('hashchange', onHash);
    return () => window.removeEventListener('hashchange', onHash);
  }, [findBySlug]);
  // Position in the visible Selected Work list (0 when the work is hidden from it).
  const listNumber = (i) => (c.work.items[i]?.hidden ? 0 : c.work.items.slice(0, i + 1).filter((w) => !w.hidden).length);
  const projectIndex = (title) => c.work.items.findIndex((w) => w.title === title && hasDetails(w));

  return (
    <div className="page">
      {isPreview && (
        <div className="preview-bar">
          Preview of unsaved admin changes · <a href="./">View published site</a>
        </div>
      )}
      <Hero hero={c.hero} siteName={c.footer.name} />
      <Intro intro={c.intro} />
      <Services services={c.services} />
      <SelectedWork work={c.work} onOpen={setOpen} />
      <Gallery gallery={c.gallery} projectIndex={projectIndex} onOpen={(i) => setOpen(i, 'gallery')} />
      <About about={c.about} />
      <Contact contact={c.contact} footer={c.footer} />
      <ProjectDialog project={c.work.items[open]} number={listNumber(open)} onClose={close} />
    </div>
  );
}
