import photos from '../images.js';
import { isUpload, uploadUrl } from '../supabase-config.js';

const MIME = { avif: 'image/avif', webp: 'image/webp' };

/**
 * Responsive <picture> with AVIF/WebP sources and a JPEG fallback.
 * `picture` is `display: contents`, so the <img> lays out exactly as a bare <img>.
 * Images are lazy unless `priority` is set (hero only).
 */
export default function Picture({ name, alt = '', sizes, className, priority = false, onLoad, style, eager = false }) {
  const loading = priority || eager ? 'eager' : 'lazy';
  const common = { alt, className, sizes, loading, onLoad, style, decoding: priority ? 'sync' : 'async', fetchPriority: priority ? 'high' : undefined };

  // Photo uploaded from /admin (Supabase Storage, 800 + 1600 px JPEGs).
  if (isUpload(name)) {
    return <img src={uploadUrl(name, 1600)} srcSet={`${uploadUrl(name, 800)} 800w, ${uploadUrl(name, 1600)} 1600w`} {...common} />;
  }

  const pic = photos[name];
  if (!pic) return null;
  return (
    <picture>
      {Object.entries(pic.sources).map(([format, srcSet]) => (
        <source key={format} type={MIME[format]} srcSet={srcSet} sizes={sizes} />
      ))}
      <img src={pic.img.src} width={pic.img.w} height={pic.img.h} {...common} />
    </picture>
  );
}

/** Width / height of a built-in photo, or null if unknown (e.g. an upload before it loads). */
export function photoAspect(name) {
  const pic = photos[name];
  return pic ? pic.img.w / pic.img.h : null;
}
