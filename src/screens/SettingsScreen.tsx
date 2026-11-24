import React, { useState } from 'react';
import { AlertTriangle, Trash2, Volume2, VolumeX } from 'lucide-react';
import { PWAInstallButton, ShareGameButton } from '../components/PWAInstallButton';
import { UI_TEXT } from '../i18n/translations';
import { Language, PlayerSettings } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface SettingsScreenProps {
  settings: PlayerSettings;
  onUpdateSettings: (partial: Partial<PlayerSettings>) => void;
  onResetProgress: () => void;
}

export const SettingsScreen: React.FC<SettingsScreenProps> = ({
  settings,
  onUpdateSettings,
  onResetProgress,
}) => {
  const lang: Language = settings.language;
  const t = UI_TEXT[lang].settings;
  const [confirmOpen, setConfirmOpen] = useState(false);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <h1 className="font-display text-2xl font-bold text-[#F2F5F3] sm:text-3xl">
        {t.title}
      </h1>

      {/* Language Switcher */}
      <section className="rounded-2xl border border-[#1E2C30] bg-[#11181B]/90 p-5 sm:p-6 space-y-3">
        <h2 className="font-display text-base font-semibold text-[#F2F5F3]">
          {t.language}
        </h2>
        <div className="flex gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              onUpdateSettings({ language: 'ru' });
            }}
            className={`min-h-[44px] flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              lang === 'ru'
                ? 'border-[#75FFAE] bg-[#75FFAE] text-[#080B0D]'
                : 'border-[#24343B] bg-[#0B1013] text-[#F2F5F3]'
            }`}
          >
            Русский
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              onUpdateSettings({ language: 'kk' });
            }}
            className={`min-h-[44px] flex-1 rounded-xl border px-4 py-2 text-sm font-semibold transition ${
              lang === 'kk'
                ? 'border-[#75FFAE] bg-[#75FFAE] text-[#080B0D]'
                : 'border-[#24343B] bg-[#0B1013] text-[#F2F5F3]'
            }`}
          >
            Қазақша
          </button>
        </div>
      </section>

      {/* Audio Settings */}
      <section className="rounded-2xl border border-[#1E2C30] bg-[#11181B]/90 p-5 sm:p-6 space-y-5">
        <h2 className="font-display text-base font-semibold text-[#F2F5F3]">
          {t.audioSection}
        </h2>

        <div className="flex items-center justify-between gap-4">
          <div className="flex items-center gap-2.5 text-sm text-[#F2F5F3]">
            {settings.musicEnabled ? (
              <Volume2 className="h-4 w-4 text-[#75FFAE]" />
            ) : (
              <VolumeX className="h-4 w-4 text-[#8A9993]" />
            )}
            <span>{t.musicToggle}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.musicEnabled}
            onClick={() => {
              soundEngine.unlock();
              soundEngine.playSfx('click');
              onUpdateSettings({ musicEnabled: !settings.musicEnabled });
            }}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              settings.musicEnabled ? 'bg-[#75FFAE]' : 'bg-[#24343B]'
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-[#080B0D] transition-transform ${
                settings.musicEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div>
          <div className="flex justify-between text-xs text-[#8A9993]">
            <label htmlFor="music-vol">{t.musicVolume}</label>
            <span className="font-mono tabular-nums text-[#5AD9F5]">
              {Math.round(settings.musicVolume * 100)}%
            </span>
          </div>
          <input
            id="music-vol"
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.musicVolume * 100)}
            onChange={(e) => {
              soundEngine.unlock();
              onUpdateSettings({ musicVolume: Number(e.target.value) / 100 });
            }}
            className="mt-2 h-2 w-full cursor-pointer accent-[#75FFAE]"
          />
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-[#1A252A] pt-4">
          <div className="flex items-center gap-2.5 text-sm text-[#F2F5F3]">
            {settings.sfxEnabled ? (
              <Volume2 className="h-4 w-4 text-[#5AD9F5]" />
            ) : (
              <VolumeX className="h-4 w-4 text-[#8A9993]" />
            )}
            <span>{t.sfxToggle}</span>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={settings.sfxEnabled}
            onClick={() => {
              soundEngine.unlock();
              onUpdateSettings({ sfxEnabled: !settings.sfxEnabled });
            }}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              settings.sfxEnabled ? 'bg-[#5AD9F5]' : 'bg-[#24343B]'
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-[#080B0D] transition-transform ${
                settings.sfxEnabled ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div>
          <div className="flex justify-between text-xs text-[#8A9993]">
            <label htmlFor="sfx-vol">{t.sfxVolume}</label>
            <span className="font-mono tabular-nums text-[#5AD9F5]">
              {Math.round(settings.sfxVolume * 100)}%
            </span>
          </div>
          <input
            id="sfx-vol"
            type="range"
            min={0}
            max={100}
            value={Math.round(settings.sfxVolume * 100)}
            onChange={(e) => {
              soundEngine.unlock();
              onUpdateSettings({ sfxVolume: Number(e.target.value) / 100 });
            }}
            className="mt-2 h-2 w-full cursor-pointer accent-[#5AD9F5]"
          />
        </div>
      </section>

      {/* Visuals & Accessibility */}
      <section className="rounded-2xl border border-[#1E2C30] bg-[#11181B]/90 p-5 sm:p-6 space-y-4">
        <h2 className="font-display text-base font-semibold text-[#F2F5F3]">
          {t.visualSection}
        </h2>

        <div className="flex items-center justify-between gap-4">
          <span className="text-sm text-[#F2F5F3]">{t.reducedMotion}</span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.reducedMotion}
            onClick={() => {
              soundEngine.playSfx('click');
              onUpdateSettings({ reducedMotion: !settings.reducedMotion });
            }}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              settings.reducedMotion ? 'bg-[#75FFAE]' : 'bg-[#24343B]'
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-[#080B0D] transition-transform ${
                settings.reducedMotion ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>

        <div className="flex items-center justify-between gap-4 border-t border-[#1A252A] pt-4">
          <span className="text-sm text-[#F2F5F3]">{t.bgAnimations}</span>
          <button
            type="button"
            role="switch"
            aria-checked={settings.backgroundAnimations}
            onClick={() => {
              soundEngine.playSfx('click');
              onUpdateSettings({
                backgroundAnimations: !settings.backgroundAnimations,
              });
            }}
            className={`relative h-7 w-12 rounded-full transition-colors ${
              settings.backgroundAnimations ? 'bg-[#75FFAE]' : 'bg-[#24343B]'
            }`}
          >
            <span
              className={`block h-5 w-5 rounded-full bg-[#080B0D] transition-transform ${
                settings.backgroundAnimations ? 'translate-x-6' : 'translate-x-1'
              }`}
            />
          </button>
        </div>
      </section>

      {/* PWA Installation Section */}
      <section className="rounded-2xl border border-[#1E2C30] bg-[#11181B]/90 p-5 sm:p-6 space-y-3">
        <h2 className="font-display text-base font-semibold text-[#F2F5F3]">
          {t.pwaSection}
        </h2>
        <p className="text-xs leading-relaxed text-[#8A9993]">{t.pwaReady}</p>
        <div className="flex flex-wrap items-center gap-2.5">
          <PWAInstallButton lang={lang} />
          <ShareGameButton lang={lang} variant="primary" />
        </div>
      </section>

      {/* Reset Save Section */}
      <section className="rounded-2xl border border-[#FF626C]/35 bg-[#11181B]/90 p-5 sm:p-6 space-y-3">
        <h2 className="font-display text-base font-semibold text-[#FF626C]">
          {t.dangerZone}
        </h2>
        <button
          type="button"
          onClick={() => {
            soundEngine.playSfx('click');
            setConfirmOpen(true);
          }}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl border border-[#FF626C]/50 bg-[#FF626C]/10 px-4 py-2 text-xs font-semibold text-[#FF626C] hover:bg-[#FF626C]/20"
        >
          <Trash2 className="h-4 w-4" />
          <span>{t.resetBtn}</span>
        </button>
      </section>

      {confirmOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#FF626C]/45 bg-[#11181B] p-6 space-y-4">
            <div className="flex items-center gap-2.5 text-[#FF626C]">
              <AlertTriangle className="h-5 w-5 shrink-0" />
              <h3 className="font-display text-base font-bold">{t.resetConfirmTitle}</h3>
            </div>
            <p className="text-xs leading-relaxed text-[#8A9993]">
              {t.resetConfirmDesc}
            </p>
            <div className="flex gap-2 pt-2">
              <button
                type="button"
                onClick={() => setConfirmOpen(false)}
                className="min-h-[44px] flex-1 rounded-xl border border-[#24343B] bg-[#0B1013] text-xs font-semibold text-[#F2F5F3]"
              >
                {t.cancel}
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSfx('incorrect');
                  setConfirmOpen(false);
                  onResetProgress();
                }}
                className="min-h-[44px] flex-1 rounded-xl bg-[#FF626C] text-xs font-bold text-[#080B0D]"
              >
                {t.confirmReset}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
