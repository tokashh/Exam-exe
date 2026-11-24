import React, { useEffect } from 'react';
import { Award, CheckCircle2, RotateCcw, Sparkles, XCircle } from 'lucide-react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { ACHIEVEMENTS, RANKS } from '../data/ranksAndAchievements';
import { UI_TEXT } from '../i18n/translations';
import { Language, ModuleId, SessionRunSummary } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface ResultsScreenProps {
  summary: SessionRunSummary;
  lang: Language;
  onReplayModule: (moduleId: ModuleId) => void;
  onGoDashboard: () => void;
  onGoMissions: () => void;
}

export const ResultsScreen: React.FC<ResultsScreenProps> = ({
  summary,
  lang,
  onReplayModule,
  onGoDashboard,
  onGoMissions,
}) => {
  const t = UI_TEXT[lang].results;
  const rankedUp = summary.previousRankId !== summary.newRankId;
  const newRankObj = RANKS.find((r) => r.id === summary.newRankId);

  useEffect(() => {
    soundEngine.setEnvironment(summary.accuracy >= 50 ? 'victory' : 'failure');
    if (rankedUp) {
      soundEngine.playSfx('rankUp');
    } else if (summary.accuracy >= 50) {
      soundEngine.playSfx('victory');
    }
  }, [rankedUp, summary.accuracy]);

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      {/* Main Result Banner */}
      <section className="rounded-2xl border border-[#75FFAE]/40 bg-[#11181B]/95 p-6 text-center sm:p-8">
        <div className="font-mono text-xs uppercase tracking-widest text-[#75FFAE]">
          {summary.mode === 'daily' ? t.dailyComplete : t.missionComplete}
        </div>
        <h1 className="mt-2 font-display text-3xl font-bold text-[#F2F5F3] sm:text-4xl">
          <AnimatedNumber value={summary.accuracy} suffix="%" />
        </h1>
        <div className="mt-1 text-xs text-[#8A9993]">{t.accuracy}</div>

        <div className="mt-6 grid grid-cols-2 gap-4 border-t border-[#1D2A30] pt-5">
          <div>
            <div className="text-xs text-[#8A9993]">{t.xpGained}</div>
            <div className="mt-1 font-mono text-2xl font-bold text-[#75FFAE]">
              +<AnimatedNumber value={summary.xpEarned} /> XP
            </div>
          </div>
          <div>
            <div className="text-xs text-[#8A9993]">{t.correctAnswers}</div>
            <div className="mt-1 font-mono text-2xl font-bold text-[#5AD9F5] tabular-nums">
              {summary.correctCount} / {summary.totalQuestions}
            </div>
          </div>
        </div>

        {rankedUp && newRankObj && (
          <div className="mt-5 rounded-xl border border-[#5AD9F5]/45 bg-[#5AD9F5]/12 p-4">
            <div className="flex items-center justify-center gap-2 font-mono text-xs font-bold text-[#5AD9F5]">
              <Sparkles className="h-4 w-4" />
              <span>{t.rankUp}</span>
            </div>
            <div className="mt-1 font-display text-xl font-bold text-[#F2F5F3]">
              {newRankObj.title[lang]}
            </div>
          </div>
        )}

        {summary.newlyUnlockedAchievements.length > 0 && (
          <div className="mt-4 rounded-xl border border-[#75FFAE]/40 bg-[#75FFAE]/10 p-4 text-left">
            <div className="flex items-center gap-2 font-mono text-xs font-semibold text-[#75FFAE]">
              <Award className="h-4 w-4" />
              <span>{t.newAchievements}</span>
            </div>
            <div className="mt-2 space-y-1.5">
              {summary.newlyUnlockedAchievements.map((id) => {
                const a = ACHIEVEMENTS.find((x) => x.id === id);
                if (!a) return null;
                return (
                  <div key={id} className="flex items-center justify-between text-xs">
                    <span className="font-semibold text-[#F2F5F3]">{a.title[lang]}</span>
                    <span className="font-mono text-[#75FFAE]">+{a.xpBonus} XP</span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:justify-center">
          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              onGoDashboard();
            }}
            className="min-h-[48px] rounded-xl bg-[#75FFAE] px-6 py-3 text-sm font-bold text-[#080B0D] transition hover:bg-[#8BFFBA]"
          >
            {t.backDashboard}
          </button>
          {summary.moduleId && (
            <button
              type="button"
              onClick={() => {
                soundEngine.playSfx('click');
                onReplayModule(summary.moduleId!);
              }}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#24343B] bg-[#0B1013] px-5 py-3 text-sm font-medium text-[#F2F5F3] hover:border-[#5AD9F5]/50"
            >
              <RotateCcw className="h-4 w-4" />
              <span>{t.replay}</span>
            </button>
          )}
          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              onGoMissions();
            }}
            className="min-h-[48px] rounded-xl border border-[#24343B] bg-[#0B1013] px-5 py-3 text-sm font-medium text-[#8A9993] hover:text-[#F2F5F3]"
          >
            {t.nextMissions}
          </button>
        </div>
      </section>

      {/* Answer Review List */}
      <section className="rounded-2xl border border-[#1E2C30] bg-[#11181B]/90 p-5 sm:p-6">
        <h2 className="font-display text-lg font-semibold text-[#F2F5F3]">
          {t.reviewTitle}
        </h2>
        <div className="mt-4 space-y-3">
          {summary.reviewedAnswers.map((item, idx) => (
            <div
              key={idx}
              className="rounded-xl border border-[#1D2A30] bg-[#0B1013] p-4 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-3">
                <div className="text-sm font-semibold text-[#F2F5F3]">
                  {idx + 1}. {item.question.title[lang]}
                </div>
                {item.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#75FFAE]" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-[#FF626C]" />
                )}
              </div>
              <div className="text-xs text-[#5AD9F5] font-mono">
                {item.question.solutionDisplay[lang]}
              </div>
              <p className="text-xs leading-relaxed text-[#8A9993]">
                {item.question.explanation[lang]}
              </p>
            </div>
          ))}
        </div>
      </section>
    </div>
  );
};
