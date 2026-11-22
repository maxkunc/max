import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.jsx';
import { loadContent } from './content/index.js';
import './styles.css';

loadContent().then((content) => {
  createRoot(document.getElementById('root')).render(
    <StrictMode>
      <App content={content} />
    </StrictMode>,
  );
});
