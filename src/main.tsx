import React from 'react';
import ReactDOM from 'react-dom/client';
import App from './app/App';
import { BackgroundMusic } from './components/music/BackgroundMusic';
import './styles/globals.css';
import './styles/gallery.css';

ReactDOM.createRoot(document.getElementById('root')!).render(
  <React.StrictMode>
    <BackgroundMusic />
    <App />
  </React.StrictMode>,
);
