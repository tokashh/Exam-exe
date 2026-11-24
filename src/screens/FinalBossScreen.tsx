import React, { useEffect, useState } from 'react';
import {
  CheckCircle2,
  Clock,
  Lock,
  RotateCcw,
  ShieldAlert,
  XCircle,
} from 'lucide-react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { CyberIllustration } from '../components/CyberIllustration';
import {
  createInitialInputState,
  QuestionInputState,
  QuestionWidget,
} from '../components/QuestionWidget';
import { buildFinalBossDeck } from '../data/finalBossPool';
import { getRankForXp, MODULES } from '../data/ranksAndAchievements';
import { UI_TEXT } from '../i18n/translations';
import {
  Language,
  ModuleId,
  PlayerProgress,
  Question,
  SimulationResult,
} from '../types/game';
import { validateQuestionSubmission } from '../utils/validation';
import { soundEngine } from '../audio/soundEngine';

interface FinalBossScreenProps {
  progress: PlayerProgress;
  lang: Language;
  onSaveSimulationResult: (
    result: SimulationResult,
    xpAwarded: number,
    records: Array<{ question: Question; isCorrect: boolean }>
  ) => void;
  onGoMissions: () => void;
}

type BossPhase = 'locked' | 'intro' | 'exam' | 'results';

function isAnswerFilled(q: Question, st: QuestionInputState): boolean {
  if (q.format === 'MATCHING' && q.pairs) {
    return Object.keys(st.matchingSelections).length === q.pairs.length;
  }
  if (q.format === 'ORDER_STEPS') {
    return st.orderedIds.length > 0;
  }
  if (q.format === 'DEBUG_MODE' && q.python) {
    if (q.python.mode === 'find_error_line') return st.selectedCodeLine !== null;
    if (q.python.mode === 'complete_code') return st.textInput.trim().length > 0;
    return st.selectedIndex !== null;
  }
  if (q.format === 'SQL_TERMINAL' && q.sql) {
    return st.sqlQuery.trim().length > 0 && st.sqlQuery.trim() !== q.sql.starterQuery.trim();
  }
  if (q.acceptedAnswers && q.acceptedAnswers.length > 0) {
    return st.textInput.trim().length > 0;
  }
  return st.selectedIndex !== null;
}

export const FinalBossScreen: React.FC<FinalBossScreenProps> = ({
  progress,
  lang,
  onSaveSimulationResult,
  onGoMissions,
}) => {
  const t = UI_TEXT[lang].boss;
  const allModulesDone = MODULES.every((m) =>
    progress.completedModules.includes(m.id)
  );

  const [phase, setPhase] = useState<BossPhase>(
    allModulesDone ? 'intro' : 'locked'
  );
  const [introStep, setIntroStep] = useState(0);
  const [deck, setDeck] = useState<Question[]>(() => buildFinalBossDeck());
  const [answers, setAnswers] = useState<Record<string, QuestionInputState>>({});
  const [currentIndex, setCurrentIndex] = useState(0);
  const [onlyUnanswered, setOnlyUnanswered] = useState(false);
  const [remainingSec, setRemainingSec] = useState(30 * 60);
  const [confirmSubmit, setConfirmSubmit] = useState(false);

  const [finalReview, setFinalReview] = useState<{
    sim: SimulationResult;
    xpEarned: number;
    details: Array<{ question: Question; isCorrect: boolean }>;
  } | null>(null);

  useEffect(() => {
    if (!allModulesDone) {
      setPhase('locked');
    } else if (phase === 'locked') {
      setPhase('intro');
    }
  }, [allModulesDone, phase]);

  // Cinematic warning sequence + boss audio
  useEffect(() => {
    if (phase !== 'intro') return;
    soundEngine.setEnvironment('boss');
    soundEngine.playSfx('bossAlert');
    setIntroStep(0);
    const timers = [
      window.setTimeout(() => setIntroStep(1), 450),
      window.setTimeout(() => setIntroStep(2), 950),
      window.setTimeout(() => setIntroStep(3), 1450),
      window.setTimeout(() => setIntroStep(4), 1950),
    ];
    return () => timers.forEach((id) => window.clearTimeout(id));
  }, [phase]);

  // Countdown timer during exam
  useEffect(() => {
    if (phase !== 'exam') return;
    const id = window.setInterval(() => {
      if (document.visibilityState === 'hidden') return;
      setRemainingSec((s) => {
        if (s <= 1) {
          window.clearInterval(id);
          return 0;
        }
        return s - 1;
      });
    }, 1000);
    return () => window.clearInterval(id);
  }, [phase]);

  const startFreshExam = () => {
    const newDeck = buildFinalBossDeck();
    const initMap: Record<string, QuestionInputState> = {};
    for (const q of newDeck) {
      initMap[q.id] = createInitialInputState(q);
    }
    setDeck(newDeck);
    setAnswers(initMap);
    setCurrentIndex(0);
    setOnlyUnanswered(false);
    setRemainingSec(30 * 60);
    setFinalReview(null);
    setConfirmSubmit(false);
    soundEngine.setEnvironment('boss');
    soundEngine.playSfx('execute');
    setPhase('exam');
  };

  const finalizeExam = () => {
    let score = 0;
    const details: Array<{ question: Question; isCorrect: boolean }> = [];
    const weakSet = new Set<ModuleId>();

    for (const q of deck) {
      const st = answers[q.id] ?? createInitialInputState(q);
      const outcome = validateQuestionSubmission(q, lang, {
        selectedIndex: st.selectedIndex,
        textInput: st.textInput,
        matchingSelections: st.matchingSelections,
        orderedIds: st.orderedIds,
        selectedCodeLine: st.selectedCodeLine,
        sqlQuery: st.sqlQuery,
      });
      if (outcome.isCorrect) {
        score += 1;
      } else {
        weakSet.add(q.moduleId);
      }
      details.push({ question: q, isCorrect: outcome.isCorrect });
    }

    const accuracy = Math.round((score / deck.length) * 100);
    const outcome: SimulationResult['outcome'] =
      accuracy >= 80 ? 'restored' : accuracy >= 50 ? 'partial' : 'failed';

    const sim: SimulationResult = {
      id: `sim-${Date.now()}`,
      timestamp: Date.now(),
      score,
      total: deck.length,
      accuracy,
      durationSec: 30 * 60 - remainingSec,
      outcome,
      weakModules: Array.from(weakSet),
    };

    const xpEarned = score * 20 + (outcome === 'restored' ? 150 : 0);

    soundEngine.setEnvironment(outcome === 'failed' ? 'failure' : 'victory');
    soundEngine.playSfx(outcome === 'failed' ? 'incorrect' : 'victory');

    onSaveSimulationResult(sim, xpEarned, details);
    setFinalReview({ sim, xpEarned, details });
    setConfirmSubmit(false);
    setPhase('results');
  };

  // Auto-submit if countdown hits 0
  useEffect(() => {
    if (phase === 'exam' && remainingSec === 0) {
      finalizeExam();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [phase, remainingSec]);

  if (phase === 'locked') {
    return (
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#FF626C]/40 bg-[#11181B]/95 text-center">
        <CyberIllustration
          src="/src/assets/images/boss_firewall_core_1795428069158.jpg"
          alt="Final Boss Firewall Core"
          accent="red"
          fallbackLabel="FIREWALL // LOCKED"
          className="h-40 w-full opacity-75"
          scrimClassName="bg-gradient-to-t from-[#11181B] via-[#11181B]/45 to-transparent"
        />
        <div className="p-6 sm:p-8 space-y-5">
        <div className="mx-auto flex h-14 w-14 items-center justify-center rounded-2xl bg-[#FF626C]/15 text-[#FF626C]">
          <Lock className="h-7 w-7" />
        </div>
        <h1 className="font-display text-2xl font-bold text-[#FF626C]">
          {t.lockedTitle}
        </h1>
        <p className="text-sm text-[#8A9993]">{t.lockedDesc}</p>
        <div className="grid grid-cols-2 gap-2.5 text-left sm:grid-cols-3">
          {MODULES.map((m) => {
            const ok = progress.completedModules.includes(m.id);
            return (
              <div
                key={m.id}
                className={`rounded-lg border px-3 py-2 text-xs font-mono ${
                  ok
                    ? 'border-[#75FFAE]/45 bg-[#75FFAE]/10 text-[#75FFAE]'
                    : 'border-[#24343B] bg-[#0B1013] text-[#8A9993]'
                }`}
              >
                {m.code} · {m.title[lang]}
              </div>
            );
          })}
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playSfx('click');
            onGoMissions();
          }}
          className="min-h-[48px] rounded-xl bg-[#75FFAE] px-6 py-3 text-sm font-bold text-[#080B0D] hover:bg-[#8BFFBA]"
        >
          {UI_TEXT[lang].missions.title}
        </button>
        </div>
      </div>
    );
  }

  if (phase === 'intro') {
    return (
      <div className="mx-auto max-w-2xl overflow-hidden rounded-2xl border border-[#FF626C]/60 bg-[#0A0809]/95 shadow-[0_0_40px_rgba(255,98,108,0.16)]">
        <CyberIllustration
          src="/src/assets/images/boss_firewall_core_1795428069158.jpg"
          alt="EXAM.exe Final Boss Core"
          eager
          accent="red"
          fallbackLabel="BOSS PROTOCOL // ACTIVE"
          className="h-44 w-full"
          scrimClassName="bg-gradient-to-t from-[#0A0809] via-[#0A0809]/40 to-transparent"
        />
        <div className="p-6 sm:p-8 space-y-6">
        <div className="flex items-center gap-3 text-[#FF626C]">
          <ShieldAlert className="h-7 w-7 shrink-0" />
          <span className="animate-subtle-glitch font-mono text-sm font-bold tracking-wider">
            {lang === 'kk' ? 'ХАТТАМА // ҚОРЫТЫНДЫ СЫНАҚ' : 'ПРОТОКОЛ // ФИНАЛЬНЫЙ БОСС'}
          </span>
        </div>

        <div className="space-y-2 font-mono text-xs sm:text-sm">
          {t.introLines.map((line, idx) => (
            <div
              key={idx}
              className={`transition-opacity duration-300 ${
                introStep > idx ? 'opacity-100' : 'opacity-0'
              } ${idx === 0 ? 'text-[#FF626C] font-bold' : 'text-[#F2F5F3]'}`}
            >
              &gt; {line}
            </div>
          ))}
        </div>

        {introStep >= 4 && (
          <div className="border-t border-[#FF626C]/30 pt-5 space-y-4">
            <p className="text-xs text-[#8A9993]">{t.rulesNote}</p>
            <button
              type="button"
              onClick={startFreshExam}
              className="min-h-[48px] w-full rounded-xl bg-[#FF626C] px-6 py-3 font-display text-sm font-bold text-[#080B0D] transition hover:bg-[#FF7B84]"
            >
              {t.beginSim}
            </button>
          </div>
        )}
        </div>
      </div>
    );
  }

  if (phase === 'results' && finalReview) {
    const { sim, xpEarned, details } = finalReview;
    const rank = getRankForXp(progress.xp);
    const outcomeText =
      sim.outcome === 'restored'
        ? t.outcomeRestored
        : sim.outcome === 'partial'
          ? t.outcomePartial
          : t.outcomeFailed;
    const outcomeColor =
      sim.outcome === 'restored'
        ? 'text-[#75FFAE]'
        : sim.outcome === 'partial'
          ? 'text-[#5AD9F5]'
          : 'text-[#FF626C]';

    return (
      <div className="mx-auto max-w-3xl space-y-6">
        <section className="rounded-2xl border border-[#1E2C30] bg-[#11181B]/95 p-6 sm:p-8 text-center space-y-4">
          <div className={`font-mono text-sm font-bold tracking-wider ${outcomeColor}`}>
            {outcomeText}
          </div>
          <div className="font-display text-4xl font-bold text-[#F2F5F3] sm:text-5xl">
            <AnimatedNumber value={sim.accuracy} suffix="%" />
          </div>
          <div className="flex flex-wrap justify-center gap-6 pt-2 font-mono text-sm">
            <span className="text-[#5AD9F5] tabular-nums">
              {sim.score} / {sim.total}
            </span>
            <span className="text-[#75FFAE] tabular-nums">+{xpEarned} XP</span>
            <span className="text-[#F2F5F3]">{rank.title[lang]}</span>
          </div>

          {sim.weakModules.length > 0 && (
            <div className="rounded-xl border border-[#24343B] bg-[#0B1013] p-4 text-left">
              <div className="text-xs font-semibold text-[#8A9993]">
                {t.weakModules}:
              </div>
              <div className="mt-2 flex flex-wrap gap-2 text-xs font-mono text-[#FF626C]">
                {sim.weakModules.map((mid) => {
                  const mod = MODULES.find((m) => m.id === mid);
                  return (
                    <span key={mid}>
                      {mod ? `${mod.code} ${mod.title[lang]}` : mid}
                    </span>
                  );
                })}
              </div>
            </div>
          )}

          <button
            type="button"
            onClick={startFreshExam}
            className="inline-flex min-h-[48px] items-center gap-2 rounded-xl bg-[#75FFAE] px-6 py-3 text-sm font-bold text-[#080B0D] hover:bg-[#8BFFBA]"
          >
            <RotateCcw className="h-4 w-4" />
            <span>{t.retrySim}</span>
          </button>
        </section>

        <section className="rounded-2xl border border-[#1E2C30] bg-[#11181B]/90 p-5 sm:p-6 space-y-3">
          <h2 className="font-display text-lg font-semibold text-[#F2F5F3]">
            {UI_TEXT[lang].results.reviewTitle}
          </h2>
          {details.map((d, i) => (
            <div
              key={d.question.id}
              className="rounded-xl border border-[#1D2A30] bg-[#0B1013] p-4 space-y-1.5"
            >
              <div className="flex items-start justify-between gap-2">
                <span className="text-sm font-semibold text-[#F2F5F3]">
                  {i + 1}. {d.question.title[lang]}
                </span>
                {d.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0 text-[#75FFAE]" />
                ) : (
                  <XCircle className="h-4 w-4 shrink-0 text-[#FF626C]" />
                )}
              </div>
              <div className="font-mono text-xs text-[#5AD9F5]">
                {d.question.solutionDisplay[lang]}
              </div>
              <p className="text-xs leading-relaxed text-[#8A9993]">
                {d.question.explanation[lang]}
              </p>
            </div>
          ))}
        </section>
      </div>
    );
  }

  // EXAM PHASE (20 mixed questions, NO hints)
  const currentQ = deck[currentIndex];
  const currentInput = answers[currentQ.id] ?? createInitialInputState(currentQ);
  const unansweredIndices = deck
    .map((q, idx) =>
      !isAnswerFilled(q, answers[q.id] ?? createInitialInputState(q)) ? idx : -1
    )
    .filter((i) => i !== -1);

  const visibleIndices = onlyUnanswered
    ? unansweredIndices
    : deck.map((_, i) => i);

  const mins = Math.floor(remainingSec / 60);
  const secs = remainingSec % 60;

  return (
    <div className="mx-auto max-w-4xl space-y-5">
      {/* Top Countdown & Controls */}
      <div className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-[#FF626C]/40 bg-[#11181B]/95 px-4 py-3">
        <div className="flex items-center gap-2 font-mono text-sm font-bold text-[#FF626C] tabular-nums">
          <Clock className="h-4 w-4" />
          <span>
            {String(mins).padStart(2, '0')}:{String(secs).padStart(2, '0')}
          </span>
        </div>

        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setOnlyUnanswered((v) => !v)}
            className={`min-h-[38px] rounded-lg border px-3 text-xs font-medium transition ${
              onlyUnanswered
                ? 'border-[#5AD9F5] bg-[#5AD9F5]/15 text-[#5AD9F5]'
                : 'border-[#24343B] bg-[#0B1013] text-[#8A9993]'
            }`}
          >
            {onlyUnanswered
              ? `${t.unansweredOnly} (${unansweredIndices.length})`
              : t.allQuestions}
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              setConfirmSubmit(true);
            }}
            className="min-h-[38px] rounded-lg bg-[#75FFAE] px-4 text-xs font-bold text-[#080B0D] hover:bg-[#8BFFBA]"
          >
            {t.submitSim}
          </button>
        </div>
      </div>

      {/* 1..20 Navigation Grid */}
      <div className="grid grid-cols-5 gap-1.5 sm:grid-cols-10">
        {visibleIndices.map((idx) => {
          const q = deck[idx];
          const filled = isAnswerFilled(
            q,
            answers[q.id] ?? createInitialInputState(q)
          );
          const active = idx === currentIndex;
          return (
            <button
              key={q.id}
              type="button"
              onClick={() => {
                soundEngine.playSfx('click');
                setCurrentIndex(idx);
              }}
              className={`min-h-[40px] rounded-lg border font-mono text-xs font-semibold tabular-nums transition ${
                active
                  ? 'border-[#75FFAE] bg-[#75FFAE] text-[#080B0D]'
                  : filled
                    ? 'border-[#5AD9F5]/50 bg-[#5AD9F5]/15 text-[#5AD9F5]'
                    : 'border-[#223137] bg-[#11181B] text-[#8A9993]'
              }`}
            >
              {idx + 1}
            </button>
          );
        })}
      </div>

      {/* Question Body (Strictly NO Hints) */}
      <div className="rounded-2xl border border-[#1E2C30] bg-[#11181B]/95 p-5 sm:p-6 space-y-5">
        <div>
          <div className="font-mono text-xs text-[#5AD9F5]">
            #{currentIndex + 1} / {deck.length} · {UI_TEXT[lang].formats[currentQ.format]}
          </div>
          <h2 className="mt-1.5 font-display text-xl font-bold text-[#F2F5F3]">
            {currentQ.title[lang]}
          </h2>
          <p className="mt-2 text-sm leading-relaxed text-[#F2F5F3]/95">
            {currentQ.prompt[lang]}
          </p>
        </div>

        <QuestionWidget
          question={currentQ}
          lang={lang}
          value={currentInput}
          onChange={(nextVal) =>
            setAnswers((prev) => ({ ...prev, [currentQ.id]: nextVal }))
          }
        />

        <div className="flex items-center justify-between border-t border-[#1A252A] pt-4">
          <button
            type="button"
            disabled={currentIndex === 0}
            onClick={() => setCurrentIndex((i) => Math.max(0, i - 1))}
            className="min-h-[44px] rounded-xl border border-[#24343B] bg-[#0B1013] px-4 text-xs font-medium text-[#F2F5F3] disabled:opacity-35"
          >
            ←
          </button>
          <button
            type="button"
            disabled={currentIndex === deck.length - 1}
            onClick={() =>
              setCurrentIndex((i) => Math.min(deck.length - 1, i + 1))
            }
            className="min-h-[44px] rounded-xl bg-[#5AD9F5] px-5 text-xs font-bold text-[#080B0D] disabled:opacity-35"
          >
            {UI_TEXT[lang].gameplay.nextBtn} →
          </button>
        </div>
      </div>

      {confirmSubmit && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-sm">
          <div className="w-full max-w-sm rounded-2xl border border-[#24343B] bg-[#11181B] p-6 space-y-4">
            <h3 className="font-display text-lg font-bold text-[#F2F5F3]">
              {t.confirmSubmitTitle}
            </h3>
            <p className="text-xs leading-relaxed text-[#8A9993]">
              {unansweredIndices.length > 0
                ? `${t.confirmSubmitUnanswered} ${unansweredIndices.length}`
                : t.confirmSubmitReady}
            </p>
            <div className="flex gap-2">
              <button
                type="button"
                onClick={() => setConfirmSubmit(false)}
                className="min-h-[44px] flex-1 rounded-xl border border-[#24343B] bg-[#0B1013] text-xs font-semibold text-[#F2F5F3]"
              >
                {UI_TEXT[lang].settings.cancel}
              </button>
              <button
                type="button"
                onClick={finalizeExam}
                className="min-h-[44px] flex-1 rounded-xl bg-[#75FFAE] text-xs font-bold text-[#080B0D]"
              >
                {t.submitSim}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
