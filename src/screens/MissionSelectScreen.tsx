import React, { useState } from 'react';
import { CheckCircle2, ChevronDown, ChevronUp, Code2, Database, Play, Terminal } from 'lucide-react';
import { CyberIllustration } from '../components/CyberIllustration';
import { getModuleQuestions } from '../data/finalBossPool';
import { MODULES } from '../data/ranksAndAchievements';
import { UI_TEXT } from '../i18n/translations';
import {
  Language,
  ModuleId,
  PlayerProgress,
  Question,
  ScreenId,
} from '../types/game';
import { soundEngine } from '../audio/soundEngine';

interface MissionSelectScreenProps {
  progress: PlayerProgress;
  lang: Language;
  onStartModule: (moduleId: ModuleId) => void;
  onStartSingleQuestion: (question: Question) => void;
  onNavigate: (screen: ScreenId) => void;
}

export const MissionSelectScreen: React.FC<MissionSelectScreenProps> = ({
  progress,
  lang,
  onStartModule,
  onStartSingleQuestion,
  onNavigate,
}) => {
  const t = UI_TEXT[lang].missions;
  const [expandedModule, setExpandedModule] = useState<ModuleId | null>('binary-core');

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#F2F5F3] sm:text-3xl">
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-[#8A9993]">{t.subtitle}</p>
        </div>
        <div className="flex flex-wrap gap-2">
          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              onNavigate('python-lab');
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#5AD9F5]/40 bg-[#5AD9F5]/10 px-3.5 py-2 text-xs font-semibold text-[#5AD9F5] hover:bg-[#5AD9F5]/20"
          >
            <Code2 className="h-4 w-4" />
            <span>{t.openPythonLab}</span>
          </button>
          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              onNavigate('sql-terminal');
            }}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-lg border border-[#75FFAE]/40 bg-[#75FFAE]/10 px-3.5 py-2 text-xs font-semibold text-[#75FFAE] hover:bg-[#75FFAE]/20"
          >
            <Database className="h-4 w-4" />
            <span>{t.openSqlTerminal}</span>
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {MODULES.map((mod) => {
          const questions = getModuleQuestions(mod.id);
          const doneCount = questions.filter((q) =>
            progress.completedQuestionIds.includes(q.id)
          ).length;
          const isCompleted = progress.completedModules.includes(mod.id);
          const isExpanded = expandedModule === mod.id;

          const modImg =
            mod.order <= 3
              ? '/src/assets/images/module_binary_logic_1795428069389.jpg'
              : '/src/assets/images/module_code_matrix_1795428069019.jpg';

          return (
            <div
              key={mod.id}
              className="rounded-xl border border-[#1E2C30] bg-[#11181B]/90 overflow-hidden"
            >
              <div className="flex flex-col gap-4 p-5 sm:flex-row sm:items-center sm:justify-between">
                <div className="flex flex-col gap-4 sm:flex-row sm:items-center">
                  <CyberIllustration
                    src={modImg}
                    alt={mod.title[lang]}
                    accent={mod.accentColor}
                    fallbackLabel={`MOD ${mod.code}`}
                    className="h-24 w-full shrink-0 rounded-lg border border-[#1E2C30] sm:h-20 sm:w-28"
                    scrimClassName="bg-gradient-to-t from-[#11181B]/70 via-transparent to-transparent"
                  />
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2 text-xs font-mono">
                      <span
                        className={
                          mod.accentColor === 'green' ? 'text-[#75FFAE]' : 'text-[#5AD9F5]'
                        }
                      >
                        МОДУЛЬ {mod.code}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className="text-[#8A9993] tabular-nums">
                        {doneCount}/{questions.length} {t.exercisesCount}
                      </span>
                      <span aria-hidden="true">·</span>
                      <span className={isCompleted ? 'text-[#75FFAE]' : 'text-[#8A9993]'}>
                        {isCompleted ? t.completed : doneCount > 0 ? t.inProgress : t.offline}
                      </span>
                    </div>
                    <h2 className="font-display text-xl font-bold text-[#F2F5F3]">
                      {mod.title[lang]} — {mod.subtitle[lang]}
                    </h2>
                    <p className="text-xs leading-relaxed text-[#8A9993] max-w-2xl">
                      {mod.description[lang]}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSfx('click');
                      onStartModule(mod.id);
                    }}
                    className="inline-flex min-h-[44px] items-center gap-2 rounded-lg bg-[#75FFAE] px-4 py-2 text-xs font-bold text-[#080B0D] transition hover:bg-[#8BFFBA]"
                  >
                    <Play className="h-3.5 w-3.5 fill-current" />
                    <span>{isCompleted ? t.replayModule : t.launchModule}</span>
                  </button>
                  <button
                    type="button"
                    onClick={() => {
                      soundEngine.playSfx('click');
                      setExpandedModule(isExpanded ? null : mod.id);
                    }}
                    aria-expanded={isExpanded}
                    className="flex h-11 w-11 items-center justify-center rounded-lg border border-[#24343B] bg-[#0B1013] text-[#8A9993] hover:text-[#F2F5F3]"
                  >
                    {isExpanded ? (
                      <ChevronUp className="h-4 w-4" />
                    ) : (
                      <ChevronDown className="h-4 w-4" />
                    )}
                  </button>
                </div>
              </div>

              {isExpanded && (
                <div className="border-t border-[#1B272C] bg-[#0B1013]/80 p-4 sm:p-5">
                  <div className="mb-3 text-xs font-medium text-[#8A9993]">
                    {t.selectExercise}
                  </div>
                  <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
                    {questions.map((q) => {
                      const solved = progress.completedQuestionIds.includes(q.id);
                      return (
                        <button
                          key={q.id}
                          type="button"
                          onClick={() => {
                            soundEngine.playSfx('click');
                            onStartSingleQuestion(q);
                          }}
                          className="flex min-h-[56px] items-center justify-between gap-3 rounded-lg border border-[#1E2C30] bg-[#11181B] px-3.5 py-2.5 text-left transition hover:border-[#5AD9F5]/50"
                        >
                          <div className="min-w-0">
                            <div className="flex items-center gap-2 text-[11px] font-mono text-[#8A9993]">
                              <span className="tabular-nums">#{q.order}</span>
                              <span>·</span>
                              <span className="text-[#5AD9F5]">
                                {UI_TEXT[lang].formats[q.format]}
                              </span>
                              {q.isBossChallenge && (
                                <>
                                  <span>·</span>
                                  <span className="text-[#FF626C]">
                                    {lang === 'kk' ? 'ФИНАЛ' : 'БОСС'}
                                  </span>
                                </>
                              )}
                            </div>
                            <div className="mt-0.5 truncate text-sm font-medium text-[#F2F5F3]">
                              {q.title[lang]}
                            </div>
                          </div>
                          <div className="flex items-center gap-2 shrink-0">
                            <span className="font-mono text-xs text-[#75FFAE] tabular-nums">
                              +{q.xpReward}
                            </span>
                            {solved ? (
                              <CheckCircle2 className="h-4 w-4 text-[#75FFAE]" />
                            ) : (
                              <Terminal className="h-4 w-4 text-[#8A9993]" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
};
