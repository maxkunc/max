import Header from './Header.jsx';
import Picture from './Picture.jsx';
import './Hero.css';

const STACK_SIZES = '(max-width: 625px) 150px, 24vw';

export default function Hero() {
  return (
    <div className="hero-wrap">
      <Header />
      <section id="top" className="hero">
        <div className="hero__stage">
          <div aria-hidden="true" className="hero__stack">
            <Picture name="dj-stayer-1" className="hero__photo hero__photo--back" sizes={STACK_SIZES} priority />
            <Picture name="o5-1" className="hero__photo hero__photo--mid" sizes={STACK_SIZES} priority />
            <Picture name="p1-portrait" className="hero__photo hero__photo--front" sizes={STACK_SIZES} priority />
          </div>
          <h1 className="hero__title">
            <span className="hero__line hero__line--1">Hello, I’m</span>
            <span className="hero__line hero__line--2">Maxmilian</span>
            <span className="hero__line hero__line--3">Kunc</span>
          </h1>
        </div>
        <div className="hero__meta">
          <div>REDDOS Productions</div>
          <div className="hero__meta-center">Filmmaker &amp; photographer<br />based in Hradec Králové</div>
          <div>©2026</div>
        </div>
      </section>
    </div>
  );
}
