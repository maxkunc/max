import './Footer.css';

export default function Footer({ footer }) {
  return (
    <footer className="site-footer">
      <div>{footer.name}</div>
      <div>{footer.place}</div>
      <div>{footer.year}</div>
    </footer>
  );
}
