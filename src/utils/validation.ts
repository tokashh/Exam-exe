import { executeLocalSql, SqlExecutionResult } from '../data/sqlDatabase';
import { Language, Question } from '../types/game';

export function normalizeAnswerText(val: string): string {
  return val
    .trim()
    .toLowerCase()
    .replace(/\s+/g, ' ')
    .replace(/^['"`]|['"`]$/g, '');
}

export interface ValidationOutcome {
  isCorrect: boolean;
  userSummary: string;
  sqlResult?: SqlExecutionResult;
}

export function validateQuestionSubmission(
  question: Question,
  lang: Language,
  payload: {
    selectedIndex?: number | null;
    textInput?: string;
    matchingSelections?: Record<string, string>;
    orderedIds?: string[];
    selectedCodeLine?: number | null;
    sqlQuery?: string;
  }
): ValidationOutcome {
  // 1. Python Lab (DEBUG_MODE)
  if (question.format === 'DEBUG_MODE' && question.python) {
    const py = question.python;
    if (py.mode === 'predict_output' || py.mode === 'fix_logic') {
      const idx = payload.selectedIndex ?? -1;
      const chosenLabel =
        idx >= 0 && py.options ? py.options[lang][idx] ?? String(idx) : '—';
      return {
        isCorrect: idx === py.correctOptionIndex,
        userSummary: chosenLabel,
      };
    }
    if (py.mode === 'find_error_line') {
      const line = payload.selectedCodeLine ?? -1;
      return {
        isCorrect: line === py.bugLine,
        userSummary: line > 0 ? `Line ${line}` : '—',
      };
    }
    if (py.mode === 'complete_code') {
      const raw = (payload.textInput ?? '').trim();
      const compact = raw.replace(/\s+/g, '').toLowerCase();
      const accepted = (py.acceptedTextAnswers ?? []).some(
        (ans) => ans.replace(/\s+/g, '').toLowerCase() === compact
      );
      return {
        isCorrect: accepted,
        userSummary: raw || '—',
      };
    }
  }

  // 2. SQL Terminal
  if (question.format === 'SQL_TERMINAL' && question.sql) {
    const query = (payload.sqlQuery ?? '').trim();
    const res = executeLocalSql(query);
    if (!res.ok) {
      return { isCorrect: false, userSummary: query || '—', sqlResult: res };
    }
    const lowerQ = query.toLowerCase().replace(/\s+/g, ' ');
    const patternsMatch = question.sql.requiredPatterns.every((pat) =>
      lowerQ.includes(pat.toLowerCase())
    );
    let resultMatch = true;
    if (
      question.sql.expectedRowCount !== undefined &&
      res.rows.length !== question.sql.expectedRowCount
    ) {
      resultMatch = false;
    }
    if (question.sql.expectedFirstCell !== undefined) {
      const firstRow = res.rows[0];
      const firstVal = firstRow ? Object.values(firstRow)[0] : undefined;
      if (String(firstVal) !== String(question.sql.expectedFirstCell)) {
        resultMatch = false;
      }
    }
    if (question.sql.isMutationPreview && (res.affectedCount ?? 0) === 0) {
      resultMatch = false;
    }
    return {
      isCorrect: patternsMatch && resultMatch,
      userSummary: query,
      sqlResult: res,
    };
  }

  // 3. Matching
  if (question.format === 'MATCHING' && question.pairs) {
    const map = payload.matchingSelections ?? {};
    const allMatched = question.pairs.every((p) => map[p.id] === p.id);
    const matchedCount = question.pairs.filter((p) => map[p.id] === p.id).length;
    return {
      isCorrect: allMatched,
      userSummary: `${matchedCount}/${question.pairs.length}`,
    };
  }

  // 4. Order Steps
  if (question.format === 'ORDER_STEPS' && question.correctOrder) {
    const ids = payload.orderedIds ?? [];
    const isCorrect =
      ids.length === question.correctOrder.length &&
      ids.every((id, idx) => id === question.correctOrder![idx]);
    return {
      isCorrect,
      userSummary: ids.join(' → '),
    };
  }

  // 5. Text / Data Recovery / Code Breaker input
  if (question.acceptedAnswers && question.acceptedAnswers.length > 0) {
    const normalized = normalizeAnswerText(payload.textInput ?? '');
    const isCorrect = question.acceptedAnswers.some(
      (a) => normalizeAnswerText(a) === normalized
    );
    return {
      isCorrect,
      userSummary: (payload.textInput ?? '').trim() || '—',
    };
  }

  // 6. Standard Choice (QUICK_TEST, LOGIC_PUZZLE, CODE_BREAKER choice)
  if (question.options && question.correctIndex !== undefined) {
    const idx = payload.selectedIndex ?? -1;
    const label =
      idx >= 0 ? question.options[lang][idx] ?? String(idx) : '—';
    return {
      isCorrect: idx === question.correctIndex,
      userSummary: label,
    };
  }

  return { isCorrect: false, userSummary: '—' };
}
