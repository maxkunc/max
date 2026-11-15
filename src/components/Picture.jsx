import photos from '../images.js';

const MIME = { avif: 'image/avif', webp: 'image/webp' };

/**
 * Responsive <picture> with AVIF/WebP sources and a JPEG fallback.
 * `picture` is `display: contents`, so the <img> lays out exactly as a bare <img>.
 * Images are lazy unless `priority` is set (hero only).
 */
export default function Picture({ name, alt = '', sizes, className, priority = false }) {
  const pic = photos[name];
  if (!pic) throw new Error(`Unknown photo: ${name}`);
  return (
    <picture>
      {Object.entries(pic.sources).map(([format, srcSet]) => (
        <source key={format} type={MIME[format]} srcSet={srcSet} sizes={sizes} />
      ))}
      <img
        src={pic.img.src}
        width={pic.img.w}
        height={pic.img.h}
        alt={alt}
        className={className}
        sizes={sizes}
        loading={priority ? 'eager' : 'lazy'}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
      />
    </picture>
  );
}
