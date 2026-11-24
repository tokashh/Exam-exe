import React, { useState } from 'react';
import {
  Check,
  Copy,
  Download,
  ExternalLink,
  Share2,
  Smartphone,
  WifiOff,
  X,
} from 'lucide-react';
import { useOnlineStatus, usePWAInstall, useShareApp } from '../hooks/usePWA';
import { UI_TEXT } from '../i18n/translations';
import { Language } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface PWAInstallButtonProps {
  lang: Language;
  compact?: boolean;
}

export const ShareGameButton: React.FC<{
  lang: Language;
  variant?: 'primary' | 'subtle';
}> = ({ lang, variant = 'subtle' }) => {
  const { shareUrl, copied, share } = useShareApp(lang);
  const [showLinkBox, setShowLinkBox] = useState(false);

  const label = copied
    ? lang === 'ru'
      ? 'Ссылка скопирована'
      : 'Сілтеме көшірілді'
    : lang === 'ru'
      ? 'Поделиться игрой'
      : 'Ойынмен бөлісу';

  return (
    <>
      <button
        type="button"
        onClick={async () => {
          soundEngine.playSfx('click');
          await share(lang);
        }}
        onContextMenu={(e) => {
          e.preventDefault();
          setShowLinkBox(true);
        }}
        className={`inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl px-4 py-2 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
          copied
            ? 'border border-[#75FFAE]/60 bg-[#75FFAE]/15 text-[#75FFAE]'
            : variant === 'primary'
              ? 'border border-[#5AD9F5]/50 bg-[#5AD9F5]/15 text-[#5AD9F5] hover:bg-[#5AD9F5]/25'
              : 'border border-[#24343B] bg-[#0B1013] text-[#F2F5F3] hover:border-[#5AD9F5]/50 hover:text-[#5AD9F5]'
        }`}
      >
        {copied ? (
          <Check className="h-4 w-4 shrink-0" />
        ) : (
          <Share2 className="h-4 w-4 shrink-0" />
        )}
        <span>{label}</span>
      </button>

      {showLinkBox && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#233238] bg-[#11181B] p-5 space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-base font-semibold text-[#F2F5F3]">
                {lang === 'ru' ? 'Ссылка для друга' : 'Досыңызға сілтеме'}
              </h3>
              <button
                type="button"
                onClick={() => setShowLinkBox(false)}
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8A9993] hover:text-[#F2F5F3]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
            <input
              type="text"
              readOnly
              value={shareUrl}
              onClick={(e) => e.currentTarget.select()}
              className="min-h-[44px] w-full rounded-lg border border-[#24343B] bg-[#080B0D] px-3 font-mono text-xs text-[#75FFAE]"
            />
          </div>
        </div>
      )}
    </>
  );
};

export const PWAInstallButton: React.FC<PWAInstallButtonProps> = ({
  lang,
  compact = false,
}) => {
  const { isInstallable, isInstalled, isIOS, isAndroid, isInIframe, install } =
    usePWAInstall();
  const { shareUrl, copied, share } = useShareApp(lang);
  const [showGuide, setShowGuide] = useState(false);
  const t = UI_TEXT[lang].settings;

  if (isInstalled) {
    if (compact) return null;
    return (
      <div className="flex items-center gap-2 text-xs font-mono text-[#75FFAE]">
        <Smartphone className="h-4 w-4 shrink-0" />
        <span>{t.pwaInstalled}</span>
      </div>
    );
  }

  if (isInstallable && !isInIframe) {
    return (
      <button
        type="button"
        onClick={() => {
          soundEngine.playSfx('click');
          install();
        }}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#75FFAE]/45 bg-[#75FFAE]/12 px-4 py-2 text-xs font-semibold text-[#75FFAE] transition hover:bg-[#75FFAE]/22 whitespace-nowrap shrink-0"
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>{t.installApp}</span>
      </button>
    );
  }

  return (
    <>
      <button
        type="button"
        onClick={() => {
          soundEngine.playSfx('click');
          setShowGuide(true);
        }}
        className="inline-flex min-h-[44px] items-center justify-center gap-2 rounded-xl border border-[#75FFAE]/40 bg-[#75FFAE]/10 px-4 py-2 text-xs font-semibold text-[#75FFAE] transition hover:bg-[#75FFAE]/20 whitespace-nowrap shrink-0"
      >
        <Download className="h-4 w-4 shrink-0" />
        <span>
          {isIOS
            ? t.iosInstall
            : lang === 'ru'
              ? 'Скачать на устройство'
              : 'Құрылғыға орнату'}
        </span>
      </button>

      {showGuide && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-sm">
          <div className="w-full max-w-md rounded-2xl border border-[#233238] bg-[#11181B] p-6 shadow-2xl space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="font-display text-lg font-bold text-[#F2F5F3]">
                {lang === 'ru'
                  ? 'Установка EXAM.exe на устройство'
                  : 'EXAM.exe-ні құрылғыға орнату'}
              </h3>
              <button
                type="button"
                onClick={() => setShowGuide(false)}
                aria-label="Close"
                className="flex h-9 w-9 items-center justify-center rounded-lg text-[#8A9993] hover:bg-[#1A252A] hover:text-[#F2F5F3]"
              >
                <X className="h-4 w-4" />
              </button>
            </div>

            {isInIframe && (
              <div className="rounded-xl border border-[#5AD9F5]/40 bg-[#5AD9F5]/10 p-3.5 text-xs leading-relaxed text-[#F2F5F3] space-y-2.5">
                <p>
                  {lang === 'ru'
                    ? 'Сейчас приложение открыто внутри встроенного окна. Чтобы скачать и установить его на телефон или ПК, откройте ссылку напрямую в браузере (Safari или Chrome).'
                    : 'Қазір қосымша ішкі терезеде ашылған. Оны телефонға немесе компьютерге орнату үшін сілтемені тікелей браузерде (Safari немесе Chrome) ашыңыз.'}
                </p>
                <div className="flex flex-wrap gap-2">
                  <a
                    href={shareUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg bg-[#5AD9F5] px-3 py-1.5 text-xs font-bold text-[#080B0D]"
                  >
                    <ExternalLink className="h-3.5 w-3.5" />
                    <span>
                      {lang === 'ru' ? 'Открыть в новой вкладке' : 'Жаңа қойындыда ашу'}
                    </span>
                  </a>
                  <button
                    type="button"
                    onClick={() => share(lang)}
                    className="inline-flex min-h-[38px] items-center gap-1.5 rounded-lg border border-[#2A3B42] bg-[#0B1013] px-3 py-1.5 text-xs font-medium text-[#F2F5F3]"
                  >
                    {copied ? <Check className="h-3.5 w-3.5 text-[#75FFAE]" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>
                      {copied
                        ? lang === 'ru'
                          ? 'Скопировано'
                          : 'Көшірілді'
                        : lang === 'ru'
                          ? 'Скопировать ссылку'
                          : 'Сілтемені көшіру'}
                    </span>
                  </button>
                </div>
              </div>
            )}

            <div className="space-y-3 text-xs leading-relaxed text-[#8A9993]">
              {isIOS ? (
                <div className="rounded-xl border border-[#1E2C30] bg-[#0B1013] p-3.5 space-y-1.5">
                  <div className="font-mono font-semibold text-[#75FFAE]">
                    iPhone / iPad (Safari)
                  </div>
                  <p className="text-[#F2F5F3]/90">
                    {lang === 'ru'
                      ? '1. Откройте ссылку в Safari.'
                      : '1. Сілтемені Safari браузерінде ашыңыз.'}
                  </p>
                  <p className="text-[#F2F5F3]/90">
                    {lang === 'ru'
                      ? '2. Нажмите «Поделиться» (квадрат со стрелкой вверх) на панели снизу.'
                      : '2. Төменгі панельде «Бөлісу» (Share) батырмасын басыңыз.'}
                  </p>
                  <p className="text-[#F2F5F3]/90">
                    {lang === 'ru'
                      ? '3. Выберите «На экран «Домой» (Add to Home Screen) — иконка EXAM.exe появится на рабочем столе и будет работать без интернета.'
                      : '3. «Басты экранға қосу» (Add to Home Screen) таңдаңыз — EXAM.exe белгішесі пайда болып, интернетсіз жұмыс істейді.'}
                  </p>
                </div>
              ) : isAndroid ? (
                <div className="rounded-xl border border-[#1E2C30] bg-[#0B1013] p-3.5 space-y-1.5">
                  <div className="font-mono font-semibold text-[#75FFAE]">
                    Android (Chrome)
                  </div>
                  <p className="text-[#F2F5F3]/90">
                    {lang === 'ru'
                      ? '1. Нажмите меню браузера (⋮) в правом верхнем углу.'
                      : '1. Жоғарғы оң жақтағы браузер мәзірін (⋮) ашыңыз.'}
                  </p>
                  <p className="text-[#F2F5F3]/90">
                    {lang === 'ru'
                      ? '2. Выберите «Установить приложение» или «Добавить на гл. экран».'
                      : '2. «Қосымшаны орнату» немесе «Басты экранға қосу» таңдаңыз.'}
                  </p>
                </div>
              ) : (
                <div className="rounded-xl border border-[#1E2C30] bg-[#0B1013] p-3.5 space-y-1.5">
                  <div className="font-mono font-semibold text-[#75FFAE]">
                    Windows / macOS / Mobile
                  </div>
                  <p className="text-[#F2F5F3]/90">
                    {lang === 'ru'
                      ? 'В адресной строке Chrome или Edge справа нажмите иконку «Установить EXAM.exe», либо на телефоне откройте меню Safari/Chrome → «Добавить на экран Домой».'
                      : 'Chrome немесе Edge мекенжай жолағында «EXAM.exe орнату» белгішесін басыңыз, ал телефонда Safari/Chrome мәзірінен «Басты экранға қосу» тармағын таңдаңыз.'}
                  </p>
                </div>
              )}

              <div className="rounded-xl border border-[#1E2C30] bg-[#0B1013] p-3">
                <div className="mb-1.5 text-[11px] font-mono text-[#5AD9F5]">
                  {lang === 'ru' ? 'Публичная ссылка для отправки друзьям:' : 'Достарға жіберуге арналған сілтеме:'}
                </div>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={shareUrl}
                    onClick={(e) => e.currentTarget.select()}
                    className="min-h-[38px] flex-1 rounded-lg border border-[#24343B] bg-[#080B0D] px-2.5 font-mono text-[11px] text-[#F2F5F3]"
                  />
                  <button
                    type="button"
                    onClick={() => share(lang)}
                    className="inline-flex min-h-[38px] items-center gap-1 rounded-lg bg-[#75FFAE] px-3 text-xs font-bold text-[#080B0D] shrink-0"
                  >
                    {copied ? <Check className="h-3.5 w-3.5" /> : <Copy className="h-3.5 w-3.5" />}
                    <span>{copied ? 'OK' : lang === 'ru' ? 'Копия' : 'Көшіру'}</span>
                  </button>
                </div>
              </div>
            </div>

            <button
              type="button"
              onClick={() => setShowGuide(false)}
              className="w-full min-h-[44px] rounded-xl bg-[#75FFAE] px-4 py-2 text-sm font-bold text-[#080B0D] transition hover:bg-[#8BFFBA]"
            >
              OK
            </button>
          </div>
        </div>
      )}
    </>
  );
};

export const OfflineIndicator: React.FC<{ lang: Language }> = ({ lang }) => {
  const isOnline = useOnlineStatus();
  if (isOnline) return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-50 mx-auto flex max-w-md items-center gap-2.5 rounded-lg border border-[#FF626C]/40 bg-[#11181B]/95 px-3.5 py-2 text-xs font-medium text-[#F2F5F3] shadow-xl backdrop-blur-md md:bottom-4 md:left-auto md:right-4">
      <WifiOff className="h-4 w-4 shrink-0 text-[#FF626C]" />
      <span>{UI_TEXT[lang].offlineBanner}</span>
    </div>
  );
};
