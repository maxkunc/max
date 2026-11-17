import { useEffect, useRef, useState } from 'react';
import FitPhotos from './FitPhotos.jsx';
import Picture from './Picture.jsx';
import './ProjectDialog.css';

const num = (n) => String(n).padStart(4, '0');
const FACTS = [['role', 'ROLE'], ['client', 'CLIENT'], ['date', 'DATE'], ['place', 'PLACE']];

/** Full-screen project view: facts, description and every photo of the project. */
const WIDE = '(min-width: 900px) and (min-aspect-ratio: 1/1)';

/** Computers / landscape tablets: everything fits one screen. Phones: scrolling page. */
function useWide() {
  const [wide, setWide] = useState(() => typeof window !== 'undefined' && window.matchMedia(WIDE).matches);
  useEffect(() => {
    const mq = window.matchMedia(WIDE);
    const on = () => setWide(mq.matches);
    mq.addEventListener('change', on);
    return () => mq.removeEventListener('change', on);
  }, []);
  return wide;
}

export default function ProjectDialog({ project, number, onClose }) {
  const ref = useRef(null);
  const wide = useWide();

  useEffect(() => {
    const d = ref.current;
    if (project && !d.open) d.showModal();
    if (!project && d.open) d.close();
    document.documentElement.classList.toggle('no-scroll', !!project);
  }, [project]);

  return (
    <dialog
      ref={ref}
      className="project"
      aria-labelledby="project-title"
      onClose={onClose}
      onClick={(e) => { if (e.target === ref.current) onClose(); }}
    >
      {project && (
        <div className="project__inner">
          <div className="project__head">
            <div className="num">[PROJECT]{number > 0 ? ` ${num(number)}` : ''}</div>
            <button type="button" className="project__close" onClick={onClose} autoFocus>Close ✕</button>
          </div>
          <div className="project__body">
            <div className="project__info">
              <h2 id="project-title" className="project__title">{project.title}</h2>
              <div className="project__facts">
                {project.tag && (<><div>[TYPE]</div><div>{project.tag}</div></>)}
                {FACTS.filter(([k]) => project[k]).map(([k, label]) => (
                  <div key={k} className="project__fact"><div>[{label}]</div><div>{project[k]}</div></div>
                ))}
              </div>
              {project.description && <p className="project__desc">{project.description}</p>}
            </div>
            {project.photos?.length > 0 && (wide ? (
              <FitPhotos key={project.title} photos={project.photos} />
            ) : (
              <div className="project__photos">
                {project.photos.map((p, i) => (
                  <Picture
                    key={`${p.photo}-${i}`}
                    name={p.photo}
                    alt={p.alt}
                    className="project__photo"
                    sizes="(max-width: 700px) 100vw, 50vw"
                  />
                ))}
              </div>
            ))}
          </div>
        </div>
      )}
    </dialog>
  );
}

/** Whether a work item has anything to show in the project view. */
export const hasDetails = (w) => !!(w && (w.description || w.photos?.length || w.role || w.date || w.place));
