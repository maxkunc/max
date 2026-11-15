import photos, { uploads } from '../images.js';

const MIME = { avif: 'image/avif', webp: 'image/webp' };

/**
 * Responsive <picture> with AVIF/WebP sources and a JPEG fallback.
 * `picture` is `display: contents`, so the <img> lays out exactly as a bare <img>.
 * Images are lazy unless `priority` is set (hero only).
 */
export default function Picture({ name, alt = '', sizes, className, priority = false, onLoad }) {
  const pic = photos[name];
  const loading = priority ? 'eager' : 'lazy';
  if (!pic) {
    // Admin preview of a photo that only exists in the browser so far.
    if (uploads[name]) return <img src={uploads[name]} alt={alt} className={className} loading={loading} onLoad={onLoad} />;
    return null;
  }
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
        loading={loading}
        decoding={priority ? 'sync' : 'async'}
        fetchPriority={priority ? 'high' : undefined}
        onLoad={onLoad}
      />
    </picture>
  );
}
