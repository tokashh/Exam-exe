export type Language = 'ru' | 'kk';

export type ScreenId =
  | 'start'
  | 'dashboard'
  | 'missions'
  | 'gameplay'
  | 'python-lab'
  | 'sql-terminal'
  | 'results'
  | 'profile'
  | 'analytics'
  | 'achievements'
  | 'settings'
  | 'final-boss';

export type ModuleId =
  | 'binary-core'
  | 'data-vault'
  | 'logic-engine'
  | 'python-lab'
  | 'data-matrix'
  | 'network-protocol';

export type QuestionFormat =
  | 'QUICK_TEST'
  | 'CODE_BREAKER'
  | 'DEBUG_MODE'
  | 'SQL_TERMINAL'
  | 'LOGIC_PUZZLE'
  | 'DATA_RECOVERY'
  | 'MATCHING'
  | 'ORDER_STEPS'
  | 'TEXT_INPUT';

export type Difficulty = 'beginner' | 'intermediate' | 'advanced';

export interface LocalizedText {
  ru: string;
  kk: string;
}

export interface LocalizedList {
  ru: string[];
  kk: string[];
}

export interface MatchingPair {
  id: string;
  left: LocalizedText;
  right: LocalizedText;
}

export interface PythonChallengeConfig {
  mode: 'predict_output' | 'find_error_line' | 'complete_code' | 'fix_logic';
  codeLines: string[];
  bugLine?: number; // 1-indexed
  missingLineIndex?: number; // 1-indexed
  options?: LocalizedList;
  correctOptionIndex?: number;
  acceptedTextAnswers?: string[];
  expectedConsoleOutput: string;
}

export interface SqlChallengeConfig {
  starterQuery: string;
  requiredPatterns: string[]; // case-insensitive substrings or regex markers
  expectedRowCount?: number;
  expectedColumns?: string[];
  expectedFirstCell?: string | number;
  expectedValues?: Array<string | number>;
  isMutationPreview?: boolean;
  referenceQuery: string;
}

export interface Question {
  id: string;
  moduleId: ModuleId;
  order: number;
  format: QuestionFormat;
  difficulty: Difficulty;
  topicTag: LocalizedText;
  isBossChallenge?: boolean; // module final challenge
  xpReward: number;
  timeLimitSec?: number;
  title: LocalizedText;
  prompt: LocalizedText;
  hint: LocalizedText;
  explanation: LocalizedText;
  solutionDisplay: LocalizedText;

  // For QUICK_TEST, LOGIC_PUZZLE, CODE_BREAKER (choice variant)
  options?: LocalizedList;
  correctIndex?: number;

  // For TEXT_INPUT, DATA_RECOVERY, CODE_BREAKER (input variant)
  acceptedAnswers?: string[];
  inputPlaceholder?: LocalizedText;
  inputUnit?: LocalizedText;

  // For MATCHING
  pairs?: MatchingPair[];

  // For ORDER_STEPS
  steps?: { id: string; text: LocalizedText }[];
  correctOrder?: string[]; // step IDs in correct sequence

  // For DEBUG_MODE (Python Lab)
  python?: PythonChallengeConfig;

  // For SQL_TERMINAL (Data Matrix)
  sql?: SqlChallengeConfig;
}

export interface ModuleDefinition {
  id: ModuleId;
  code: string;
  order: number;
  title: LocalizedText;
  subtitle: LocalizedText;
  description: LocalizedText;
  finalChallengeTitle: LocalizedText;
  accentColor: 'green' | 'cyan';
}

export type RankId =
  | 'rookie'
  | 'analyst'
  | 'developer'
  | 'architect'
  | 'system_master';

export interface RankDefinition {
  id: RankId;
  minXp: number;
  level: number;
  title: LocalizedText;
}

export type AchievementId =
  | 'first_boot'
  | 'binary_master'
  | 'debugger'
  | 'sql_architect'
  | 'perfect_run'
  | 'system_restored'
  | 'final_operator';

export type BoosterId = 'double_xp_10s' | 'second_chance' | 'fifty_fifty';

export interface BoosterInventory {
  double_xp_10s: number;
  second_chance: number;
  fifty_fifty: number;
}

export interface AchievementDefinition {
  id: AchievementId;
  title: LocalizedText;
  description: LocalizedText;
  xpBonus: number;
}

export interface AnswerRecord {
  questionId: string;
  moduleId: ModuleId;
  topicRu: string;
  topicKk: string;
  format: QuestionFormat;
  isCorrect: boolean;
  timestamp: number;
  isFinalBoss?: boolean;
}

export interface SimulationResult {
  id: string;
  timestamp: number;
  score: number;
  total: number;
  accuracy: number;
  durationSec: number;
  outcome: 'restored' | 'partial' | 'failed';
  weakModules: ModuleId[];
}

export interface PlayerSettings {
  language: Language;
  musicEnabled: boolean;
  sfxEnabled: boolean;
  musicVolume: number;
  sfxVolume: number;
  reducedMotion: boolean;
  backgroundAnimations: boolean;
}

export interface PlayerProgress {
  nickname: string;
  hasBooted: boolean;
  xp: number;
  completedQuestionIds: string[];
  completedModules: ModuleId[];
  unlockedAchievements: AchievementId[];
  answerHistory: AnswerRecord[];
  lastDailyMissionDate: string | null; // YYYY-MM-DD
  dailyMissionQuestionId: string | null;
  simulationResults: SimulationResult[];
  boosters: BoosterInventory;
  settings: PlayerSettings;
}

export interface SessionRunSummary {
  mode: 'module' | 'single' | 'daily';
  moduleId?: ModuleId;
  totalQuestions: number;
  correctCount: number;
  xpEarned: number;
  accuracy: number;
  perfectRun: boolean;
  previousRankId: RankId;
  newRankId: RankId;
  newlyUnlockedAchievements: AchievementId[];
  reviewedAnswers: Array<{
    question: Question;
    isCorrect: boolean;
    userSummary: string;
  }>;
}
