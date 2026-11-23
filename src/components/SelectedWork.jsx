import { hasDetails } from './ProjectDialog.jsx';
import './SelectedWork.css';

const num = (n) => String(n).padStart(4, '0');

export default function SelectedWork({ work, onOpen }) {
  // Hidden works stay in the data (their gallery card can still open them) but aren't listed.
  const visible = work.items.map((w, i) => ({ w, i })).filter(({ w }) => !w.hidden);
  return (
    <section id="work" className="work">
      <div className="work__intro">
        <div>
          <div className="work__label">Index</div>
          <h2 className="work__heading">Selected<br />Work</h2>
        </div>
        <div className="work__facts">
          <div>[TOOLS]</div><div>{work.tools}</div>
          <div>[BASE]</div><div>{work.base}</div>
          {work.area && (<><div>[AREA]</div><div>{work.area}</div></>)}
        </div>
      </div>
      <ol className="work__list">
        {visible.map(({ w, i }, n) => (
          <li key={i} className="work__item">
            <span className="num work__num">{num(n + 1)}</span>
            {hasDetails(w) ? (
              <button type="button" className="work__title work__open" onClick={() => onOpen(i)} aria-haspopup="dialog">
                {w.title}
              </button>
            ) : (
              <span className="work__title">{w.title}</span>
            )}
            {w.tag && <span className="work__tag">[{w.tag}]</span>}
          </li>
        ))}
        <li className="work__item">
          <span className="num work__num">{num(visible.length + 1)}</span>
          <a href="#contact" className="work__title">{work.cta}</a>
        </li>
      </ol>
    </section>
  );
}
