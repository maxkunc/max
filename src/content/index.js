import bundled from './content.json';
import { SB_URL, SB_KEY } from '../supabase-config.js';

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

/** Live content from Supabase; null if unreachable (then the bundled copy is used). */
export async function fetchLiveContent(timeoutMs = 3000) {
  if (!SB_URL || !SB_KEY) return null;
  const ctrl = new AbortController();
  const timer = setTimeout(() => ctrl.abort(), timeoutMs);
  try {
    const res = await fetch(`${SB_URL}/rest/v1/site_content?id=eq.main&select=content`, {
      headers: { apikey: SB_KEY, Authorization: `Bearer ${SB_KEY}` },
      signal: ctrl.signal,
    });
    if (!res.ok) return null;
    const rows = await res.json();
    return rows[0]?.content || null;
  } catch {
    return null;
  } finally {
    clearTimeout(timer);
  }
}

/** Content to render: the admin's draft when previewing, else live, else bundled fallback. */
export async function loadContent() {
  if (isPreview) {
    const draft = readDraft();
    if (draft?.content) return draft.content;
  }
  return (await fetchLiveContent()) || bundled;
}

export { bundled };
