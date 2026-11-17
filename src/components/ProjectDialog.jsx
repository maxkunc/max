import { useEffect, useRef } from 'react';
import Picture from './Picture.jsx';
import './ProjectDialog.css';

const num = (n) => String(n).padStart(4, '0');
const FACTS = [['role', 'ROLE'], ['client', 'CLIENT'], ['date', 'DATE'], ['place', 'PLACE']];

/** Full-screen project view: facts, description and every photo of the project. */
export default function ProjectDialog({ project, number, onClose }) {
  const ref = useRef(null);

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
          <h2 id="project-title" className="project__title">{project.title}</h2>
          <div className="project__facts">
            {project.tag && (<><div>[TYPE]</div><div>{project.tag}</div></>)}
            {FACTS.filter(([k]) => project[k]).map(([k, label]) => (
              <div key={k} className="project__fact"><div>[{label}]</div><div>{project[k]}</div></div>
            ))}
          </div>
          {project.description && <p className="project__desc">{project.description}</p>}
          {project.photos?.length > 0 && (
            <div className="project__photos">
              {project.photos.map((p, i) => (
                <Picture
                  key={`${p.photo}-${i}`}
                  name={p.photo}
                  alt={p.alt}
                  className="project__photo"
                  sizes="(max-width: 700px) 100vw, (max-width: 1100px) 50vw, 33vw"
                />
              ))}
            </div>
          )}
        </div>
      )}
    </dialog>
  );
}

/** Whether a work item has anything to show in the project view. */
export const hasDetails = (w) => !!(w && (w.description || w.photos?.length || w.role || w.date || w.place));
