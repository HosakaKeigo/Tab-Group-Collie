import React from 'react';
import ReactDOM from 'react-dom/client';
import Options from './Options';

const rootElement = document.getElementById('options-root');
if (!rootElement) {
  throw new Error('Failed to find the root element for options.');
}

ReactDOM.createRoot(rootElement).render(
  <React.StrictMode>
    <Options />
  </React.StrictMode>
);
