import React from 'react';
import { Award, X } from 'lucide-react';
import { ACHIEVEMENTS } from '../data/ranksAndAchievements';
import { AchievementId, Language } from '../types/game';

interface AchievementToastProps {
  achievementId: AchievementId | null;
  lang: Language;
  onClose: () => void;
}

export const AchievementToast: React.FC<AchievementToastProps> = ({
  achievementId,
  lang,
  onClose,
}) => {
  if (!achievementId) return null;
  const def = ACHIEVEMENTS.find((a) => a.id === achievementId);
  if (!def) return null;

  return (
    <div
      role="status"
      aria-live="polite"
      className="fixed top-16 right-4 z-50 flex w-[calc(100%-2rem)] max-w-sm items-start gap-3 rounded-xl border border-[#75FFAE]/45 bg-[#11181B]/95 p-4 shadow-2xl backdrop-blur-md transition-transform"
    >
      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-[#75FFAE]/15 text-[#75FFAE]">
        <Award className="h-5 w-5" />
      </div>
      <div className="min-w-0 flex-1">
        <div className="text-[11px] font-mono uppercase tracking-wider text-[#75FFAE]">
          {lang === 'ru' ? 'Достижение разблокировано' : 'Жетістік ашылды'} · +{def.xpBonus} XP
        </div>
        <div className="mt-0.5 font-display text-sm font-semibold text-[#F2F5F3]">
          {def.title[lang]}
        </div>
        <div className="mt-0.5 text-xs text-[#8A9993]">
          {def.description[lang]}
        </div>
      </div>
      <button
        type="button"
        onClick={onClose}
        aria-label="Dismiss"
        className="flex h-8 w-8 shrink-0 items-center justify-center rounded-md text-[#8A9993] hover:bg-[#1A252A] hover:text-[#F2F5F3]"
      >
        <X className="h-4 w-4" />
      </button>
    </div>
  );
};
