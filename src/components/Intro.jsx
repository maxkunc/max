import { HIGHLIGHTS } from '../content.js';
import Picture from './Picture.jsx';
import './Intro.css';

const TILE_SIZES = '(max-width: 600px) 34vw, (max-width: 1000px) 25vw, 13vw';

/** Full-name strip under the hero + "Concerts, festivals & live events" photo grid. */
export default function Intro() {
  return (
    <section className="intro">
      <svg role="img" aria-label="Maxmilian Kunc" viewBox="0 0 1000 87" className="intro__name">
        <text x="0" y="86" textLength="1000" lengthAdjust="spacing">MAXMILIAN KUNC</text>
      </svg>
      <div className="intro__links">
        <a href="#work">Work</a>
        <a href="#services">Services</a>
        <a href="#contact">Contact</a>
      </div>
      <p className="intro__lead">Concerts, festivals<br />&amp; live events</p>
      <div className="intro__grid">
        {HIGHLIGHTS.map((p) => (
          <Picture key={p.name} name={p.name} alt={p.alt} className="photo" sizes={TILE_SIZES} />
        ))}
      </div>
    </section>
  );
}
