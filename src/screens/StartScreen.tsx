import React, { useEffect, useState } from 'react';
import { ChevronRight, Terminal } from 'lucide-react';
import { Language } from '../types/game';
import { UI_TEXT } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';
import { PWAInstallButton, ShareGameButton } from '../components/PWAInstallButton';
import { CyberIllustration } from '../components/CyberIllustration';

interface StartScreenProps {
  lang: Language;
  initialNickname: string;
  hasBootedBefore: boolean;
  onChangeLang: (lang: Language) => void;
  onStart: (nickname: string) => void;
}

export const StartScreen: React.FC<StartScreenProps> = ({
  lang,
  initialNickname,
  hasBootedBefore,
  onChangeLang,
  onStart,
}) => {
  const t = UI_TEXT[lang];
  const [step, setStep] = useState<number>(hasBootedBefore ? 6 : 0);
  const [nickname, setNickname] = useState<string>(initialNickname);
  const [errorMsg, setErrorMsg] = useState<string>('');

  useEffect(() => {
    if (step >= 6) return;
    const delays = [320, 420, 420, 420, 480, 420];
    const timer = window.setTimeout(() => {
      setStep((s) => s + 1);
    }, delays[step] ?? 400);
    return () => window.clearTimeout(timer);
  }, [step]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    soundEngine.unlock();
    const cleaned = nickname.trim();
    if (!cleaned) {
      setErrorMsg(
        lang === 'ru'
          ? 'Введите позывной оператора (минимум 2 символа).'
          : 'Оператор лақап атын енгізіңіз (кемінде 2 таңба).'
      );
      soundEngine.playSfx('incorrect');
      return;
    }
    soundEngine.playSfx('unlock');
    onStart(cleaned);
  };

  return (
    <div className="relative z-10 flex min-h-screen flex-col items-center justify-center px-4 py-10">
      <div className="w-full max-w-2xl rounded-2xl border border-[#1E2C30] bg-[#0B1013]/95 p-6 shadow-2xl backdrop-blur-md sm:p-8">
        {/* Terminal Header Row + Prominent Language Switcher */}
        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#1A252A] pb-3.5">
          <div className="flex items-center gap-2 font-mono text-xs text-[#8A9993]">
            <Terminal className="h-4 w-4 text-[#75FFAE]" />
            <span>{t.bootSeqTitle}</span>
          </div>
          <div className="flex items-center gap-2">
            <div className="flex items-center gap-1 rounded-lg border border-[#1E2C30] bg-[#11181B] p-0.5">
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSfx('click');
                  onChangeLang('kk');
                }}
                className={`min-h-[34px] rounded-md px-2.5 text-xs font-semibold transition ${
                  lang === 'kk'
                    ? 'bg-[#75FFAE] text-[#080B0D]'
                    : 'text-[#8A9993] hover:text-[#F2F5F3]'
                }`}
              >
                Қазақша
              </button>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSfx('click');
                  onChangeLang('ru');
                }}
                className={`min-h-[34px] rounded-md px-2.5 text-xs font-semibold transition ${
                  lang === 'ru'
                    ? 'bg-[#75FFAE] text-[#080B0D]'
                    : 'text-[#8A9993] hover:text-[#F2F5F3]'
                }`}
              >
                Русский
              </button>
            </div>
            {step < 6 && (
              <button
                type="button"
                onClick={() => setStep(6)}
                className="text-xs font-medium text-[#5AD9F5] hover:underline whitespace-nowrap"
              >
                {t.skipBoot}
              </button>
            )}
          </div>
        </div>

        {/* Hero Cyberpunk Core Visual */}
        <CyberIllustration
          src="/src/assets/images/hero_cyber_core_1795428069177.jpg"
          alt="EXAM.exe Cyber Core"
          eager
          accent="green"
          fallbackLabel="EXAM.exe // CORE"
          className="mt-4 h-36 w-full rounded-xl border border-[#1E2C30] sm:h-44"
          scrimClassName="bg-gradient-to-t from-[#0B1013] via-[#0B1013]/30 to-transparent"
        />

        {/* Boot Sequence Log */}
        <div className="mt-5 space-y-2 font-mono text-xs sm:text-sm">
          {t.bootLines.map((line, idx) => (
            <div
              key={idx}
              className={`transition-opacity duration-300 ${
                step > idx ? 'opacity-100' : 'opacity-0 hidden'
              } text-[#8A9993]`}
            >
              <span className="text-[#75FFAE] mr-2">&gt;</span>
              {line}
            </div>
          ))}

          {step >= 5 && (
            <div className="mt-4 rounded-xl border border-[#FF626C]/45 bg-[#FF626C]/10 p-4 text-[#F2F5F3]">
              <div className="font-mono text-sm font-bold tracking-wide text-[#FF626C]">
                {t.bootErrorCode}
              </div>
              <p className="mt-1.5 font-sans text-xs leading-relaxed text-[#F2F5F3]/90 sm:text-sm">
                {t.bootErrorDesc}
              </p>
              <div className="mt-3 space-y-1 border-t border-[#FF626C]/25 pt-2.5 font-mono text-xs text-[#8A9993]">
                <div>{t.operatorStatus}</div>
                <div>{t.accessLevel}</div>
                <div className="text-[#5AD9F5]">{t.missionLine}</div>
              </div>
            </div>
          )}
        </div>

        {/* Title & Nickname Launch Form */}
        {step >= 6 && (
          <div className="mt-7 border-t border-[#1A252A] pt-6">
            <div className="text-center sm:text-left">
              <h1 className="animate-subtle-glitch font-display text-4xl font-bold tracking-tight text-[#F2F5F3] sm:text-5xl">
                EXAM<span className="text-[#75FFAE]">.exe</span>
                <span className="animate-cursor-blink ml-1 inline-block h-8 w-3 bg-[#5AD9F5] align-middle sm:h-9" />
              </h1>
              <p className="mt-2 font-mono text-xs tracking-wider text-[#5AD9F5] sm:text-sm">
                {t.tagline}
              </p>
            </div>

            <form onSubmit={handleSubmit} className="mt-6 space-y-4">
              <div>
                <label
                  htmlFor="operator-nickname"
                  className="block text-xs font-medium text-[#8A9993]"
                >
                  {t.nicknameLabel}
                </label>
                <input
                  id="operator-nickname"
                  type="text"
                  maxLength={24}
                  value={nickname}
                  onChange={(e) => {
                    setNickname(e.target.value);
                    if (errorMsg) setErrorMsg('');
                  }}
                  placeholder={t.nicknamePlaceholder}
                  className="mt-1.5 min-h-[48px] w-full rounded-xl border border-[#24343B] bg-[#11181B] px-4 py-3 font-mono text-sm text-[#F2F5F3] placeholder-[#8A9993]/60 outline-none transition focus:border-[#75FFAE] focus:ring-2 focus:ring-[#75FFAE]/25"
                />
                {errorMsg && (
                  <p className="mt-1.5 text-xs font-medium text-[#FF626C]">
                    {errorMsg}
                  </p>
                )}
              </div>

              <button
                type="submit"
                className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#75FFAE] px-6 py-3 font-display text-sm font-bold tracking-wide text-[#080B0D] shadow-[0_0_24px_rgba(117,255,174,0.28)] transition hover:bg-[#8BFFBA] active:scale-[0.99]"
              >
                <span>{hasBootedBefore && initialNickname ? t.continueBtn : t.startBtn}</span>
                <ChevronRight className="h-4 w-4" />
              </button>
            </form>

            <div className="mt-5 flex flex-wrap items-center justify-center gap-2.5 border-t border-[#1A252A] pt-4 sm:justify-start">
              <PWAInstallButton lang={lang} compact />
              <ShareGameButton lang={lang} />
            </div>
          </div>
        )}
      </div>
    </div>
  );
};
