import { ALL_QUESTIONS, getModuleQuestions } from '../data/finalBossPool';
import { ACHIEVEMENTS, getRankForXp, MODULES } from '../data/ranksAndAchievements';
import {
  AchievementId,
  AnswerRecord,
  Language,
  ModuleId,
  PlayerProgress,
  PlayerSettings,
  Question,
} from '../types/game';

const STORAGE_KEY = 'exam_exe_save_v1';

export function getTodayDateKey(): string {
  const now = new Date();
  const y = now.getFullYear();
  const m = String(now.getMonth() + 1).padStart(2, '0');
  const d = String(now.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function detectPreferredLanguage(): Language {
  if (typeof window !== 'undefined') {
    const params = new URLSearchParams(window.location.search);
    const urlLang = params.get('lang');
    if (urlLang === 'kk' || urlLang === 'ru') return urlLang;
    if (window.navigator?.language?.toLowerCase().startsWith('kk')) return 'kk';
  }
  return 'ru';
}

export function getDefaultSettings(): PlayerSettings {
  const prefersReduced =
    typeof window !== 'undefined' &&
    window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
  return {
    language: detectPreferredLanguage(),
    musicEnabled: true,
    sfxEnabled: true,
    musicVolume: 0.45,
    sfxVolume: 0.65,
    reducedMotion: Boolean(prefersReduced),
    backgroundAnimations: true,
  };
}

export function getDefaultBoosters() {
  return {
    double_xp_10s: 3,
    second_chance: 3,
    fifty_fifty: 3,
  };
}

export function createInitialProgress(lang?: Language): PlayerProgress {
  const settings = getDefaultSettings();
  if (lang) settings.language = lang;
  return {
    nickname: '',
    hasBooted: false,
    xp: 0,
    completedQuestionIds: [],
    completedModules: [],
    unlockedAchievements: [],
    answerHistory: [],
    lastDailyMissionDate: null,
    dailyMissionQuestionId: null,
    simulationResults: [],
    boosters: getDefaultBoosters(),
    settings,
  };
}

export function loadProgress(): PlayerProgress {
  const fallback = createInitialProgress();
  try {
    const urlLang =
      typeof window !== 'undefined'
        ? new URLSearchParams(window.location.search).get('lang')
        : null;
    const raw = localStorage.getItem(STORAGE_KEY);
    if (!raw) return fallback;
    const parsed = JSON.parse(raw) as Partial<PlayerProgress>;
    if (!parsed || typeof parsed !== 'object') return fallback;

    const defaults = getDefaultSettings();
    const s = parsed.settings ?? defaults;
    const resolvedLang: Language =
      urlLang === 'kk' || urlLang === 'ru'
        ? urlLang
        : s.language === 'kk'
          ? 'kk'
          : 'ru';

    return {
      nickname: typeof parsed.nickname === 'string' ? parsed.nickname : '',
      hasBooted: Boolean(parsed.hasBooted),
      xp: typeof parsed.xp === 'number' && Number.isFinite(parsed.xp) ? Math.max(0, parsed.xp) : 0,
      completedQuestionIds: Array.isArray(parsed.completedQuestionIds)
        ? parsed.completedQuestionIds.filter((x): x is string => typeof x === 'string')
        : [],
      completedModules: Array.isArray(parsed.completedModules)
        ? parsed.completedModules.filter((x): x is ModuleId => typeof x === 'string')
        : [],
      unlockedAchievements: Array.isArray(parsed.unlockedAchievements)
        ? parsed.unlockedAchievements.filter((x): x is AchievementId => typeof x === 'string')
        : [],
      answerHistory: Array.isArray(parsed.answerHistory)
        ? parsed.answerHistory.filter((x): x is AnswerRecord => Boolean(x && x.questionId))
        : [],
      lastDailyMissionDate:
        typeof parsed.lastDailyMissionDate === 'string' ? parsed.lastDailyMissionDate : null,
      dailyMissionQuestionId:
        typeof parsed.dailyMissionQuestionId === 'string' ? parsed.dailyMissionQuestionId : null,
      simulationResults: Array.isArray(parsed.simulationResults) ? parsed.simulationResults : [],
      boosters: {
        double_xp_10s:
          typeof parsed.boosters?.double_xp_10s === 'number'
            ? Math.max(0, parsed.boosters.double_xp_10s)
            : 3,
        second_chance:
          typeof parsed.boosters?.second_chance === 'number'
            ? Math.max(0, parsed.boosters.second_chance)
            : 3,
        fifty_fifty:
          typeof parsed.boosters?.fifty_fifty === 'number'
            ? Math.max(0, parsed.boosters.fifty_fifty)
            : 3,
      },
      settings: {
        language: resolvedLang,
        musicEnabled: typeof s.musicEnabled === 'boolean' ? s.musicEnabled : defaults.musicEnabled,
        sfxEnabled: typeof s.sfxEnabled === 'boolean' ? s.sfxEnabled : defaults.sfxEnabled,
        musicVolume:
          typeof s.musicVolume === 'number' ? Math.max(0, Math.min(1, s.musicVolume)) : defaults.musicVolume,
        sfxVolume:
          typeof s.sfxVolume === 'number' ? Math.max(0, Math.min(1, s.sfxVolume)) : defaults.sfxVolume,
        reducedMotion:
          typeof s.reducedMotion === 'boolean' ? s.reducedMotion : defaults.reducedMotion,
        backgroundAnimations:
          typeof s.backgroundAnimations === 'boolean'
            ? s.backgroundAnimations
            : defaults.backgroundAnimations,
      },
    };
  } catch {
    return fallback;
  }
}

export function saveProgress(progress: PlayerProgress): void {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(progress));
  } catch {
    // ignore storage quota errors
  }
}

export function clearProgress(): PlayerProgress {
  try {
    localStorage.removeItem(STORAGE_KEY);
  } catch {
    // ignore
  }
  return createInitialProgress();
}

export function getDailyMissionQuestion(progress: PlayerProgress): Question {
  const today = getTodayDateKey();
  // Deterministic index based on YYYY-MM-DD so same day gives consistent mission offline
  const seed = today.split('').reduce((acc, ch) => acc + ch.charCodeAt(0) * 31, 0);
  const nonBossQuestions = ALL_QUESTIONS.filter((q) => !q.isBossChallenge);
  const picked = nonBossQuestions[seed % nonBossQuestions.length] ?? ALL_QUESTIONS[0];
  if (
    progress.lastDailyMissionDate === today &&
    progress.dailyMissionQuestionId
  ) {
    const found = ALL_QUESTIONS.find((q) => q.id === progress.dailyMissionQuestionId);
    if (found) return found;
  }
  return picked;
}

export function recomputeProgressionAndAchievements(
  prev: PlayerProgress,
  opts?: { perfectRunTriggered?: boolean; finalSimPassed?: boolean }
): { next: PlayerProgress; newlyUnlocked: AchievementId[] } {
  const completedSet = new Set(prev.completedQuestionIds);
  const completedModulesSet = new Set<ModuleId>(prev.completedModules);

  for (const mod of MODULES) {
    const modQuestions = getModuleQuestions(mod.id);
    if (modQuestions.length > 0 && modQuestions.every((q) => completedSet.has(q.id))) {
      completedModulesSet.add(mod.id);
    }
  }

  const unlockedSet = new Set<AchievementId>(prev.unlockedAchievements);
  const newlyUnlocked: AchievementId[] = [];

  const tryUnlock = (id: AchievementId, condition: boolean) => {
    if (condition && !unlockedSet.has(id)) {
      unlockedSet.add(id);
      newlyUnlocked.push(id);
    }
  };

  tryUnlock('first_boot', prev.hasBooted && prev.nickname.trim().length > 0);
  tryUnlock('binary_master', completedModulesSet.has('binary-core'));

  const debugSolvedCount = new Set(
    prev.answerHistory
      .filter((a) => a.isCorrect && a.format === 'DEBUG_MODE')
      .map((a) => a.questionId)
  ).size;
  const totalCorrectDebugAttempts = prev.answerHistory.filter(
    (a) => a.isCorrect && a.format === 'DEBUG_MODE'
  ).length;
  tryUnlock('debugger', debugSolvedCount >= 10 || totalCorrectDebugAttempts >= 10);

  tryUnlock('sql_architect', completedModulesSet.has('data-matrix'));
  tryUnlock('perfect_run', Boolean(opts?.perfectRunTriggered));
  tryUnlock(
    'system_restored',
    MODULES.every((m) => completedModulesSet.has(m.id))
  );
  tryUnlock(
    'final_operator',
    Boolean(opts?.finalSimPassed) ||
      prev.simulationResults.some((r) => r.accuracy >= 80)
  );

  let bonusXp = 0;
  for (const id of newlyUnlocked) {
    const def = ACHIEVEMENTS.find((a) => a.id === id);
    if (def) bonusXp += def.xpBonus;
  }

  return {
    next: {
      ...prev,
      xp: prev.xp + bonusXp,
      completedModules: Array.from(completedModulesSet),
      unlockedAchievements: Array.from(unlockedSet),
    },
    newlyUnlocked,
  };
}

export interface ModuleAnalytics {
  moduleId: ModuleId;
  attempts: number;
  correct: number;
  incorrect: number;
  accuracy: number;
  completedCount: number;
  totalCount: number;
  weakTopics: Array<{ ru: string; kk: string; errors: number }>;
  recommendedQuestions: Question[];
}

export function computePerformanceAnalysis(progress: PlayerProgress): {
  overallAccuracy: number;
  totalAttempts: number;
  totalErrors: number;
  moduleStats: ModuleAnalytics[];
  topRecommended: Question[];
} {
  const totalAttempts = progress.answerHistory.length;
  const totalCorrect = progress.answerHistory.filter((a) => a.isCorrect).length;
  const totalErrors = totalAttempts - totalCorrect;
  const overallAccuracy =
    totalAttempts > 0 ? Math.round((totalCorrect / totalAttempts) * 100) : 0;

  const completedSet = new Set(progress.completedQuestionIds);

  const moduleStats: ModuleAnalytics[] = MODULES.map((mod) => {
    const modRecords = progress.answerHistory.filter((r) => r.moduleId === mod.id);
    const modCorrect = modRecords.filter((r) => r.isCorrect).length;
    const modErrors = modRecords.length - modCorrect;
    const accuracy =
      modRecords.length > 0 ? Math.round((modCorrect / modRecords.length) * 100) : 0;

    const topicErrorMap = new Map<string, { ru: string; kk: string; errors: number }>();
    const failedQuestionIds = new Set<string>();

    for (const r of modRecords) {
      if (!r.isCorrect) {
        failedQuestionIds.add(r.questionId);
        const key = r.topicRu;
        const cur = topicErrorMap.get(key) ?? {
          ru: r.topicRu,
          kk: r.topicKk,
          errors: 0,
        };
        cur.errors += 1;
        topicErrorMap.set(key, cur);
      }
    }

    const modQuestions = getModuleQuestions(mod.id);
    const completedCount = modQuestions.filter((q) => completedSet.has(q.id)).length;

    const weakTopics = Array.from(topicErrorMap.values()).sort(
      (a, b) => b.errors - a.errors
    );

    const recommendedQuestions = modQuestions.filter(
      (q) => failedQuestionIds.has(q.id) || !completedSet.has(q.id)
    );

    return {
      moduleId: mod.id,
      attempts: modRecords.length,
      correct: modCorrect,
      incorrect: modErrors,
      accuracy,
      completedCount,
      totalCount: modQuestions.length,
      weakTopics,
      recommendedQuestions: recommendedQuestions.slice(0, 3),
    };
  });

  const topRecommended: Question[] = [];
  for (const ms of [...moduleStats].sort((a, b) => b.incorrect - a.incorrect)) {
    for (const q of ms.recommendedQuestions) {
      if (!topRecommended.some((x) => x.id === q.id)) {
        topRecommended.push(q);
      }
      if (topRecommended.length >= 6) break;
    }
    if (topRecommended.length >= 6) break;
  }

  return {
    overallAccuracy,
    totalAttempts,
    totalErrors,
    moduleStats,
    topRecommended,
  };
}

export function getPlayerLevelInfo(xp: number) {
  return getRankForXp(xp);
}
