import published from './content.json';
import { registerUploads } from '../images.js';

export const DRAFT_KEY = 'mk-admin-draft';

/** True when the site is opened from /admin with "Preview" (…/?preview). */
export const isPreview = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('preview');

export function readDraft() {
  try {
    const raw = localStorage.getItem(DRAFT_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch {
    return null;
  }
}

/** Published content, or the admin's unsaved draft when previewing. */
export function loadContent() {
  if (isPreview) {
    const draft = readDraft();
    if (draft?.content) {
      registerUploads(draft.uploads || {});
      return draft.content;
    }
  }
  return published;
}

export { published };
