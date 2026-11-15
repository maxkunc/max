// Every photo in src/assets/photos is turned into AVIF + WebP + JPEG at
// 400/800/1200 px wide (never upscaled) at build time by vite-imagetools.
const modules = import.meta.glob('./assets/photos/*.{jpg,jpeg,png}', {
  query: { w: '400;800;1200', format: 'avif;webp;jpg', withoutEnlargement: '', as: 'picture' },
  import: 'default',
  eager: true,
});

const photos = Object.fromEntries(
  Object.entries(modules).map(([path, pic]) => [path.split('/').pop().replace(/\.(jpe?g|png)$/, ''), pic]),
);

export const photoNames = Object.keys(photos).sort();
export default photos;
