import Picture from './Picture.jsx';
import Lines from './Lines.jsx';
import './Intro.css';

const TILE_SIZES = '(max-width: 600px) 34vw, (max-width: 1000px) 25vw, 13vw';

/** Full-name strip under the hero + photo grid. */
export default function Intro({ intro }) {
  return (
    <section className="intro">
      <svg role="img" aria-label={intro.name} viewBox="0 0 1000 87" className="intro__name">
        <text x="0" y="86" textLength="1000" lengthAdjust="spacing">{intro.name.toUpperCase()}</text>
      </svg>
      <div className="intro__links">
        <a href="#work">Work</a>
        <a href="#services">Services</a>
        <a href="#contact">Contact</a>
      </div>
      <p className="intro__lead"><Lines text={intro.lead} /></p>
      <div className="intro__grid">
        {intro.photos.map((p, i) => (
          <Picture key={`${p.photo}-${i}`} name={p.photo} alt={p.alt} className="photo" sizes={TILE_SIZES} />
        ))}
      </div>
    </section>
  );
}
