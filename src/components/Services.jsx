import './Services.css';

const pad = (n) => String(n).padStart(2, '0');

export default function Services({ services }) {
  return (
    <section id="services" className="services">
      <div className="services__head">
        <div>Services</div>
        <div className="num services__count">({pad(services.length)})</div>
      </div>
      <div className="services__list">
        {services.map((s, i) => (
          <div key={i} className="services__row">
            <div className="services__title">({i + 1}) {s.title}</div>
            <div className="services__tags">
              {s.tags.map((t, j) => <span key={j}>{j > 0 && <br />}{t}</span>)}
            </div>
          </div>
        ))}
      </div>
    </section>
  );
}
