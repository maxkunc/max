import { useEffect, useRef, useState } from 'react';
import Header from './Header.jsx';
import Picture from './Picture.jsx';
import Lines from './Lines.jsx';
import './Hero.css';

const STACK_SIZES = '(max-width: 625px) 150px, 24vw';
const POSITIONS = ['left', 'right', 'center'];

export default function Hero({ hero, siteName }) {
  // Reveal the hero only once the fonts and the three photos are ready, so it
  // doesn't jump around while loading (max 2.5 s wait on slow connections).
  const [ready, setReady] = useState(false);
  const pending = useRef(hero.photos.length);
  const onPhoto = () => { pending.current -= 1; if (pending.current <= 0) document.fonts.ready.then(() => setReady(true)); };
  useEffect(() => {
    const t = setTimeout(() => setReady(true), 2500);
    // Photos may already be complete from cache before React attached onLoad.
    const imgs = [...document.querySelectorAll('.hero__photo')];
    if (imgs.length && imgs.every((i) => i.complete)) document.fonts.ready.then(() => setReady(true));
    return () => clearTimeout(t);
  }, []);

  return (
    <div className="hero-wrap">
      <Header name={siteName} />
      <section id="top" className={`hero${ready ? ' is-ready' : ''}`}>
        <div className="hero__stage">
          <div aria-hidden="true" className="hero__stack">
            {hero.photos.map((name, i) => (
              <Picture
                key={`${name}-${i}`}
                name={name}
                className={`hero__photo hero__photo--${POSITIONS[i] || 'center'}`}
                sizes={STACK_SIZES}
                priority
                onLoad={onPhoto}
              />
            ))}
          </div>
          <h1 className="hero__title">
            {hero.lines.map((line, i) => (
              <span key={i} className={`hero__line hero__line--${i + 1}`}>{line}</span>
            ))}
          </h1>
        </div>
        <div className="hero__meta">
          <div>{hero.studio}</div>
          <div className="hero__meta-center"><Lines text={hero.tagline} /></div>
          <div>{hero.year}</div>
        </div>
      </section>
    </div>
  );
}
