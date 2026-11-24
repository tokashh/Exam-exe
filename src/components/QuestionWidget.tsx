import React, { useEffect, useMemo, useState } from 'react';
import { ArrowDown, ArrowUp, Check, Link2 } from 'lucide-react';
import { UI_TEXT } from '../i18n/translations';
import { Language, Question } from '../types/game';
import { soundEngine } from '../audio/soundEngine';

export interface QuestionInputState {
  selectedIndex: number | null;
  textInput: string;
  matchingSelections: Record<string, string>;
  orderedIds: string[];
  selectedCodeLine: number | null;
  sqlQuery: string;
}

export function createInitialInputState(q: Question): QuestionInputState {
  return {
    selectedIndex: null,
    textInput: '',
    matchingSelections: {},
    orderedIds: q.steps ? [...q.steps].sort(() => Math.random() - 0.5).map((s) => s.id) : [],
    selectedCodeLine: null,
    sqlQuery: q.sql?.starterQuery ?? '',
  };
}

interface QuestionWidgetProps {
  question: Question;
  lang: Language;
  value: QuestionInputState;
  onChange: (next: QuestionInputState) => void;
  disabled?: boolean;
  eliminatedOptionIndices?: number[];
  lockedMatchingPairIds?: string[];
}

export const QuestionWidget: React.FC<QuestionWidgetProps> = ({
  question,
  lang,
  value,
  onChange,
  disabled = false,
  eliminatedOptionIndices = [],
  lockedMatchingPairIds = [],
}) => {
  const t = UI_TEXT[lang].gameplay;
  const [activeLeftId, setActiveLeftId] = useState<string | null>(null);

  // Stable shuffled right-hand list for MATCHING
  const shuffledRightPairs = useMemo(() => {
    if (!question.pairs) return [];
    return [...question.pairs].sort((a, b) => a.right[lang].localeCompare(b.right[lang]));
  }, [question.id, question.pairs, lang]);

  useEffect(() => {
    setActiveLeftId(null);
  }, [question.id]);

  // 1. MATCHING format
  if (question.format === 'MATCHING' && question.pairs) {
    return (
      <div className="space-y-4">
        <p className="text-xs text-[#8A9993]">{t.matchingHint}</p>
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          <div className="space-y-2.5">
            {question.pairs.map((p) => {
              const matchedRightId = value.matchingSelections[p.id];
              const isSelected = activeLeftId === p.id;
              const isLockedPair = lockedMatchingPairIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={disabled || isLockedPair}
                  onClick={() => {
                    soundEngine.playSfx('click');
                    setActiveLeftId(p.id);
                  }}
                  className={`flex min-h-[48px] w-full items-center justify-between gap-2 rounded-xl border px-4 py-3 text-left text-sm transition ${
                    isLockedPair
                      ? 'border-[#75FFAE]/50 bg-[#75FFAE]/10 text-[#75FFAE]'
                      : isSelected
                        ? 'border-[#75FFAE] bg-[#75FFAE]/10 text-[#F2F5F3]'
                        : matchedRightId
                          ? 'border-[#5AD9F5]/50 bg-[#5AD9F5]/10 text-[#F2F5F3]'
                          : 'border-[#223137] bg-[#0B1013] text-[#F2F5F3] hover:border-[#5AD9F5]/40'
                  }`}
                >
                  <span>{p.left[lang]}</span>
                  {matchedRightId && (
                    <Link2
                      className={`h-4 w-4 shrink-0 ${
                        isLockedPair ? 'text-[#75FFAE]' : 'text-[#5AD9F5]'
                      }`}
                    />
                  )}
                </button>
              );
            })}
          </div>

          <div className="space-y-2.5">
            {shuffledRightPairs.map((p) => {
              const linkedLeft = Object.entries(value.matchingSelections).find(
                ([, rId]) => rId === p.id
              )?.[0];
              const leftIndex = linkedLeft
                ? question.pairs!.findIndex((x) => x.id === linkedLeft) + 1
                : null;
              const isLockedRight = lockedMatchingPairIds.includes(p.id);
              return (
                <button
                  key={p.id}
                  type="button"
                  disabled={disabled || isLockedRight}
                  onClick={() => {
                    if (!activeLeftId) return;
                    soundEngine.playSfx('terminal');
                    const nextMap = { ...value.matchingSelections };
                    // remove previous binding to this right option
                    for (const [k, v] of Object.entries(nextMap)) {
                      if (v === p.id) delete nextMap[k];
                    }
                    nextMap[activeLeftId] = p.id;
                    onChange({ ...value, matchingSelections: nextMap });
                    setActiveLeftId(null);
                  }}
                  className={`flex min-h-[48px] w-full items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-xs sm:text-sm transition ${
                    isLockedRight
                      ? 'border-[#75FFAE]/50 bg-[#75FFAE]/10 text-[#75FFAE]'
                      : leftIndex
                        ? 'border-[#5AD9F5]/50 bg-[#5AD9F5]/10 text-[#F2F5F3]'
                        : activeLeftId
                          ? 'border-[#75FFAE]/45 bg-[#0B1013] text-[#F2F5F3] hover:bg-[#75FFAE]/10'
                          : 'border-[#223137] bg-[#0B1013] text-[#8A9993]'
                  }`}
                >
                  <span>{p.right[lang]}</span>
                  {leftIndex && (
                    <span className="font-mono text-xs font-bold text-[#75FFAE] shrink-0">
                      #{leftIndex}
                    </span>
                  )}
                </button>
              );
            })}
          </div>
        </div>
      </div>
    );
  }

  // 2. ORDER_STEPS format
  if (question.format === 'ORDER_STEPS' && question.steps) {
    const move = (idx: number, dir: -1 | 1) => {
      const target = idx + dir;
      if (target < 0 || target >= value.orderedIds.length) return;
      soundEngine.playSfx('click');
      const copy = [...value.orderedIds];
      const tmp = copy[idx];
      copy[idx] = copy[target];
      copy[target] = tmp;
      onChange({ ...value, orderedIds: copy });
    };

    return (
      <div className="space-y-3">
        <p className="text-xs text-[#8A9993]">{t.orderHint}</p>
        <div className="space-y-2.5">
          {value.orderedIds.map((id, idx) => {
            const stepObj = question.steps!.find((s) => s.id === id);
            if (!stepObj) return null;
            return (
              <div
                key={id}
                className="flex items-center justify-between gap-3 rounded-xl border border-[#223137] bg-[#0B1013] px-4 py-3"
              >
                <div className="flex items-center gap-3 min-w-0">
                  <span className="font-mono text-xs font-bold text-[#5AD9F5] tabular-nums shrink-0">
                    0{idx + 1}
                  </span>
                  <span className="text-sm text-[#F2F5F3]">{stepObj.text[lang]}</span>
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    type="button"
                    disabled={disabled || idx === 0}
                    onClick={() => move(idx, -1)}
                    aria-label={t.moveUp}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#223137] bg-[#11181B] text-[#8A9993] transition hover:text-[#75FFAE] disabled:opacity-30"
                  >
                    <ArrowUp className="h-4 w-4" />
                  </button>
                  <button
                    type="button"
                    disabled={disabled || idx === value.orderedIds.length - 1}
                    onClick={() => move(idx, 1)}
                    aria-label={t.moveDown}
                    className="flex h-10 w-10 items-center justify-center rounded-lg border border-[#223137] bg-[#11181B] text-[#8A9993] transition hover:text-[#75FFAE] disabled:opacity-30"
                  >
                    <ArrowDown className="h-4 w-4" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      </div>
    );
  }

  // 3. Python DEBUG_MODE fallback inside mixed/boss sessions
  if (question.format === 'DEBUG_MODE' && question.python) {
    const py = question.python;
    return (
      <div className="space-y-4">
        <div className="overflow-x-auto rounded-xl border border-[#223137] bg-[#070A0C] p-4 font-mono text-xs sm:text-sm">
          {py.codeLines.map((line, i) => {
            const lineNum = i + 1;
            const selectable = py.mode === 'find_error_line' && !disabled;
            const isSelected = value.selectedCodeLine === lineNum;
            return (
              <div
                key={lineNum}
                onClick={() => {
                  if (!selectable) return;
                  soundEngine.playSfx('click');
                  onChange({ ...value, selectedCodeLine: lineNum });
                }}
                className={`flex items-center gap-3 rounded px-2 py-1 ${
                  selectable ? 'cursor-pointer hover:bg-[#162126]' : ''
                } ${isSelected ? 'bg-[#FF626C]/20 text-[#FF626C]' : 'text-[#F2F5F3]'}`}
              >
                <span className="w-6 select-none text-right text-[#8A9993] tabular-nums">
                  {lineNum}
                </span>
                <pre className="whitespace-pre">{line}</pre>
              </div>
            );
          })}
        </div>

        {(py.mode === 'predict_output' || py.mode === 'fix_logic') && py.options && (
          <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
            {py.options[lang].map((opt, idx) => {
              const selected = value.selectedIndex === idx;
              const isEliminated = eliminatedOptionIndices.includes(idx);
              return (
                <button
                  key={idx}
                  type="button"
                  disabled={disabled || isEliminated}
                  onClick={() => {
                    soundEngine.playSfx('click');
                    onChange({ ...value, selectedIndex: idx });
                  }}
                  className={`flex min-h-[48px] items-center gap-3 rounded-xl border px-4 py-3 text-left font-mono text-xs sm:text-sm transition ${
                    isEliminated
                      ? 'cursor-not-allowed border-[#1A2226] bg-[#080B0D] text-[#8A9993]/35 line-through opacity-45'
                      : selected
                        ? 'border-[#75FFAE] bg-[#75FFAE]/12 text-[#75FFAE]'
                        : 'border-[#223137] bg-[#0B1013] text-[#F2F5F3] hover:border-[#5AD9F5]/50'
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
        )}

        {py.mode === 'complete_code' && (
          <input
            type="text"
            disabled={disabled}
            value={value.textInput}
            onChange={(e) => onChange({ ...value, textInput: e.target.value })}
            placeholder="range(2, 7, 2)"
            className="min-h-[48px] w-full rounded-xl border border-[#24343B] bg-[#0B1013] px-4 py-3 font-mono text-sm text-[#75FFAE] outline-none focus:border-[#75FFAE]"
          />
        )}
      </div>
    );
  }

  // 4. SQL_TERMINAL fallback inside mixed/boss sessions
  if (question.format === 'SQL_TERMINAL' && question.sql) {
    return (
      <div className="space-y-3">
        <div className="text-xs font-mono text-[#8A9993]">
          {lang === 'kk' ? 'Кестелер:' : 'Таблицы:'} students(id, name, city, grade, track) · courses(id, title, module_code, credits) · results(id, student_id, course_id, score)
        </div>
        <textarea
          rows={3}
          disabled={disabled}
          value={value.sqlQuery}
          onChange={(e) => onChange({ ...value, sqlQuery: e.target.value })}
          placeholder="SELECT ..."
          className="w-full rounded-xl border border-[#24343B] bg-[#070A0C] p-3.5 font-mono text-xs sm:text-sm text-[#75FFAE] outline-none focus:border-[#75FFAE]"
        />
      </div>
    );
  }

  // 5. Text Input / Data Recovery / Code Breaker input
  if (question.acceptedAnswers && question.acceptedAnswers.length > 0) {
    return (
      <div className="space-y-2">
        <div className="flex items-center gap-2">
          <input
            type="text"
            disabled={disabled}
            value={value.textInput}
            onChange={(e) => onChange({ ...value, textInput: e.target.value })}
            placeholder={
              question.inputPlaceholder?.[lang] ?? UI_TEXT[lang].gameplay.typeAnswer
            }
            className="min-h-[48px] flex-1 rounded-xl border border-[#24343B] bg-[#0B1013] px-4 py-3 font-mono text-base text-[#F2F5F3] placeholder-[#8A9993]/55 outline-none transition focus:border-[#75FFAE] focus:ring-2 focus:ring-[#75FFAE]/20"
          />
          {question.inputUnit && (
            <span className="font-mono text-sm text-[#5AD9F5] shrink-0">
              {question.inputUnit[lang]}
            </span>
          )}
        </div>
      </div>
    );
  }

  // 6. Standard Choice (QUICK_TEST, LOGIC_PUZZLE, CODE_BREAKER choice)
  if (question.options) {
    return (
      <div className="grid grid-cols-1 gap-2.5 sm:grid-cols-2">
        {question.options[lang].map((opt, idx) => {
          const selected = value.selectedIndex === idx;
          const isEliminated = eliminatedOptionIndices.includes(idx);
          return (
            <button
              key={idx}
              type="button"
              disabled={disabled || isEliminated}
              onClick={() => {
                soundEngine.playSfx('click');
                onChange({ ...value, selectedIndex: idx });
              }}
              className={`flex min-h-[52px] items-center justify-between gap-3 rounded-xl border px-4 py-3 text-left text-sm transition ${
                isEliminated
                  ? 'cursor-not-allowed border-[#1A2226] bg-[#080B0D] text-[#8A9993]/35 line-through opacity-45'
                  : selected
                    ? 'border-[#75FFAE] bg-[#75FFAE]/12 text-[#F2F5F3]'
                    : 'border-[#223137] bg-[#0B1013] text-[#F2F5F3] hover:border-[#5AD9F5]/45'
              }`}
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-md font-mono text-xs font-bold ${
                    isEliminated
                      ? 'bg-[#111619] text-[#8A9993]/40'
                      : selected
                        ? 'bg-[#75FFAE] text-[#080B0D]'
                        : 'bg-[#162025] text-[#5AD9F5]'
                  }`}
                >
                  {String.fromCharCode(65 + idx)}
                </span>
                <span className="leading-snug">{opt}</span>
              </div>
              {selected && !isEliminated && <Check className="h-4 w-4 shrink-0 text-[#75FFAE]" />}
            </button>
          );
        })}
      </div>
    );
  }

  return null;
};
