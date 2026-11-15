import Picture from './Picture.jsx';
import Lines from './Lines.jsx';
import './About.css';

export default function About({ about }) {
  return (
    <section id="about" className="about">
      <div className="about__media">
        <Picture name={about.photo} alt={about.photoAlt} className="about__photo" sizes="(max-width: 700px) 100vw, 50vw" />
        <div className="about__caption">
          {about.caption.map((c, i) => [
            <div key={`l${i}`}>{c.label}</div>,
            <div key={`v${i}`}>{c.value}</div>,
            <div key={`n${i}`} className="about__r">{c.note}</div>,
          ])}
        </div>
        <div className="about__corner"><Lines text={about.corner} /></div>
      </div>
      <div className="about__body">
        <div className="about__top">
          <div><Lines text={about.heading} /></div>
          <div className="about__r"><Lines text={about.studio} /></div>
        </div>
        <div className="about__label about__role"><Lines text={about.role} /></div>
        <p className="about__quote">
          <span className="about__open">“</span>
          {about.quote}{'      '}
          <span className="about__close">“</span>
        </p>
      </div>
    </section>
  );
}
