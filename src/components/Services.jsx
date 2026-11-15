import { SERVICES } from '../content.js';
import './Services.css';

const pad = (n) => String(n).padStart(2, '0');

export default function Services() {
  return (
    <section id="services" className="services">
      <div className="services__head">
        <div>Services</div>
        <div className="mono services__count">({pad(SERVICES.length)})</div>
      </div>
      <div className="services__list">
        {SERVICES.map((s, i) => (
          <div key={s.title} className="services__row">
            <div className="services__title">({i + 1}) {s.title}</div>
            <div className="services__tags">
              {s.tags.map((t, j) => <span key={t}>{j > 0 && <br />}{t}</span>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
