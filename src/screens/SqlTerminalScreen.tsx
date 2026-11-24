import React, { useEffect, useState } from 'react';
import {
  AlertTriangle,
  CheckCircle2,
  Database,
  HelpCircle,
  Play,
  Trash2,
} from 'lucide-react';
import { getSqlTerminalQuestions } from '../data/finalBossPool';
import { SAMPLE_TABLES, SqlExecutionResult } from '../data/sqlDatabase';
import { UI_TEXT } from '../i18n/translations';
import { Language, Question } from '../types/game';
import { validateQuestionSubmission } from '../utils/validation';
import { soundEngine } from '../audio/soundEngine';

const SQL_CHIPS = [
  'SELECT * FROM ',
  'WHERE ',
  'ORDER BY ',
  'GROUP BY ',
  'HAVING ',
  'JOIN ',
  'COUNT(*)',
  'AVG(',
  'DESC;',
];

interface SqlInteractiveRunnerProps {
  question: Question;
  lang: Language;
  onEvaluated?: (isCorrect: boolean, summary: string) => void;
  locked?: boolean;
  secondChanceArmed?: boolean;
  onSecondChanceTriggered?: (wrongSummary: string) => void;
}

export const SqlInteractiveRunner: React.FC<SqlInteractiveRunnerProps> = ({
  question,
  lang,
  onEvaluated,
  locked = false,
  secondChanceArmed = false,
  onSecondChanceTriggered,
}) => {
  const t = UI_TEXT[lang].sqlTerminal;
  const gT = UI_TEXT[lang].gameplay;
  const sqlCfg = question.sql!;

  const [query, setQuery] = useState(sqlCfg.starterQuery);
  const [activeTable, setActiveTable] = useState<'students' | 'courses' | 'results'>('students');
  const [showHint, setShowHint] = useState(false);
  const [consoleLog, setConsoleLog] = useState<string[]>([]);
  const [execResult, setExecResult] = useState<SqlExecutionResult | null>(null);
  const [isValidChallenge, setIsValidChallenge] = useState<boolean | null>(null);
  const [running, setRunning] = useState(false);

  useEffect(() => {
    setQuery(sqlCfg.starterQuery);
    setShowHint(false);
    setConsoleLog([]);
    setExecResult(null);
    setIsValidChallenge(null);
    setRunning(false);
  }, [question.id, sqlCfg.starterQuery]);

  const handleRunQuery = () => {
    if (running || locked) return;
    soundEngine.playSfx('execute');
    setRunning(true);
    setConsoleLog([t.consoleSteps[0]]);
    setExecResult(null);
    setIsValidChallenge(null);

    const t1 = window.setTimeout(() => {
      setConsoleLog([t.consoleSteps[0], t.consoleSteps[1]]);
    }, 150);
    const t2 = window.setTimeout(() => {
      setConsoleLog([t.consoleSteps[0], t.consoleSteps[1], t.consoleSteps[2]]);
    }, 300);
    const t3 = window.setTimeout(() => {
      setRunning(false);
      const outcome = validateQuestionSubmission(question, lang, {
        sqlQuery: query,
      });
      const res = outcome.sqlResult!;
      setExecResult(res);

      const rowCountStr = String(res.rows.length).padStart(2, '0');
      const finalLogs = [
        ...t.consoleSteps,
        res.ok ? `${t.rowsReturned}: ${rowCountStr}.` : `${lang === 'kk' ? 'ҚАТЕ' : 'ОШИБКА'}: ${res.message}`,
        res.ok ? t.querySuccess : t.queryError,
      ];
      setConsoleLog(finalLogs);

      if (!outcome.isCorrect && secondChanceArmed && onSecondChanceTriggered) {
        soundEngine.playSfx('incorrect');
        setIsValidChallenge(null);
        onSecondChanceTriggered(outcome.userSummary);
        return;
      }

      setIsValidChallenge(outcome.isCorrect);
      soundEngine.playSfx(outcome.isCorrect ? 'correct' : 'incorrect');
      onEvaluated?.(outcome.isCorrect, outcome.userSummary);
    }, 480);

    return () => {
      window.clearTimeout(t1);
      window.clearTimeout(t2);
      window.clearTimeout(t3);
    };
  };

  const schema = SAMPLE_TABLES[activeTable];

  return (
    <div className="space-y-4">
      {/* Sample Database Inspector */}
      <div className="rounded-xl border border-[#1E2C30] bg-[#0B1013] p-4">
        <div className="flex flex-wrap items-center justify-between gap-2 pb-3 border-b border-[#1A252A]">
          <span className="flex items-center gap-2 font-mono text-xs text-[#5AD9F5]">
            <Database className="h-3.5 w-3.5" />
            <span>{t.tablesTitle}</span>
          </span>
          <div className="flex items-center gap-1">
            {(['students', 'courses', 'results'] as const).map((tbl) => (
              <button
                key={tbl}
                type="button"
                onClick={() => {
                  soundEngine.playSfx('click');
                  setActiveTable(tbl);
                }}
                className={`min-h-[34px] rounded-md px-2.5 font-mono text-xs transition ${
                  activeTable === tbl
                    ? 'bg-[#75FFAE] text-[#080B0D] font-bold'
                    : 'bg-[#141D21] text-[#8A9993] hover:text-[#F2F5F3]'
                }`}
              >
                {tbl}
              </button>
            ))}
          </div>
        </div>

        <div className="mt-3 overflow-x-auto">
          <table className="w-full text-left font-mono text-xs tabular-nums">
            <thead>
              <tr className="border-b border-[#1E2C30] text-[#5AD9F5]">
                {schema.columns.map((col) => (
                  <th key={col} className="px-2.5 py-1.5 font-semibold whitespace-nowrap">
                    {col}
                    {col === schema.primaryKey ? ' (PK)' : ''}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody>
              {schema.rows.slice(0, 4).map((r, idx) => (
                <tr
                  key={idx}
                  className="border-b border-[#141D21] text-[#8A9993] last:border-0"
                >
                  {schema.columns.map((col) => (
                    <td key={col} className="px-2.5 py-1.5 whitespace-nowrap">
                      {String(r[col])}
                    </td>
                  ))}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* SQL Command Input */}
      <div className="rounded-xl border border-[#223239] bg-[#06090B] p-4 space-y-3">
        <div className="flex items-center justify-between font-mono text-xs text-[#8A9993]">
          <span className="flex items-center gap-1.5 text-[#75FFAE]">
            <span>sql&gt;</span>
            <span className="animate-cursor-blink inline-block h-3.5 w-2 bg-[#75FFAE]" />
          </span>
          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              setQuery('');
            }}
            className="inline-flex items-center gap-1 text-xs text-[#8A9993] hover:text-[#FF626C]"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span>{t.clearQuery}</span>
          </button>
        </div>

        <textarea
          rows={3}
          disabled={locked}
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t.queryPlaceholder}
          className="w-full rounded-lg border border-[#1E2C30] bg-[#0B1013] p-3 font-mono text-xs sm:text-sm text-[#75FFAE] outline-none focus:border-[#75FFAE]"
        />

        {/* Touch-friendly SQL quick insert chips */}
        <div className="flex flex-wrap gap-1.5">
          {SQL_CHIPS.map((chip) => (
            <button
              key={chip}
              type="button"
              disabled={locked}
              onClick={() => {
                soundEngine.playSfx('terminal');
                setQuery((q) => (q.endsWith(' ') || q === '' ? q + chip : q + ' ' + chip));
              }}
              className="min-h-[34px] rounded-md border border-[#1E2C30] bg-[#11181B] px-2.5 font-mono text-[11px] text-[#5AD9F5] hover:border-[#5AD9F5]/50"
            >
              {chip.trim()}
            </button>
          ))}
        </div>

        <div className="flex flex-wrap items-center gap-2.5 pt-1">
          <button
            type="button"
            disabled={running || locked || !query.trim()}
            onClick={handleRunQuery}
            className="inline-flex min-h-[44px] items-center gap-2 rounded-xl bg-[#75FFAE] px-5 py-2.5 text-xs font-bold text-[#080B0D] transition hover:bg-[#8BFFBA] disabled:opacity-40"
          >
            <Play className="h-3.5 w-3.5 fill-current" />
            <span>{t.runQuery}</span>
          </button>

          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              setShowHint((v) => !v);
            }}
            className="inline-flex min-h-[44px] items-center gap-1.5 rounded-xl border border-[#24343B] bg-[#0B1013] px-4 py-2.5 text-xs font-medium text-[#5AD9F5] hover:border-[#5AD9F5]/50"
          >
            <HelpCircle className="h-3.5 w-3.5" />
            <span>{t.hintQuery}</span>
          </button>
        </div>

        {showHint && (
          <div className="rounded-lg border border-[#5AD9F5]/35 bg-[#5AD9F5]/10 p-3 text-xs text-[#F2F5F3]">
            {question.hint[lang]}
          </div>
        )}
      </div>

      {/* Console Logs + Query Table Output */}
      {consoleLog.length > 0 && (
        <div className="rounded-xl border border-[#223239] bg-[#06090B] p-4 space-y-3">
          <div className="space-y-1 font-mono text-xs">
            {consoleLog.map((line, i) => (
              <div
                key={i}
                className={
                  line.includes('ERROR')
                    ? 'text-[#FF626C]'
                    : line.includes('SUCCESSFUL')
                      ? 'text-[#75FFAE]'
                      : 'text-[#5AD9F5]'
                }
              >
                &gt; {line}
              </div>
            ))}
          </div>

          {execResult && execResult.ok && execResult.rows.length > 0 && (
            <div className="overflow-x-auto rounded-lg border border-[#1E2C30] bg-[#0B1013]">
              <table className="w-full text-left font-mono text-xs tabular-nums">
                <thead>
                  <tr className="border-b border-[#1E2C30] bg-[#11181B] text-[#5AD9F5]">
                    {execResult.columns.map((col) => (
                      <th key={col} className="px-3 py-2 font-semibold whitespace-nowrap">
                        {col}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {execResult.rows.map((r, rIdx) => (
                    <tr
                      key={rIdx}
                      className="border-b border-[#151F24] bg-[#75FFAE]/5 text-[#F2F5F3] last:border-0"
                    >
                      {execResult.columns.map((col) => (
                        <td key={col} className="px-3 py-2 whitespace-nowrap">
                          {String(r[col] ?? '')}
                        </td>
                      ))}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {isValidChallenge !== null && (
            <div className="border-t border-[#1A252A] pt-3 space-y-1.5">
              <div
                className={`flex items-center gap-2 text-xs font-semibold ${
                  isValidChallenge ? 'text-[#75FFAE]' : 'text-[#FF626C]'
                }`}
              >
                {isValidChallenge ? (
                  <CheckCircle2 className="h-4 w-4 shrink-0" />
                ) : (
                  <AlertTriangle className="h-4 w-4 shrink-0" />
                )}
                <span>{isValidChallenge ? gT.correct : gT.incorrect}</span>
              </div>
              <div className="text-xs text-[#F2F5F3]">
                <strong className="text-[#5AD9F5]">{gT.correctSolution}:</strong>{' '}
                <code className="font-mono text-[#75FFAE]">
                  {question.solutionDisplay[lang]}
                </code>
              </div>
              <p className="text-xs leading-relaxed text-[#8A9993]">
                {question.explanation[lang]}
              </p>
            </div>
          )}
        </div>
      )}
    </div>
  );
};

interface SqlTerminalScreenProps {
  lang: Language;
  completedIds: string[];
  onRecordPractice: (question: Question, isCorrect: boolean) => void;
  onOpenPythonLab: () => void;
}

export const SqlTerminalScreen: React.FC<SqlTerminalScreenProps> = ({
  lang,
  completedIds,
  onRecordPractice,
  onOpenPythonLab,
}) => {
  const t = UI_TEXT[lang].sqlTerminal;
  const tasks = getSqlTerminalQuestions();
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
            onOpenPythonLab();
          }}
          className="inline-flex min-h-[44px] items-center justify-center rounded-xl border border-[#5AD9F5]/40 bg-[#5AD9F5]/10 px-4 py-2 text-xs font-semibold text-[#5AD9F5] hover:bg-[#5AD9F5]/20 self-start sm:self-auto"
        >
          {lang === 'kk' ? '← Python Зертханасы' : '← Python Lab'}
        </button>
      </div>

      {/* SQL Task Switcher */}
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
                  ? 'border-[#75FFAE] bg-[#75FFAE]/15 text-[#75FFAE]'
                  : 'border-[#1E2C30] bg-[#11181B] text-[#8A9993] hover:text-[#F2F5F3]'
              }`}
            >
              <span className="tabular-nums">#{idx + 1}</span>
              <span className="max-w-[150px] truncate">{task.title[lang]}</span>
              {isSolved && <CheckCircle2 className="h-3.5 w-3.5 text-[#75FFAE]" />}
            </button>
          );
        })}
      </div>

      {/* Active SQL Challenge */}
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

        <SqlInteractiveRunner
          question={activeTask}
          lang={lang}
          onEvaluated={(isCorrect) => onRecordPractice(activeTask, isCorrect)}
        />
      </div>
    </div>
  );
};
