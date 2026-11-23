// Build-time rendering: turns the site into plain HTML so search engines and AI tools
// that don't run JavaScript still read every project, venue, date and service.
import { StrictMode } from 'react';
import { renderToString } from 'react-dom/server';
import App from './App.jsx';

export function render(content) {
  return renderToString(
    <StrictMode>
      <App content={content} />
    </StrictMode>,
  );
}
