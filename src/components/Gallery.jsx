import Picture from './Picture.jsx';
import './Gallery.css';

const CARD_SIZES = '(max-width: 1000px) 220px, (max-width: 1364px) 22vw, 300px';
const pad = (n) => String(n).padStart(2, '0');

export default function Gallery({ gallery, projectIndex, onOpen }) {
  return (
    <section className="gallery" aria-label="Projects gallery">
      <div className="gallery__head">
        <div>Projects</div>
        <div>Scroll →</div>
      </div>
      <div className="gallery__track">
        {gallery.map((g, i) => {
          const target = g.project ? projectIndex(g.project) : -1;
          const body = (
            <>
              <Picture
                name={g.photo}
                alt={g.alt}
                className={g.mono ? 'photo gallery__photo--mono' : 'photo'}
                sizes={CARD_SIZES}
              />
              <div className="gallery__title">{g.title}</div>
              <div className="gallery__count num">{pad(g.count)} images</div>
            </>
          );
          return target >= 0 ? (
            <button key={`${g.photo}-${i}`} type="button" className="gallery__card gallery__card--link" onClick={() => onOpen(target)} aria-haspopup="dialog">
              {body}
            </button>
          ) : (
            <div key={`${g.photo}-${i}`} className="gallery__card">{body}</div>
          );
        })}
      </div>
      <div className="gallery__foot">
        <div>04</div>
        <div>Gallery</div>
      </div>
    </section>
  );
}
