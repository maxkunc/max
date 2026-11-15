// Public Supabase settings shared by the site and /admin (no client library
// here, so the public site stays small; it only uses plain fetch).
export const SB_URL = import.meta.env.VITE_SUPABASE_URL;
export const SB_KEY = import.meta.env.VITE_SUPABASE_KEY;
export const PHOTO_BUCKET = 'photos';

/** Photos uploaded from /admin are referenced in content as "up:<id>". */
export const UPLOAD_PREFIX = 'up:';
export const isUpload = (name = '') => name.startsWith(UPLOAD_PREFIX);
export const uploadId = (name) => name.slice(UPLOAD_PREFIX.length);

/** Each upload is stored at photos/<id>/800.jpg and photos/<id>/1600.jpg. */
export const uploadUrl = (name, size = 1600) =>
  `${SB_URL}/storage/v1/object/public/${PHOTO_BUCKET}/${uploadId(name)}/${size}.jpg`;
