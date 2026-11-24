import React, { useEffect, useRef, useState } from 'react';
import {
  AlertTriangle,
  ArrowLeft,
  CheckCircle2,
  ChevronRight,
  Clock,
  HelpCircle,
  Scissors,
  Shield,
  Zap,
} from 'lucide-react';
import {
  createInitialInputState,
  QuestionInputState,
  QuestionWidget,
} from '../components/QuestionWidget';
import { MODULES } from '../data/ranksAndAchievements';
import { UI_TEXT } from '../i18n/translations';
import {
  BoosterId,
  BoosterInventory,
  Language,
  ModuleId,
  Question,
} from '../types/game';
import { validateQuestionSubmission } from '../utils/validation';
import { PythonInteractiveRunner } from './PythonLabScreen';
import { SqlInteractiveRunner } from './SqlTerminalScreen';
import { soundEngine } from '../audio/soundEngine';

export interface GameplaySessionConfig {
  mode: 'module' | 'single' | 'daily';
  moduleId?: ModuleId;
  questions: Question[];
}

interface GameplayScreenProps {
  session: GameplaySessionConfig;
  lang: Language;
  boosters: BoosterInventory;
  onConsumeBooster: (id: BoosterId) => boolean;
  onExit: () => void;
  onAnswerRecorded: (
    question: Question,
    isCorrect: boolean,
    isDaily: boolean,
    xpMultiplier?: number
  ) => number;
  onFinishSession: (
    reviewed: Array<{ question: Question; isCorrect: boolean; userSummary: string }>,
    totalXpEarned: number
  ) => void;
}

function maskHalfAnswer(answer: string): string {
  const trimmed = answer.trim();
  if (trimmed.length <= 1) return `• (${trimmed.length})`;
  const revealCount = Math.max(1, Math.floor(trimmed.length / 2));
  return trimmed
    .split('')
    .map((ch, idx) => (idx < revealCount || ch === ' ' ? ch : '•'))
    .join('');
}

export const GameplayScreen: React.FC<GameplayScreenProps> = ({
  session,
  lang,
  boosters,
  onConsumeBooster,
  onExit,
  onAnswerRecorded,
  onFinishSession,
}) => {
  const t = UI_TEXT[lang].gameplay;
  const bT = UI_TEXT[lang].boosters;
  const [index, setIndex] = useState(0);
  const currentQ = session.questions[index];

  const [inputState, setInputState] = useState<QuestionInputState>(() =>
    createInitialInputState(currentQ)
  );
  const [showHint, setShowHint] = useState(false);
  const [feedback, setFeedback] = useState<{
    isCorrect: boolean;
    xpAwarded: number;
    userSummary: string;
    boosted2x?: boolean;
  } | null>(null);
  const [elapsedSec, setElapsedSec] = useState(0);
  const [sessionXp, setSessionXp] = useState(0);
  const [reviewed, setReviewed] = useState<
    Array<{ question: Question; isCorrect: boolean; userSummary: string }>
  >([]);

  // Booster states for current question
  const [doubleXpMsLeft, setDoubleXpMsLeft] = useState<number | null>(null);
  const doubleXpDeadlineRef = useRef<number | null>(null);
  const [secondChanceArmed, setSecondChanceArmed] = useState(false);
  const [secondChanceSavedMsg, setSecondChanceSavedMsg] = useState(false);
  const [fiftyUsed, setFiftyUsed] = useState(false);
  const [eliminatedOptionIndices, setEliminatedOptionIndices] = useState<number[]>([]);
  const [eliminatedCodeLines, setEliminatedCodeLines] = useState<number[]>([]);
  const [lockedMatchingPairIds, setLockedMatchingPairIds] = useState<string[]>([]);
  const [fiftyClueText, setFiftyClueText] = useState<string | null>(null);

  // Sync audio environment to question type
  useEffect(() => {
    if (!currentQ) return;
    if (currentQ.format === 'DEBUG_MODE') {
      soundEngine.setEnvironment('python');
    } else if (currentQ.format === 'SQL_TERMINAL') {
      soundEngine.setEnvironment('sql');
    } else {
      soundEngine.setEnvironment('gameplay');
    }
  }, [currentQ]);

  // Reset per-question states
  useEffect(() => {
    setInputState(createInitialInputState(currentQ));
    setShowHint(false);
    setFeedback(null);
    setElapsedSec(0);
    setDoubleXpMsLeft(null);
    doubleXpDeadlineRef.current = null;
    setSecondChanceArmed(false);
    setSecondChanceSavedMsg(false);
    setFiftyUsed(false);
    setEliminatedOptionIndices([]);
    setEliminatedCodeLines([]);
    setLockedMatchingPairIds([]);
    setFiftyClueText(null);
  }, [currentQ]);

  // Question elapsed seconds counter
  useEffect(() => {
    if (feedback) return;
    const id = window.setInterval(() => {
      if (document.visibilityState !== 'hidden') {
        setElapsedSec((s) => s + 1);
      }
    }, 1000);
    return () => window.clearInterval(id);
  }, [feedback, index]);

  // 10-second 2x XP countdown timer
  useEffect(() => {
    if (feedback || doubleXpMsLeft === null || doubleXpMsLeft <= 0) return;
    const id = window.setInterval(() => {
      const deadline = doubleXpDeadlineRef.current;
      if (!deadline) return;
      const left = Math.max(0, deadline - Date.now());
      setDoubleXpMsLeft(left);
      if (left <= 0) {
        window.clearInterval(id);
      }
    }, 80);
    return () => window.clearInterval(id);
  }, [feedback, doubleXpMsLeft]);

  if (!currentQ) return null;

  const modDef = MODULES.find((m) => m.id === currentQ.moduleId);
  const progressPct = Math.round(((index + (feedback ? 1 : 0)) / session.questions.length) * 100);

  const isTerminalHandled =
    (currentQ.format === 'DEBUG_MODE' && Boolean(currentQ.python)) ||
    (currentQ.format === 'SQL_TERMINAL' && Boolean(currentQ.sql));

  const isDoubleXpActive = doubleXpMsLeft !== null && doubleXpMsLeft > 0;
  const isDoubleXpExpired = doubleXpMsLeft === 0;

  const recordOutcome = (isCorrect: boolean, userSummary: string) => {
    if (feedback) return;
    const xpMult = isCorrect && isDoubleXpActive ? 2 : 1;
    const xpAwarded = onAnswerRecorded(currentQ, isCorrect, session.mode === 'daily', xpMult);
    if (xpAwarded > 0) {
      soundEngine.playSfx('xp');
    }
    setSessionXp((prev) => prev + xpAwarded);
    setFeedback({
      isCorrect,
      xpAwarded,
      userSummary,
      boosted2x: xpMult === 2,
    });
    setReviewed((prev) => [...prev, { question: currentQ, isCorrect, userSummary }]);
  };

  const handleActivateDoubleXp = () => {
    if (feedback || doubleXpMsLeft !== null || boosters.double_xp_10s <= 0) return;
    if (!onConsumeBooster('double_xp_10s')) return;
    soundEngine.playSfx('unlock');
    doubleXpDeadlineRef.current = Date.now() + 10_000;
    setDoubleXpMsLeft(10_000);
  };

  const handleActivateSecondChance = () => {
    if (feedback || secondChanceArmed || secondChanceSavedMsg || boosters.second_chance <= 0) {
      return;
    }
    if (!onConsumeBooster('second_chance')) return;
    soundEngine.playSfx('terminal');
    setSecondChanceArmed(true);
  };

  const handleActivateFiftyFifty = () => {
    if (feedback || fiftyUsed || boosters.fifty_fifty <= 0) return;
    if (!onConsumeBooster('fifty_fifty')) return;
    soundEngine.playSfx('terminal');
    setFiftyUsed(true);

    // 1. Standard choice questions
    if (currentQ.options && currentQ.correctIndex !== undefined) {
      const wrongIndices = currentQ.options[lang]
        .map((_, i) => i)
        .filter((i) => i !== currentQ.correctIndex && !eliminatedOptionIndices.includes(i));
      const toRemoveCount = Math.max(1, Math.ceil(wrongIndices.length / 2));
      const toRemove = wrongIndices.slice(0, toRemoveCount);
      setEliminatedOptionIndices((prev) => [...prev, ...toRemove]);
      if (inputState.selectedIndex !== null && toRemove.includes(inputState.selectedIndex)) {
        setInputState((prev) => ({ ...prev, selectedIndex: null }));
      }
      return;
    }

    // 2. Python DEBUG_MODE
    if (currentQ.format === 'DEBUG_MODE' && currentQ.python) {
      const py = currentQ.python;
      if (
        (py.mode === 'predict_output' || py.mode === 'fix_logic') &&
        py.options &&
        py.correctOptionIndex !== undefined
      ) {
        const wrongIndices = py.options[lang]
          .map((_, i) => i)
          .filter((i) => i !== py.correctOptionIndex && !eliminatedOptionIndices.includes(i));
        const toRemove = wrongIndices.slice(0, Math.max(1, Math.ceil(wrongIndices.length / 2)));
        setEliminatedOptionIndices((prev) => [...prev, ...toRemove]);
        return;
      }
      if (py.mode === 'find_error_line' && py.bugLine) {
        const totalLines = py.codeLines.length;
        const safeLines = py.codeLines
          .map((_, i) => i + 1)
          .filter((ln) => Math.abs(ln - py.bugLine!) > 1);
        setEliminatedCodeLines(safeLines);
        const minLine = Math.max(1, py.bugLine - 1);
        const maxLine = Math.min(totalLines, py.bugLine + 1);
        setFiftyClueText(`${bT.fiftyCodeLineHint} #${minLine}–#${maxLine}`);
        return;
      }
      if (py.mode === 'complete_code' && py.acceptedTextAnswers?.[0]) {
        setFiftyClueText(`${bT.fiftyUsedPrefix} ${maskHalfAnswer(py.acceptedTextAnswers[0])}`);
        return;
      }
    }

    // 3. SQL_TERMINAL
    if (currentQ.format === 'SQL_TERMINAL' && currentQ.sql) {
      const patterns = currentQ.sql.requiredPatterns;
      const half = patterns.slice(0, Math.max(1, Math.ceil(patterns.length / 2)));
      setFiftyClueText(`${bT.fiftyPatternPrefix} ${half.join(' · ')}`);
      return;
    }

    // 4. MATCHING
    if (currentQ.format === 'MATCHING' && currentQ.pairs) {
      const halfCount = Math.max(1, Math.floor(currentQ.pairs.length / 2));
      const fixedPairs = currentQ.pairs.slice(0, halfCount);
      const nextMap = { ...inputState.matchingSelections };
      const lockedIds: string[] = [];
      for (const fp of fixedPairs) {
        for (const [k, v] of Object.entries(nextMap)) {
          if (v === fp.id) delete nextMap[k];
        }
        nextMap[fp.id] = fp.id;
        lockedIds.push(fp.id);
      }
      setInputState((prev) => ({ ...prev, matchingSelections: nextMap }));
      setLockedMatchingPairIds(lockedIds);
      setFiftyClueText(bT.fiftyMatchApplied);
      return;
    }

    // 5. ORDER_STEPS
    if (currentQ.format === 'ORDER_STEPS' && currentQ.correctOrder) {
      const halfCount = Math.max(1, Math.floor(currentQ.correctOrder.length / 2));
      const prefix = currentQ.correctOrder.slice(0, halfCount);
      const rest = inputState.orderedIds.filter((id) => !prefix.includes(id));
      setInputState((prev) => ({ ...prev, orderedIds: [...prefix, ...rest] }));
      setFiftyClueText(bT.fiftyOrderApplied);
      return;
    }

    // 6. Text / Data Recovery / Code Breaker input
    if (currentQ.acceptedAnswers?.[0]) {
      setFiftyClueText(`${bT.fiftyUsedPrefix} ${maskHalfAnswer(currentQ.acceptedAnswers[0])}`);
    }
  };

  const handleSubmitStandard = () => {
    const res = validateQuestionSubmission(currentQ, lang, {
      selectedIndex: inputState.selectedIndex,
      textInput: inputState.textInput,
      matchingSelections: inputState.matchingSelections,
      orderedIds: inputState.orderedIds,
      selectedCodeLine: inputState.selectedCodeLine,
      sqlQuery: inputState.sqlQuery,
    });

    if (!res.isCorrect && secondChanceArmed) {
      soundEngine.playSfx('incorrect');
      setSecondChanceArmed(false);
      setSecondChanceSavedMsg(true);
      if (currentQ.options && inputState.selectedIndex !== null) {
        const wrongIdx = inputState.selectedIndex;
        setEliminatedOptionIndices((prev) =>
          prev.includes(wrongIdx) ? prev : [...prev, wrongIdx]
        );
        setInputState((prev) => ({ ...prev, selectedIndex: null }));
      }
      return;
    }

    soundEngine.playSfx(res.isCorrect ? 'correct' : 'incorrect');
    recordOutcome(res.isCorrect, res.userSummary);
  };

  const handleNext = () => {
    soundEngine.playSfx('click');
    if (index + 1 < session.questions.length) {
      setIndex((i) => i + 1);
    } else {
      onFinishSession(reviewed, sessionXp);
    }
  };

  const formatTimer = (sec: number) => {
    const m = Math.floor(sec / 60);
    const s = sec % 60;
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`;
  };

  const canSubmitStandard = (() => {
    if (currentQ.format === 'MATCHING' && currentQ.pairs) {
      return Object.keys(inputState.matchingSelections).length === currentQ.pairs.length;
    }
    if (currentQ.format === 'ORDER_STEPS') return true;
    if (currentQ.acceptedAnswers && currentQ.acceptedAnswers.length > 0) {
      return inputState.textInput.trim().length > 0;
    }
    if (currentQ.options) {
      return inputState.selectedIndex !== null;
    }
    return false;
  })();

  const doubleXpSecStr =
    doubleXpMsLeft !== null ? (doubleXpMsLeft / 1000).toFixed(1) : '10.0';
  const doubleXpBarPct =
    doubleXpMsLeft !== null ? Math.round((doubleXpMsLeft / 10_000) * 100) : 0;

  return (
    <div className="mx-auto max-w-3xl space-y-5">
      {/* Top Mission Progress Header */}
      <div className="flex items-center justify-between gap-3">
        <button
          type="button"
          onClick={() => {
            soundEngine.playSfx('click');
            onExit();
          }}
          className="inline-flex min-h-[44px] items-center gap-1.5 rounded-lg border border-[#1E2C30] bg-[#11181B] px-3 py-2 text-xs font-medium text-[#8A9993] hover:text-[#F2F5F3]"
        >
          <ArrowLeft className="h-4 w-4" />
          <span>{t.exitMission}</span>
        </button>

        <div className="flex items-center gap-3 font-mono text-xs text-[#8A9993]">
          <span className="flex items-center gap-1 text-[#5AD9F5] tabular-nums">
            <Clock className="h-3.5 w-3.5" />
            {formatTimer(elapsedSec)}
          </span>
          <span aria-hidden="true">·</span>
          <span className="tabular-nums text-[#F2F5F3]">
            {t.questionOf} {index + 1}/{session.questions.length}
          </span>
        </div>
      </div>

      {/* Smooth Progress Bar */}
      <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#11181B]">
        <div
          className="h-full rounded-full bg-gradient-to-r from-[#5AD9F5] to-[#75FFAE] transition-all duration-300"
          style={{ width: `${progressPct}%` }}
        />
      </div>

      {/* Interactive Booster Bar */}
      {!feedback && (
        <section className="rounded-2xl border border-[#1E2C30] bg-[#0B1013]/95 p-3.5 space-y-2.5">
          <div className="flex flex-wrap items-center justify-between gap-2 text-[11px] font-mono text-[#8A9993]">
            <span className="uppercase tracking-wider text-[#5AD9F5]">{bT.title}</span>
            <span>{bT.refillHint}</span>
          </div>

          <div className="grid grid-cols-1 gap-2 sm:grid-cols-3">
            {/* 1. 2x XP in 10s */}
            <button
              type="button"
              disabled={doubleXpMsLeft !== null || boosters.double_xp_10s <= 0}
              onClick={handleActivateDoubleXp}
              title={bT.doubleXpDesc}
              className={`flex min-h-[46px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition ${
                isDoubleXpActive
                  ? 'border-[#75FFAE] bg-[#75FFAE]/15 text-[#75FFAE]'
                  : isDoubleXpExpired
                    ? 'border-[#1E2C30] bg-[#11181B] text-[#8A9993]/60'
                    : boosters.double_xp_10s > 0
                      ? 'border-[#24343B] bg-[#11181B] text-[#F2F5F3] hover:border-[#75FFAE]/60'
                      : 'cursor-not-allowed border-[#192226] bg-[#0B1013] text-[#8A9993]/40'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Zap className="h-4 w-4 shrink-0 text-[#75FFAE]" />
                <span className="truncate text-xs font-semibold">{bT.doubleXpName}</span>
              </span>
              <span className="font-mono text-xs font-bold tabular-nums shrink-0 text-[#75FFAE]">
                {isDoubleXpActive ? `${doubleXpSecStr}s` : `×${boosters.double_xp_10s}`}
              </span>
            </button>

            {/* 2. Second Chance */}
            <button
              type="button"
              disabled={
                secondChanceArmed || secondChanceSavedMsg || boosters.second_chance <= 0
              }
              onClick={handleActivateSecondChance}
              title={bT.secondChanceDesc}
              className={`flex min-h-[46px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition ${
                secondChanceArmed
                  ? 'border-[#5AD9F5] bg-[#5AD9F5]/15 text-[#5AD9F5]'
                  : secondChanceSavedMsg
                    ? 'border-[#1E2C30] bg-[#11181B] text-[#8A9993]/60'
                    : boosters.second_chance > 0
                      ? 'border-[#24343B] bg-[#11181B] text-[#F2F5F3] hover:border-[#5AD9F5]/60'
                      : 'cursor-not-allowed border-[#192226] bg-[#0B1013] text-[#8A9993]/40'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Shield className="h-4 w-4 shrink-0 text-[#5AD9F5]" />
                <span className="truncate text-xs font-semibold">{bT.secondChanceName}</span>
              </span>
              <span className="font-mono text-xs font-bold tabular-nums shrink-0 text-[#5AD9F5]">
                {secondChanceArmed ? bT.usedBadge : `×${boosters.second_chance}`}
              </span>
            </button>

            {/* 3. 50/50 */}
            <button
              type="button"
              disabled={fiftyUsed || boosters.fifty_fifty <= 0}
              onClick={handleActivateFiftyFifty}
              title={bT.fiftyFiftyDesc}
              className={`flex min-h-[46px] items-center justify-between gap-2 rounded-xl border px-3 py-2 text-left transition ${
                fiftyUsed
                  ? 'border-[#F5B85A]/40 bg-[#F5B85A]/10 text-[#F5B85A]'
                  : boosters.fifty_fifty > 0
                    ? 'border-[#24343B] bg-[#11181B] text-[#F2F5F3] hover:border-[#F5B85A]/60'
                    : 'cursor-not-allowed border-[#192226] bg-[#0B1013] text-[#8A9993]/40'
              }`}
            >
              <span className="flex items-center gap-2 min-w-0">
                <Scissors className="h-4 w-4 shrink-0 text-[#F5B85A]" />
                <span className="truncate text-xs font-semibold">{bT.fiftyFiftyName}</span>
              </span>
              <span className="font-mono text-xs font-bold tabular-nums shrink-0 text-[#F5B85A]">
                {fiftyUsed ? bT.usedBadge : `×${boosters.fifty_fifty}`}
              </span>
            </button>
          </div>

          {/* Live 10s Overdrive Countdown Bar */}
          {doubleXpMsLeft !== null && (
            <div className="space-y-1 pt-0.5">
              <div className="flex items-center justify-between font-mono text-[11px]">
                <span className={isDoubleXpActive ? 'font-bold text-[#75FFAE]' : 'text-[#8A9993]'}>
                  {isDoubleXpActive ? bT.overdriveActive : bT.overdriveExpired}
                </span>
                <span className="tabular-nums text-[#75FFAE]">{doubleXpSecStr}s</span>
              </div>
              <div className="h-1.5 w-full overflow-hidden rounded-full bg-[#11181B]">
                <div
                  className={`h-full rounded-full transition-all duration-75 ${
                    isDoubleXpActive ? 'bg-[#75FFAE]' : 'bg-[#8A9993]/40'
                  }`}
                  style={{ width: `${doubleXpBarPct}%` }}
                />
              </div>
            </div>
          )}

          {/* Shield Armed / Triggered & 50/50 Clue Indicators */}
          {secondChanceArmed && (
            <div className="rounded-lg border border-[#5AD9F5]/40 bg-[#5AD9F5]/10 px-3 py-2 text-xs text-[#5AD9F5]">
              {bT.shieldArmed}
            </div>
          )}

          {secondChanceSavedMsg && (
            <div className="rounded-lg border border-[#75FFAE]/45 bg-[#75FFAE]/10 px-3 py-2 text-xs font-medium text-[#75FFAE]">
              {bT.shieldTriggered}
            </div>
          )}

          {fiftyClueText && (
            <div className="rounded-lg border border-[#F5B85A]/45 bg-[#F5B85A]/10 px-3 py-2 font-mono text-xs text-[#F5B85A]">
              {fiftyClueText}
            </div>
          )}
        </section>
      )}

      {/* Question Card */}
      <div className="rounded-2xl border border-[#1E2C30] bg-[#11181B]/95 p-5 sm:p-6 space-y-5">
        <div>
          <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#8A9993]">
            {modDef && <span className="text-[#5AD9F5]">{modDef.title[lang]}</span>}
            <span aria-hidden="true">·</span>
            <span>{UI_TEXT[lang].formats[currentQ.format]}</span>
            <span aria-hidden="true">·</span>
            <span>{UI_TEXT[lang].difficulty[currentQ.difficulty]}</span>
            <span aria-hidden="true">·</span>
            <span className="text-[#75FFAE] tabular-nums">
              +{isDoubleXpActive ? currentQ.xpReward * 2 : currentQ.xpReward} XP
              {isDoubleXpActive ? ' (2×)' : ''}
            </span>
          </div>

          <h1 className="mt-2 font-display text-xl font-bold text-[#F2F5F3] sm:text-2xl">
            {currentQ.title[lang]}
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-[#F2F5F3]/95 sm:text-base">
            {currentQ.prompt[lang]}
          </p>
        </div>

        {/* Interactive Body */}
        {currentQ.format === 'DEBUG_MODE' && currentQ.python ? (
          <PythonInteractiveRunner
            question={currentQ}
            lang={lang}
            locked={Boolean(feedback)}
            eliminatedOptionIndices={eliminatedOptionIndices}
            eliminatedCodeLines={eliminatedCodeLines}
            secondChanceArmed={secondChanceArmed}
            onSecondChanceTriggered={({ wrongOptionIndex, wrongLine }) => {
              setSecondChanceArmed(false);
              setSecondChanceSavedMsg(true);
              if (wrongOptionIndex !== null) {
                setEliminatedOptionIndices((prev) =>
                  prev.includes(wrongOptionIndex) ? prev : [...prev, wrongOptionIndex]
                );
              }
              if (wrongLine !== null) {
                setEliminatedCodeLines((prev) =>
                  prev.includes(wrongLine) ? prev : [...prev, wrongLine]
                );
              }
            }}
            onEvaluated={(ok, summary) => recordOutcome(ok, summary)}
          />
        ) : currentQ.format === 'SQL_TERMINAL' && currentQ.sql ? (
          <SqlInteractiveRunner
            question={currentQ}
            lang={lang}
            locked={Boolean(feedback)}
            secondChanceArmed={secondChanceArmed}
            onSecondChanceTriggered={() => {
              setSecondChanceArmed(false);
              setSecondChanceSavedMsg(true);
            }}
            onEvaluated={(ok, summary) => recordOutcome(ok, summary)}
          />
        ) : (
          <QuestionWidget
            question={currentQ}
            lang={lang}
            value={inputState}
            onChange={setInputState}
            disabled={Boolean(feedback)}
            eliminatedOptionIndices={eliminatedOptionIndices}
            lockedMatchingPairIds={lockedMatchingPairIds}
          />
        )}

        {/* Standard Submit + Hint controls (Python/SQL runners include their own Run/Hint controls) */}
        {!isTerminalHandled && !feedback && (
          <div className="flex flex-wrap items-center justify-between gap-3 pt-2 border-t border-[#1A252A]">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSfx('click');
                setShowHint((h) => !h);
              }}
              className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#24343B] bg-[#0B1013] px-4 py-2 text-xs font-medium text-[#5AD9F5] hover:border-[#5AD9F5]/50"
            >
              <HelpCircle className="h-4 w-4" />
              <span>{t.hintBtn}</span>
            </button>

            <button
              type="button"
              disabled={!canSubmitStandard}
              onClick={handleSubmitStandard}
              className="inline-flex min-h-[48px] items-center justify-center rounded-xl bg-[#75FFAE] px-6 py-2.5 text-sm font-bold text-[#080B0D] transition hover:bg-[#8BFFBA] disabled:opacity-40"
            >
              {t.submitBtn}
            </button>
          </div>
        )}

        {!isTerminalHandled && showHint && !feedback && (
          <div className="rounded-xl border border-[#5AD9F5]/35 bg-[#5AD9F5]/10 p-3.5 text-xs leading-relaxed text-[#F2F5F3]">
            {currentQ.hint[lang]}
          </div>
        )}

        {/* Feedback Banner & Next Step */}
        {feedback && (
          <div className="space-y-4 border-t border-[#1D2A30] pt-4">
            {!isTerminalHandled && (
              <div
                className={`rounded-xl border p-4 space-y-2 ${
                  feedback.isCorrect
                    ? 'border-[#75FFAE]/45 bg-[#75FFAE]/10'
                    : 'border-[#FF626C]/45 bg-[#FF626C]/10'
                }`}
              >
                <div className="flex items-center justify-between gap-2">
                  <div
                    className={`flex items-center gap-2 text-sm font-bold ${
                      feedback.isCorrect ? 'text-[#75FFAE]' : 'text-[#FF626C]'
                    }`}
                  >
                    {feedback.isCorrect ? (
                      <CheckCircle2 className="h-5 w-5 shrink-0" />
                    ) : (
                      <AlertTriangle className="h-5 w-5 shrink-0" />
                    )}
                    <span>{feedback.isCorrect ? t.correct : t.incorrect}</span>
                  </div>
                  <span className="font-mono text-xs font-bold text-[#75FFAE] tabular-nums">
                    +{feedback.xpAwarded} XP{feedback.boosted2x ? ' (2×)' : ''}
                  </span>
                </div>

                <div className="text-xs text-[#F2F5F3]">
                  <strong className="text-[#5AD9F5]">{t.correctSolution}:</strong>{' '}
                  <span className="font-mono">{currentQ.solutionDisplay[lang]}</span>
                </div>
                <p className="text-xs leading-relaxed text-[#8A9993]">
                  {currentQ.explanation[lang]}
                </p>
                {!feedback.isCorrect && (
                  <p className="text-[11px] font-mono text-[#8A9993]">
                    {t.noXpLost}
                  </p>
                )}
              </div>
            )}

            <button
              type="button"
              onClick={handleNext}
              className="flex min-h-[48px] w-full items-center justify-center gap-2 rounded-xl bg-[#5AD9F5] px-6 py-3 font-display text-sm font-bold text-[#080B0D] transition hover:bg-[#7CE3FA]"
            >
              <span>
                {index + 1 < session.questions.length ? t.nextBtn : t.finishBtn}
              </span>
              <ChevronRight className="h-4 w-4" />
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
