import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Code2,
  HelpCircle,
  Play,
  RotateCcw,
} from 'lucide-react';
import { getPythonLabQuestions } from '../data/finalBossPool';
import { UI_TEXT } from '../i18n/translations';
import { Language, Question } from '../types/game';
import { validateQuestionSubmission } from '../utils/validation';
import { soundEngine } from '../audio/soundEngine';

const PYTHON_KEYWORDS = new Set([
  'def',
  'if',
  'elif',
  'else',
  'for',
  'while',
  'in',
  'and',
  'or',
  'not',
  'return',
  'print',
  'range',
  'sum',
  'len',
]);

function highlightPythonLine(line: string): React.ReactNode[] {
  const tokens = line.split(/(\s+|[()[\]:.,=+%/*-]|"[^"]*"|'[^']*')/g);
  return tokens.map((tok, i) => {
    if (!tok) return null;
    if (
      (tok.startsWith('"') && tok.endsWith('"')) ||
      (tok.startsWith("'") && tok.endsWith("'"))
    ) {
      return (
        <span key={i} className="text-[#75FFAE]">
          {tok}
        </span>
      );
    }
    if (PYTHON_KEYWORDS.has(tok)) {
      return (
        <span key={i} className="font-semibold text-[#5AD9F5]">
          {tok}
        </span>
      );
    }
    if (/^\d+$/.test(tok)) {
      return (
        <span key={i} className="text-[#F5B85A]">
          {tok}
        </span>
      );
    }
    if (tok === '___') {
      return (
        <span
          key={i}
          className="rounded bg-[#5AD9F5]/20 px-1.5 py-0.5 text-[#5AD9F5] underline"
        >
          ___
        </span>
      );
    }
    return (
      <span key={i} className="text-[#F2F5F3]">
        {tok}
      </span>
    );
  });
}

interface PythonInteractiveRunnerProps {
  question: Question;
  lang: Language;
  onEvaluated?: (isCorrect: boolean, summary: string) => void;
  showHintButton?: boolean;
  locked?: boolean;
  eliminatedOptionIndices?: number[];
  eliminatedCodeLines?: number[];
  secondChanceArmed?: boolean;
  onSecondChanceTriggered?: (payload: {
    summary: string;
    wrongOptionIndex: number | null;
    wrongLine: number | null;
  }) => void;
}

export const PythonInteractiveRunner: React.FC<PythonInteractiveRunnerProps> = ({
  question,
  lang,
  onEvaluated,
  showHintButton = true,
  locked = false,
  eliminatedOptionIndices = [],
  eliminatedCodeLines = [],
  secondChanceArmed = false,
  onSecondChanceTriggered,
}) => {
  const t = UI_TEXT[lang].pythonLab;
  const gT = UI_TEXT[lang].gameplay;
  const py = question.python!;

  const [selectedLine, setSelectedLine] = useState<number | null>(null);
  const [selectedOpt, setSelectedOpt] = useState<number | null>(null);
  const [textAns, setTextAns] = useState('');
  const [showHint, setShowHint] = useState(false);

  const [isExecuting, setIsExecuting] = useState(false);
  const [execStep, setExecStep] = useState(0);
  const [result, setResult] = useState<{
    isCorrect: boolean;
    summary: string;
  } | null>(null);

  useEffect(() => {
    setSelectedLine(null);
    setSelectedOpt(null);
    setTextAns('');
    setShowHint(false);
    setIsExecuting(false);
    setExecStep(0);
    setResult(null);
  }, [question.id]);

  const canRun =
    !locked &&
    !isExecuting &&
    ((py.mode === 'find_error_line' && selectedLine !== null) ||
      ((py.mode === 'predict_output' || py.mode === 'fix_logic') &&
        selectedOpt !== null) ||
      (py.mode === 'complete_code' && textAns.trim().length > 0));

  const handleRun = () => {
    if (!canRun) return;
    soundEngine.playSfx('execute');
    setIsExecuting(true);
    setExecStep(1);
    setResult(null);

    const t1 = window.setTimeout(() => setExecStep(2), 180);
    const t2 = window.setTimeout(() => setExecStep(3), 360);
    const t3 = window.setTimeout(() => {
      setExecStep(4);
      setIsExecuting(false);
      const outcome = validateQuestionSubmission(question, lang, {
        selectedIndex: selectedOpt,
        selectedCodeLine: selectedLine,
        textInput: textAns,
      });
      if (!outcome.isCorrect && secondChanceArmed && onSecondChanceTriggered) {
        soundEngine.playSfx('incorrect');
        setExecStep(0);
        setResult(null);
        if (py.mode === 'predict_output' || py.mode === 'fix_logic') {
          setSelectedOpt(null);
        } else if (py.mode === 'find_error_line') {
          setSelectedLine(null);
        }
        onSecondChanceTriggered({
          summary: outcome.userSummary,
          wrongOptionIndex: selectedOpt,
          wrongLine: selectedLine,
        });
        return;
      }
      setResult({ isCorrect: outcome.isCorrect, summary: outcome.userSummary });
      soundEngine.playSfx(outcome.isCorrect ? 'correct' : 'incorrect');
      onEvaluated?.(outcome.isCorrect, outcome.userSummary);
    }, 560);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  };

  const handleReset = () => {
    soundEngine.playSfx('click');
    setSelectedLine(null);
    setSelectedOpt(null);
    setTextAns('');
    setExecStep(0);
    setResult(null);
  };

  return (
    <div className="space-y-4">
      {/* Code Editor Window */}
      <div className="overflow-hidden rounded-xl border border-[#223239] bg-[#070A0C]">
        <div className="flex items-center justify-between border-b border-[#1A252A] bg-[#0D1316] px-4 py-2.5 text-xs font-mono">
          <span className="flex items-center gap-2 text-[#5AD9F5]">
            <Code2 className="h-3.5 w-3.5" />
            <span>main.py</span>
          </span>
          <span className="text-[#8A9993]">
            {UI_TEXT[lang].difficulty[question.difficulty]}
          </span>
        </div>

        <div className="overflow-x-auto p-3 sm:p-4 font-mono text-xs sm:text-sm leading-6">
          {py.codeLines.map((line, idx) => {
            const lineNum = idx + 1;
            const isFindMode = py.mode === 'find_error_line';
            const isEliminatedLine = eliminatedCodeLines.includes(lineNum);
            const isPicked = selectedLine === lineNum;
            const showBugHighlight =
              result && !result.isCorrect && py.bugLine === lineNum;
            const showResolvedBug =
              result && result.isCorrect && py.bugLine === lineNum;

            return (
              <div
                key={lineNum}
                onClick={() => {
                  if (!isFindMode || locked || result || isEliminatedLine) return;
                  soundEngine.playSfx('click');
                  setSelectedLine(lineNum);
                }}
                className={`flex items-center gap-3 rounded px-2 py-0.5 transition ${
                  isEliminatedLine
                    ? 'opacity-35'
                    : isFindMode && !result && !locked
                      ? 'cursor-pointer hover:bg-[#142026]'
                      : ''
                } ${
                  isPicked
                    ? 'bg-[#5AD9F5]/15 ring-1 ring-[#5AD9F5]/40'
                    : ''
                } ${
                  showBugHighlight ? 'bg-[#FF626C]/15' : ''
                } ${
                  showResolvedBug ? 'bg-[#75FFAE]/15' : ''
                }`}
              >
                <span className="w-6 shrink-0 select-none text-right text-[#8A9993]/70 tabular-nums">
                  {lineNum}
                </span>
                <pre className="whitespace-pre flex-1">
                  {highlightPythonLine(line)}
                  {idx === py.codeLines.length - 1 && (
                    <span className="animate-cursor-blink ml-1 inline-block h-4 w-2 bg-[#75FFAE] align-middle" />
                  )}
                </pre>
                {(isPicked || showBugHighlight) && (
                  <AlertTriangle
                    className={`h-3.5 w-3.5 shrink-0 ${
                      showResolvedBug ? 'text-[#75FFAE]' : 'text-[#FF626C]'
                    }`}
                  />
                )}
              </div>
            );
          })}
        </div>
      </div>

      {/* Mode-specific controls */}
      {py.mode === 'find_error_line' && (
        <div className="rounded-lg border border-[#1E2C30] bg-[#0B1013] px-3.5 py-2.5 text-xs text-[#8A9993]">
          {t.selectBugLine}{' '}
          {selectedLine !== null && (
            <span className="font-mono font-semibold text-[#5AD9F5]">
              ({t.selectedLine}: #{selectedLine})
            </span>
          )}
        </div>
      )}

      {(py.mode === 'predict_output' || py.mode === 'fix_logic') && py.options && (
        <div className="space-y-2">
          <div className="text-xs text-[#8A9993]">{t.chooseFix}</div>
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {py.options[lang].map((opt, idx) => {
              const selected = selectedOpt === idx;
              const isEliminated = eliminatedOptionIndices.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={locked || Boolean(result) || isEliminated}
                  onClick={() => {
                    soundEngine.playSfx('click');
                    setSelectedOpt(idx);
                  }}
                  className={`flex min-h-[48px] items-center gap-3 rounded-xl border px-4 py-2.5 text-left font-mono text-xs sm:text-sm transition ${
                    isEliminated
                      ? 'cursor-not-allowed border-[#1A2226] bg-[#080B0D] text-[#8A9993]/35 line-through opacity-45'
                      : selected
                        ? 'border-[#75FFAE] bg-[#75FFAE]/12 text-[#75FFAE]'
                        : 'border-[#223137] bg-[#0B1013] text-[#F2F5F3] hover:border-[#5AD9F5]/45'
                  }`}
                >
                  <span className="font-bold text-[#5AD9F5]">
                    {String.fromCharCode(65 + idx)}.
                  </span>
                  <span>{opt}</span>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {py.mode === 'complete_code' && (
        <div className="space-y-1.5">
          <label className="block text-xs text-[#8A9993]">
            {t.enterMissing}
          </label>
          <input
            type="text"
            disabled={locked || Boolean(result)}
            value={textAns}
            onChange={(e) => setTextAns(e.target.value)}
            placeholder="range(2, 7, 2)"
            className="min-h-[48px] w-full rounded-xl border border-[#24343B] bg-[#0B1013] px-4 py-2.5 font-mono text-sm text-[#75FFAE] outline-none focus:border-[#75FFAE]"
          />
        </div>
      )}

      {/* Action Buttons */}
      <div className="flex flex-wrap items-center gap-2.5">
        <button
          type="button"
          disabled={!canRun || Boolean(result)}
          onClick={handleRun}
          className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#75FFAE] px-5 py-2.5 text-xs font-bold text-[#080B0D] transition hover:bg-[#8BFFBA] disabled:opacity-40"
        >
          <Play className="h-3.5 w-3.5 fill-current" />
          <span>{t.runCode}</span>
        </button>

        {!locked && (
          <button
            type="button"
            onClick={handleReset}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#24343B] bg-[#0B1013] px-4 py-2.5 text-xs font-medium text-[#8A9993] hover:text-[#F2F5F3]"
          >
            <RotateCcw className="h-3.5 w-3.5" />
            <span>{t.resetCode}</span>
          </button>
        )}

        {showHintButton && (
          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              setShowHint((v) => !v);
            }}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#24343B] bg-[#0B1013] px-4 py-2.5 text-xs font-medium text-[#5AD9F5] hover:border-[#5AD9F5]/50"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{gT.hintBtn}</span>
          </button>
        )}
      </div>

      {showHint && (
        <div className="rounded-xl border border-[#5AD9F5]/35 bg-[#5AD9F5]/10 p-3.5 text-xs leading-relaxed text-[#F2F5F3]">
          {question.hint[lang]}
        </div>
      )}

      {/* Execution Console Output */}
      {execStep > 0 && (
        <div className="rounded-xl border border-[#223239] bg-[#06090B] p-4 font-mono text-xs">
          <div className="mb-2 text-[11px] uppercase tracking-wider text-[#8A9993]">
            {t.consoleTitle}
          </div>
          <div className="space-y-1">
            {t.execSteps.slice(0, execStep).map((line, i) => (
              <div key={i} className="text-[#5AD9F5]">
                &gt; {line}
              </div>
            ))}
          </div>

          {result && (
            <div className="mt-3 border-t border-[#1A252A] pt-3 space-y-2">
              <div className="text-[#F2F5F3]">
                {lang === 'kk' ? 'Нәтиже:' : 'Вывод:'}{' '}
                <span className="text-[#75FFAE]">{py.expectedConsoleOutput}</span>
              </div>
              <div
                className={`flex items-center gap-2 font-sans text-xs font-semibold ${
                  result.isCorrect ? 'text-[#75FFAE]' : 'text-[#FF626C]'
                }`}
              >
                {result.isCorrect ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                <span>{result.isCorrect ? gT.correct : gT.incorrect}</span>
              </div>
              <div className="font-sans text-xs text-[#F2F5F3]/90">
                <strong className="text-[#5AD9F5]">{gT.correctSolution}:</strong>{' '}
                {question.solutionDisplay[lang]}
              </div>
              <p className="font-sans text-xs leading-relaxed text-[#8A9993]">
                {question.explanation[lang]}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface PythonLabScreenProps {
  lang: Language;
  completedIds: string[];
  onRecordPractice: (question: Question, isCorrect: boolean) => void;
  onOpenSqlTerminal: () => void;
}

export const PythonLabScreen: React.FC<PythonLabScreenProps> = ({
  lang,
  completedIds,
  onRecordPractice,
  onOpenSqlTerminal,
}) => {
  const t = UI_TEXT[lang].pythonLab;
  const tasks = getPythonLabQuestions();
  const [activeIndex, setActiveIndex] = useState(0);
  const activeTask = tasks[activeIndex] ?? tasks[0];

  return (
    <div className="space-y-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="font-display text-2xl font-bold text-[#F2F5F3] sm:text-3xl">
            {t.title}
          </h1>
          <p className="mt-1 text-sm text-[#8A9993]">{t.subtitle}</p>
        </div>
        <button
          type="button"
          onClick={() => {
            soundEngine.playSfx('click');
            onOpenSqlTerminal();
          }}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#75FFAE]/40 bg-[#75FFAE]/10 px-4 py-2 text-xs font-semibold text-[#75FFAE] hover:bg-[#75FFAE]/20 self-start sm:self-auto"
        >
          {lang === 'kk' ? 'SQL Терминалы →' : 'SQL Terminal →'}
        </button>
      </div>

      {/* Task Switcher Strip */}
      <div className="flex gap-2 overflow-x-auto pb-1">
        {tasks.map((task, idx) => {
          const isSolved = completedIds.includes(task.id);
          const isActive = idx === activeIndex;
          return (
            <button
              key={task.id}
              type="button"
              onClick={() => {
                soundEngine.playSfx('click');
                setActiveIndex(idx);
              }}
              className={`inline-flex min-h-[40px] shrink-0 items-center gap-2 rounded-lg border px-3 py-1.5 font-mono text-xs transition ${
                isActive
                  ? 'border-[#5AD9F5] bg-[#5AD9F5]/15 text-[#5AD9F5]'
                  : 'border-[#1E2C30] bg-[#11181B] text-[#8A9993] hover:text-[#F2F5F3]'
              }`}
            >
              <span className="tabular-nums">#{idx + 1}</span>
              <span className="max-w-[140px] truncate">{task.title[lang]}</span>
              {isSolved && <CheckCircle2 className="h-3.5 w-3.5 text-[#75FFAE]" />}
            </button>
          );
        })}
      </div>

      {/* Active Challenge Workspace */}
      <div className="rounded-2xl border border-[#1E2C30] bg-[#11181B]/90 p-5 sm:p-6 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-2">
          <h2 className="font-display text-lg font-semibold text-[#F2F5F3]">
            {activeTask.title[lang]}
          </h2>
          <span className="font-mono text-xs text-[#75FFAE]">
            +{activeTask.xpReward} XP · {activeTask.topicTag[lang]}
          </span>
        </div>
        <p className="text-sm leading-relaxed text-[#F2F5F3]/90">
          {activeTask.prompt[lang]}
        </p>

        <PythonInteractiveRunner
          question={activeTask}
          lang={lang}
          onEvaluated={(isCorrect) => onRecordPractice(activeTask, isCorrect)}
        />
      </div>
    </div>
  );
};
