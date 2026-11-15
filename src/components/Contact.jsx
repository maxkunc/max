import { CONTACTS } from '../content.js';
import Footer from './Footer.jsx';
import './Contact.css';

export default function Contact() {
  return (
    <section id="contact" className="contact">
      <div className="contact__label">Contact</div>
      <h2 className="contact__heading">Let’s work<br />together</h2>
      <div className="contact__grid">
        {CONTACTS.map((c) => (
          <div key={c.label}>
            <div className="contact__key">[{c.label}]</div>
            <a href={c.href} className="contact__link">{c.text}</a>
          </div>
        ))}
      </div>
      <Footer />
    </section>
  );
}
