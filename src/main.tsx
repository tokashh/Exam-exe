import { createRoot } from 'react-dom/client';
import { registerSW } from 'virtual:pwa-register';
import App from './App.tsx';
import './index.css';

// Capture beforeinstallprompt early so it is never missed before React mounts
declare global {
  interface Window {
    __examDeferredPrompt?: Event | null;
  }
}

window.addEventListener('beforeinstallprompt', (e) => {
  e.preventDefault();
  window.__examDeferredPrompt = e;
});

// Register PWA Service Worker for offline caching & installability
registerSW({ immediate: true });

createRoot(document.getElementById('root')!).render(<App />);
