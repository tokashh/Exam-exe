import React from 'react';
import { AlertCircle, ArrowRight, CheckCircle2 } from 'lucide-react';
import { MODULES } from '../data/ranksAndAchievements';
import { UI_TEXT } from '../i18n/translations';
import { Language, PlayerProgress, Question } from '../types/game';
import { computePerformanceAnalysis } from '../utils/storage';
import { soundEngine } from '../audio/soundEngine';

interface PerformanceScreenProps {
  progress: PlayerProgress;
  lang: Language;
  onPracticeQuestion: (question: Question) => void;
}

export const PerformanceScreen: React.FC<PerformanceScreenProps> = ({
  progress,
  lang,
  onPracticeQuestion,
}) => {
  const t = UI_TEXT[lang].analytics;
  const analysis = computePerformanceAnalysis(progress);

  return (
    <div className="space-y-6">
      <div>
        <h1 className="font-display text-2xl font-bold text-[#F2F5F3] sm:text-3xl">
          {t.title}
        </h1>
        <p className="mt-1 text-sm text-[#8A9993]">{t.subtitle}</p>
      </div>

      {/* Real Overall Summary */}
      <section className="grid grid-cols-1 gap-4 sm:grid-cols-3">
        <div className="rounded-xl border border-[#1E2C30] bg-[#11181B]/90 p-5">
          <div className="text-xs text-[#8A9993]">{t.overallAccuracy}</div>
          <div className="mt-1 font-mono text-3xl font-bold text-[#75FFAE] tabular-nums">
            {analysis.overallAccuracy}%
          </div>
        </div>
        <div className="rounded-xl border border-[#1E2C30] bg-[#11181B]/90 p-5">
          <div className="text-xs text-[#8A9993]">{t.totalAttempts}</div>
          <div className="mt-1 font-mono text-3xl font-bold text-[#5AD9F5] tabular-nums">
            {analysis.totalAttempts}
          </div>
        </div>
        <div className="rounded-xl border border-[#1E2C30] bg-[#11181B]/90 p-5">
          <div className="text-xs text-[#8A9993]">{t.errorsCount}</div>
          <div className="mt-1 font-mono text-3xl font-bold text-[#FF626C] tabular-nums">
            {analysis.totalErrors}
          </div>
        </div>
      </section>

      {analysis.totalAttempts === 0 ? (
        <div className="rounded-2xl border border-[#1E2C30] bg-[#11181B]/90 p-6 text-sm text-[#8A9993]">
          {t.noData}
        </div>
      ) : (
        <>
          {/* Per-Module Breakdown */}
          <section className="space-y-3">
            <h2 className="font-display text-lg font-semibold text-[#F2F5F3]">
              {t.moduleBreakdown}
            </h2>
            <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
              {analysis.moduleStats.map((stat) => {
                const mod = MODULES.find((m) => m.id === stat.moduleId)!;
                return (
                  <div
                    key={stat.moduleId}
                    className="rounded-xl border border-[#1E2C30] bg-[#11181B]/90 p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <div className="font-mono text-xs text-[#5AD9F5]">
                          МОДУЛЬ {mod.code}
                        </div>
                        <div className="font-display text-base font-bold text-[#F2F5F3]">
                          {mod.title[lang]} — {mod.subtitle[lang]}
                        </div>
                      </div>
                      <span className="font-mono text-lg font-bold text-[#75FFAE] tabular-nums">
                        {stat.attempts > 0 ? `${stat.accuracy}%` : '—'}
                      </span>
                    </div>

                    <div className="flex flex-wrap gap-3 text-xs font-mono text-[#8A9993] tabular-nums">
                      <span>
                        {UI_TEXT[lang].missions.exercisesCount}: {stat.completedCount}/{stat.totalCount}
                      </span>
                      <span>·</span>
                      <span className="text-[#75FFAE]">✓ {stat.correct}</span>
                      <span>·</span>
                      <span className="text-[#FF626C]">✕ {stat.incorrect}</span>
                    </div>

                    <div className="border-t border-[#1A252A] pt-2.5">
                      <div className="text-xs font-medium text-[#8A9993]">
                        {t.weakTopics}:
                      </div>
                      {stat.weakTopics.length === 0 ? (
                        <div className="mt-1 flex items-center gap-1.5 text-xs text-[#75FFAE]">
                          <CheckCircle2 className="h-3.5 w-3.5" />
                          <span>{t.noWeakTopics}</span>
                        </div>
                      ) : (
                        <ul className="mt-1 space-y-1">
                          {stat.weakTopics.map((wt, i) => (
                            <li
                              key={i}
                              className="flex items-center justify-between text-xs text-[#FF626C]"
                            >
                              <span className="flex items-center gap-1.5">
                                <AlertCircle className="h-3.5 w-3.5 shrink-0" />
                                <span>{lang === 'ru' ? wt.ru : wt.kk}</span>
                              </span>
                              <span className="font-mono tabular-nums">
                                {wt.errors} {lang === 'kk' ? 'қате' : 'ош.'}
                              </span>
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </section>

          {/* Recommended Exercises */}
          {analysis.topRecommended.length > 0 && (
            <section className="space-y-3">
              <h2 className="font-display text-lg font-semibold text-[#F2F5F3]">
                {t.recommended}
              </h2>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {analysis.topRecommended.map((q) => (
                  <button
                    key={q.id}
                    type="button"
                    onClick={() => {
                      soundEngine.playSfx('click');
                      onPracticeQuestion(q);
                    }}
                    className="flex flex-col justify-between rounded-xl border border-[#1E2C30] bg-[#11181B]/90 p-4 text-left transition hover:border-[#5AD9F5]/55"
                  >
                    <div>
                      <div className="font-mono text-[11px] text-[#5AD9F5]">
                        {q.topicTag[lang]}
                      </div>
                      <div className="mt-1 font-display text-sm font-semibold text-[#F2F5F3]">
                        {q.title[lang]}
                      </div>
                    </div>
                    <div className="mt-3 flex items-center justify-between text-xs font-semibold text-[#75FFAE]">
                      <span>{t.practiceBtn}</span>
                      <ArrowRight className="h-3.5 w-3.5" />
                    </div>
                  </button>
                ))}
              </div>
            </section>
          )}
        </>
      )}
    </div>
  );
};
