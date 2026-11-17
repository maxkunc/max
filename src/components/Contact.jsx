import Footer from './Footer.jsx';
import Lines from './Lines.jsx';
import Picture from './Picture.jsx';
import './Contact.css';

/** Emails and web addresses are shown as written (lowercase), never uppercased. */
const isAddress = (c) => c.href?.startsWith('mailto:')
  || (!c.text?.startsWith('@') && /^(https?:\/\/|www\.)|^[a-z0-9-]+(\.[a-z0-9-]+)+(\/|$)/i.test(c.text || ''));

export default function Contact({ contact, footer }) {
  return (
    <section id="contact" className="contact">
      <div className={`contact__layout${contact.photo ? ' has-photo' : ''}`}>
        <div className="contact__intro">
          <div className="contact__label">Contact</div>
          <h2 className="contact__heading"><Lines text={contact.heading} /></h2>
        </div>
        {contact.photo && (
          <div className="contact__portrait">
            <Picture name={contact.photo} alt={contact.photoAlt} className="contact__photo" sizes="(max-width: 700px) 280px, 26vw" />
          </div>
        )}
        <div className="contact__grid">
          {contact.items.map((c, i) => (
            <div key={i}>
              <div className="contact__key">[{c.label}]</div>
              <a href={c.href} className={`contact__link${isAddress(c) ? ' contact__link--address' : ''}`}>{c.text}</a>
            </div>
          ))}
        </div>
      </div>
      <Footer footer={footer} />
    </section>
  );
}
