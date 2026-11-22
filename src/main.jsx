import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { loadContent } from './content/index.js';
import { startAnalytics } from './analytics.js';
import './styles.css';

startAnalytics();

loadContent().then((content) => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App content={content} />
    </StrictMode>,
  );
});
