import Footer from './Footer.jsx';
import Lines from './Lines.jsx';
import './Contact.css';

export default function Contact({ contact, footer }) {
  return (
    <section id="contact" className="contact">
      <div className="contact__label">Contact</div>
      <h2 className="contact__heading"><Lines text={contact.heading} /></h2>
      <div className="contact__grid">
        {contact.items.map((c, i) => (
          <div key={i}>
            <div className="contact__key">[{c.label}]</div>
            <a href={c.href} className="contact__link">{c.text}</a>
          </div>
        ))}
      </div>
      <Footer footer={footer} />
    </section>
  );
}
