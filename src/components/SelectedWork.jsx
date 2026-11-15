import { WORK } from '../content.js';
import './SelectedWork.css';

const num = (n) => String(n).padStart(4, '0');

export default function SelectedWork() {
  return (
    <section id="work" className="work">
      <div className="work__intro">
        <div>
          <div className="work__label">Index</div>
          <h2 className="work__heading">Selected<br />Work</h2>
        </div>
        <div className="work__facts">
          <div>[TOOLS]</div><div>Sony ZV-E10 II · DaVinci Resolve · Adobe Lightroom</div>
          <div>[BASE]</div><div>Hradec Králové, CZ</div>
        </div>
      </div>
      <ol className="work__list">
        {WORK.map((w, i) => (
          <li key={w.title} className="work__item">
            <span className="mono work__num">{num(i + 1)}</span>
            <span className="work__title">{w.title}</span>
            <span className="work__tag">[{w.tag}]</span>
          </li>
        ))}
        <li className="work__item">
          <span className="mono work__num">{num(WORK.length + 1)}</span>
          <a href="#contact" className="work__title">Reach me →</a>
        </li>
      </ol>
    </section>
  );
}
