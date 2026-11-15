import { NAV } from '../content.js';
import './Header.css';

export default function Header() {
  return (
    <header className="site-header">
      <a href="#top">Max Kunc</a>
      <nav aria-label="Main" className="site-header__nav">
        {NAV.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
      </nav>
    </header>
  );
}
