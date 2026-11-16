import { StrictMode } from 'react';
import { createRoot, hydrateRoot } from 'react-dom/client';
import { App } from './App';
import './styles/tokens.css';
import './styles/base.css';
import './styles/sections.css';

const container = document.getElementById('root');
if (!container) throw new Error('Root element #root not found');

const app = (
  <StrictMode>
    <App />
  </StrictMode>
);

// The production build pre-renders the page for SEO, so hydrate when markup exists.
if (container.firstElementChild) hydrateRoot(container, app);
else createRoot(container).render(app);
