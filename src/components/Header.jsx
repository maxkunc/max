import './Header.css';

export const NAV = [
  { href: '#work', label: 'Work' },
  { href: '#services', label: 'Services' },
  { href: '#about', label: 'About' },
  { href: '#contact', label: 'Contact' },
];

export default function Header({ name }) {
  return (
    <header className="site-header">
      <a href="#top">{name}</a>
      <nav aria-label="Main" className="site-header__nav">
        {NAV.map((l) => <a key={l.href} href={l.href}>{l.label}</a>)}
      </nav>
    </header>
  );
}
