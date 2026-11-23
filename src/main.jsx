import { StrictMode, useEffect, useState } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import App from './App.jsx';
import { loadContent, fetchLiveContent, isPreview } from './content/index.js';
import { startAnalytics } from './analytics.js';
import './styles.css';

startAnalytics();

const rootEl = document.getElementById('root');
const embedded = (() => {
  try { return JSON.parse(document.getElementById('__content')?.textContent || 'null'); } catch { return null; }
})();

/** Starts from the content baked into the page, then swaps in anything newer from /admin. */
function Root({ initial }) {
  const [content, setContent] = useState(initial);
  useEffect(() => {
    fetchLiveContent().then((live) => {
      if (live && JSON.stringify(live) !== JSON.stringify(initial)) setContent(live);
    });
  }, [initial]);
  return <App content={content} />;
}

if (embedded && !isPreview && import.meta.env.VITE_USE_BUNDLED_CONTENT !== '1') {
  // Pre-rendered page: attach to the existing HTML instead of rebuilding it.
  hydrateRoot(rootEl, <StrictMode><Root initial={embedded} /></StrictMode>);
} else {
  loadContent().then((content) => {
    createRoot(rootEl).render(<StrictMode><App content={content} /></StrictMode>);
  });
}
