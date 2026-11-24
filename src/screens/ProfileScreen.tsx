import React, { useState } from 'react';
import { Check, Shield, User } from 'lucide-react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { getRankForXp, RANKS } from '../data/ranksAndAchievements';
import { UI_TEXT } from '../i18n/translations';
import { Language, PlayerProgress } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface ProfileScreenProps {
  progress: PlayerProgress;
  lang: Language;
  onUpdateNickname: (nickname: string) => void;
}

export const ProfileScreen: React.FC<ProfileScreenProps> = ({
  progress,
  lang,
  onUpdateNickname,
}) => {
  const t = UI_TEXT[lang].profile;
  const currentRank = getRankForXp(progress.xp);
  const [nickInput, setNickInput] = useState(progress.nickname);
  const [savedNotice, setSavedNotice] = useState(false);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    const clean = nickInput.trim();
    if (!clean) return;
    soundEngine.playSfx('unlock');
    onUpdateNickname(clean);
    setSavedNotice(true);
    window.setTimeout(() => setSavedNotice(false), 1800);
  };

  return (
    <div className="space-y-6">
      <h1 className="font-display text-2xl font-bold text-[#F2F5F3] sm:text-3xl">
        {t.title}
      </h1>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
        {/* Operator Identity Card */}
        <section className="rounded-2xl border border-[#1E2C30] bg-[#11181B]/90 p-5 sm:p-6 space-y-5">
          <div className="flex items-center gap-4">
            <div className="flex h-14 w-14 items-center justify-center rounded-xl border border-[#75FFAE]/40 bg-[#75FFAE]/10 text-[#75FFAE]">
              <User className="h-7 w-7" />
            </div>
            <div>
              <div className="font-mono text-xs text-[#5AD9F5]">
                {lang === 'kk' ? 'ДЕҢГЕЙ' : 'УРОВЕНЬ'} {String(currentRank.level).padStart(2, '0')} · {currentRank.title[lang]}
              </div>
              <div className="font-display text-xl font-bold text-[#F2F5F3]">
                {progress.nickname}
              </div>
            </div>
          </div>

          <form onSubmit={handleSave} className="space-y-2.5">
            <label
              htmlFor="profile-nick"
              className="block text-xs font-medium text-[#8A9993]"
            >
              {t.editNickname}
            </label>
            <div className="flex gap-2">
              <input
                id="profile-nick"
                type="text"
                maxLength={24}
                value={nickInput}
                onChange={(e) => setNickInput(e.target.value)}
                className="min-h-[44px] flex-1 rounded-lg border border-[#24343B] bg-[#0B1013] px-3 font-mono text-sm text-[#F2F5F3] outline-none focus:border-[#75FFAE]"
              />
              <button
                type="submit"
                className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg bg-[#75FFAE] px-4 text-xs font-bold text-[#080B0D] hover:bg-[#8BFFBA]"
              >
                {savedNotice ? <Check className="h-4 w-4" /> : t.save}
              </button>
            </div>
          </form>

          <div className="grid grid-cols-2 gap-3 border-t border-[#1A252A] pt-4">
            <div>
              <div className="text-xs text-[#8A9993]">XP</div>
              <div className="font-mono text-lg font-bold text-[#75FFAE]">
                <AnimatedNumber value={progress.xp} />
              </div>
            </div>
            <div>
              <div className="text-xs text-[#8A9993]">{t.totalSolved}</div>
              <div className="font-mono text-lg font-bold text-[#5AD9F5] tabular-nums">
                {progress.completedQuestionIds.length}
              </div>
            </div>
          </div>
        </section>

        {/* Rank Ladder */}
        <section className="rounded-2xl border border-[#1E2C30] bg-[#11181B]/90 p-5 sm:p-6 lg:col-span-2">
          <h2 className="font-display text-lg font-semibold text-[#F2F5F3]">
            {t.rankLadder}
          </h2>
          <div className="mt-4 space-y-2.5">
            {RANKS.map((r) => {
              const unlocked = progress.xp >= r.minXp;
              const isCurrent = r.id === currentRank.id;
              return (
                <div
                  key={r.id}
                  className={`flex items-center justify-between rounded-xl border px-4 py-3 ${
                    isCurrent
                      ? 'border-[#75FFAE]/60 bg-[#75FFAE]/10'
                      : unlocked
                        ? 'border-[#223239] bg-[#0B1013]'
                        : 'border-[#1A2328] bg-[#080B0D]/60 opacity-60'
                  }`}
                >
                  <div className="flex items-center gap-3">
                    <Shield
                      className={`h-4 w-4 ${
                        unlocked ? 'text-[#75FFAE]' : 'text-[#8A9993]'
                      }`}
                    />
                    <div>
                      <div className="font-display text-sm font-bold text-[#F2F5F3]">
                        {r.title[lang]}
                      </div>
                      <div className="font-mono text-[11px] text-[#8A9993]">
                        {lang === 'kk' ? 'ДЕҢГЕЙ' : 'УРОВЕНЬ'} {String(r.level).padStart(2, '0')}
                      </div>
                    </div>
                  </div>
                  <div className="font-mono text-xs text-[#5AD9F5] tabular-nums">
                    {r.minXp.toLocaleString()} XP
                  </div>
                </div>
              );
            })}
          </div>
        </section>
      </div>

      {/* UNT Simulation History */}
      <section className="rounded-2xl border border-[#1E2C30] bg-[#11181B]/90 p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-[#F2F5F3]">
          {t.simHistory}
        </h2>
        {progress.simulationResults.length === 0 ? (
          <p className="mt-3 text-sm text-[#8A9993]">{t.noSims}</p>
        ) : (
          <div className="mt-4 space-y-2.5">
            {[...progress.simulationResults].reverse().map((sim) => (
              <div
                key={sim.id}
                className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#1E2C30] bg-[#0B1013] px-4 py-3 text-xs font-mono"
              >
                <span className="text-[#8A9993]">
                  {new Date(sim.timestamp).toLocaleDateString()}
                </span>
                <span className="text-[#F2F5F3] tabular-nums">
                  {sim.score}/{sim.total} ({sim.accuracy}%)
                </span>
                <span
                  className={
                    sim.outcome === 'restored'
                      ? 'text-[#75FFAE]'
                      : sim.outcome === 'partial'
                        ? 'text-[#5AD9F5]'
                        : 'text-[#FF626C]'
                  }
                >
                  {sim.outcome === 'restored'
                    ? UI_TEXT[lang].boss.outcomeRestored
                    : sim.outcome === 'partial'
                      ? UI_TEXT[lang].boss.outcomePartial
                      : UI_TEXT[lang].boss.outcomeFailed}
                </span>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
};
