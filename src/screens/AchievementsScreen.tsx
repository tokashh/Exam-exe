import React from 'react';
import { Award, Lock } from 'lucide-react';
import { ACHIEVEMENTS } from '../data/ranksAndAchievements';
import { UI_TEXT } from '../i18n/translations';
import { Language, PlayerProgress } from '../types/game';

interface AchievementsScreenProps {
  progress: PlayerProgress;
  lang: Language;
}

export const AchievementsScreen: React.FC<AchievementsScreenProps> = ({
  progress,
  lang,
}) => {
  const t = UI_TEXT[lang].achievements;
  const unlockedCount = progress.unlockedAchievements.length;

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-2 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#F2F5F3] sm:text-3xl">
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-[#8A9993]">{t.subtitle}</p>
        </div>
        <div className="font-mono text-sm font-bold text-[#75FFAE] tabular-nums">
          {unlockedCount} / {ACHIEVEMENTS.length}
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
        {ACHIEVEMENTS.map((ach) => {
          const isUnlocked = progress.unlockedAchievements.includes(ach.id);
          return (
            <div
              key={ach.id}
              className={`flex flex-col justify-between rounded-xl border p-5 transition ${
                isUnlocked
                  ? 'border-[#75FFAE]/45 bg-[#11181B]/95'
                  : 'border-[#1B2529] bg-[#0B1013]/75 opacity-75'
              }`}
            >
              <div>
                <div className="flex items-center justify-between">
                  <div
                    className={`flex h-10 w-10 items-center justify-center rounded-lg ${
                      isUnlocked
                        ? 'bg-[#75FFAE]/15 text-[#75FFAE]'
                        : 'bg-[#162024] text-[#8A9993]'
                    }`}
                  >
                    {isUnlocked ? (
                      <Award className="h-5 w-5" />
                    ) : (
                      <Lock className="h-4 w-4" />
                    )}
                  </div>
                  <span className="font-mono text-xs text-[#5AD9F5] tabular-nums">
                    {t.bonus}: +{ach.xpBonus} XP
                  </span>
                </div>

                <h2 className="mt-3 font-display text-base font-bold text-[#F2F5F3]">
                  {ach.title[lang]}
                </h2>
                <p className="mt-1 text-xs leading-relaxed text-[#8A9993]">
                  {ach.description[lang]}
                </p>
              </div>

              <div className="mt-4 pt-3 border-t border-[#1A2428] font-mono text-[11px]">
                <span className={isUnlocked ? 'text-[#75FFAE]' : 'text-[#8A9993]'}>
                  {isUnlocked ? t.unlocked : t.locked}
                </span>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
