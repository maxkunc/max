import Picture from './Picture.jsx';
import './Gallery.css';

const CARD_SIZES = '(max-width: 1000px) 220px, (max-width: 1364px) 22vw, 300px';
const pad = (n) => String(n).padStart(2, '0');

export default function Gallery({ gallery }) {
  return (
    <section className="gallery" aria-label="Projects gallery">
      <div className="gallery__head">
        <div>Projects</div>
        <div>Scroll →</div>
      </div>
      <div className="gallery__track">
        {gallery.map((g, i) => (
          <div key={`${g.photo}-${i}`} className="gallery__card">
            <Picture
              name={g.photo}
              alt={g.alt}
              className={g.mono ? 'photo gallery__photo--mono' : 'photo'}
              sizes={CARD_SIZES}
            />
            <div className="gallery__title">{g.title}</div>
            <div className="gallery__count">{pad(g.count)} images</div>
          </div>
        ))}
      </div>
      <div className="gallery__foot">
        <div>04</div>
        <div>Gallery</div>
      </div>
    </section>
  );
}
