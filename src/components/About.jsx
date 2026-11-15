import Picture from './Picture.jsx';
import './About.css';

export default function About() {
  return (
    <section id="about" className="about">
      <div className="about__media">
        <Picture
          name="o5-2"
          alt="Max operating camera in the crowd at O2 Universum"
          className="about__photo"
          sizes="(max-width: 700px) 100vw, 50vw"
        />
        <div className="about__caption">
          <div>Project:</div><div>O5 a Radeček</div><div className="about__r">01</div>
          <div>Venue:</div><div>O2 Universum</div><div className="about__r">Prague</div>
          <div>Role:</div><div>Camera operator</div><div className="about__r">Live</div>
        </div>
        <div className="about__corner">Bigger stage,<br />bigger crowd</div>
      </div>
      <div className="about__body">
        <div className="about__top">
          <div>About<br />Max Kunc</div>
          <div className="about__r">Studio:<br />REDDOS Productions</div>
        </div>
        <div className="about__label about__role">Filmmaker, photographer<br />&amp; designer</div>
        <p className="about__quote">
          <span className="about__open">“</span>
          With a strong eye for atmosphere, movement and storytelling, I capture the moments that make events memorable.{'      '}
          <span className="about__close">“</span>
        </p>
      </div>
    </section>
  );
}
