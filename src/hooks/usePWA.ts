import { useCallback, useEffect, useState } from 'react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

export function getShareableAppUrl(lang?: 'ru' | 'kk'): string {
  if (typeof window === 'undefined') return '';
  const { origin, hostname } = window.location;
  // If opened in AI Studio dev preview host, convert to public shared host so friends can open it
  const base = hostname.startsWith('ais-dev-')
    ? origin.replace('://ais-dev-', '://ais-pre-')
    : origin;
  return lang === 'kk' ? `${base}/?lang=kk` : base;
}

export function usePWAInstall() {
  const [deferredPrompt, setDeferredPrompt] =
    useState<BeforeInstallPromptEvent | null>(() => {
      if (typeof window !== 'undefined' && window.__examDeferredPrompt) {
        return window.__examDeferredPrompt as BeforeInstallPromptEvent;
      }
      return null;
    });
  const [isInstalled, setIsInstalled] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isAndroid, setIsAndroid] = useState(false);
  const [isInIframe, setIsInIframe] = useState(false);

  useEffect(() => {
    const isStandalone =
      window.matchMedia('(display-mode: standalone)').matches ||
      (window.navigator as unknown as { standalone?: boolean }).standalone === true;
    setIsInstalled(isStandalone);

    const ua = window.navigator.userAgent.toLowerCase();
    setIsIOS(/iphone|ipad|ipod/.test(ua));
    setIsAndroid(/android/.test(ua));

    try {
      setIsInIframe(window.self !== window.top);
    } catch {
      setIsInIframe(true);
    }

    if (window.__examDeferredPrompt) {
      setDeferredPrompt(window.__examDeferredPrompt as BeforeInstallPromptEvent);
    }

    const handleBeforeInstall = (e: Event) => {
      e.preventDefault();
      window.__examDeferredPrompt = e;
      setDeferredPrompt(e as BeforeInstallPromptEvent);
    };

    const handleInstalled = () => {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__examDeferredPrompt = null;
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstall);
    window.addEventListener('appinstalled', handleInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstall);
      window.removeEventListener('appinstalled', handleInstalled);
    };
  }, []);

  const install = async () => {
    if (!deferredPrompt) return false;
    await deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    if (outcome === 'accepted') {
      setIsInstalled(true);
      setDeferredPrompt(null);
      window.__examDeferredPrompt = null;
      return true;
    }
    return false;
  };

  return {
    isInstallable: !!deferredPrompt,
    isInstalled,
    isIOS,
    isAndroid,
    isInIframe,
    install,
  };
}

export function useShareApp(lang?: 'ru' | 'kk') {
  const [copied, setCopied] = useState(false);
  const shareUrl = getShareableAppUrl(lang);

  const share = useCallback(
    async (shareLang: 'ru' | 'kk') => {
      const url = getShareableAppUrl(shareLang);
      const title = 'EXAM.exe';
      const text =
        shareLang === 'ru'
          ? 'Сыграй в EXAM.exe — киберпанк-тренажёр по информатике и ЕНТ! Открой ссылку и установи как приложение:'
          : 'EXAM.exe ойынын ойна — информатика және ҰБТ-ға дайындық тренажёрі! Сілтемені ашып, қосымша ретінде орнат:';

      if (typeof navigator !== 'undefined' && navigator.share) {
        try {
          await navigator.share({ title, text, url });
          return true;
        } catch {
          // User cancelled or share unavailable; fallback to clipboard
        }
      }

      try {
        await navigator.clipboard.writeText(url);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2400);
        return true;
      } catch {
        // Legacy fallback
        const el = document.createElement('textarea');
        el.value = url;
        el.style.position = 'fixed';
        el.style.opacity = '0';
        document.body.appendChild(el);
        el.select();
        document.execCommand('copy');
        document.body.removeChild(el);
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2400);
        return true;
      }
    },
    []
  );

  return { shareUrl, copied, share };
}

export function useOnlineStatus() {
  const [isOnline, setIsOnline] = useState(
    typeof navigator !== 'undefined' ? navigator.onLine : true
  );

  useEffect(() => {
    const onOnline = () => setIsOnline(true);
    const onOffline = () => setIsOnline(false);

    window.addEventListener('online', onOnline);
    window.addEventListener('offline', onOffline);

    return () => {
      window.removeEventListener('online', onOnline);
      window.removeEventListener('offline', onOffline);
    };
  }, []);

  return isOnline;
}
