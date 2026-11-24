import React from 'react';
import {
  Award,
  Calendar,
  ChevronRight,
  Cpu,
  Lock,
  Play,
  Shield,
  ShieldAlert,
  Terminal,
  Scissors,
  Zap,
} from 'lucide-react';
import { AnimatedNumber } from '../components/AnimatedNumber';
import { CyberIllustration } from '../components/CyberIllustration';
import { PWAInstallButton, ShareGameButton } from '../components/PWAInstallButton';
import { getModuleQuestions } from '../data/finalBossPool';
import {
  ACHIEVEMENTS,
  getNextRank,
  getRankForXp,
  MODULES,
} from '../data/ranksAndAchievements';
import { UI_TEXT } from '../i18n/translations';
import {
  Language,
  ModuleId,
  PlayerProgress,
  Question,
  ScreenId,
} from '../types/game';
import {
  computePerformanceAnalysis,
  getDailyMissionQuestion,
  getTodayDateKey,
} from '../utils/storage';
import { soundEngine } from '../audio/soundEngine';

interface DashboardScreenProps {
  progress: PlayerProgress;
  lang: Language;
  onChangeLang: (lang: Language) => void;
  onNavigate: (screen: ScreenId) => void;
  onStartModule: (moduleId: ModuleId) => void;
  onStartDaily: (question: Question) => void;
}

export const DashboardScreen: React.FC<DashboardScreenProps> = ({
  progress,
  lang,
  onChangeLang,
  onNavigate,
  onStartModule,
  onStartDaily,
}) => {
  const t = UI_TEXT[lang].dashboard;
  const rank = getRankForXp(progress.xp);
  const nextRank = getNextRank(rank.id);
  const analytics = computePerformanceAnalysis(progress);

  const xpIntoRank = progress.xp - rank.minXp;
  const xpSpan = nextRank ? nextRank.minXp - rank.minXp : 1;
  const rankPct = nextRank
    ? Math.min(100, Math.round((xpIntoRank / xpSpan) * 100))
    : 100;

  const todayKey = getTodayDateKey();
  const dailyCompleted = progress.lastDailyMissionDate === todayKey;
  const dailyQuestion = getDailyMissionQuestion(progress);

  // Pick next incomplete module for Continue CTA
  const nextModule =
    MODULES.find((m) => !progress.completedModules.includes(m.id)) ?? MODULES[0];

  const allModulesDone = MODULES.every((m) =>
    progress.completedModules.includes(m.id)
  );

  const recentUnlocked = ACHIEVEMENTS.filter((a) =>
    progress.unlockedAchievements.includes(a.id)
  ).slice(-3);

  const bT = UI_TEXT[lang].boosters;

  return (
    <div className="space-y-6">
      {/* Top Hero Operator Card with Cyber Core Artwork */}
      <section className="overflow-hidden rounded-2xl border border-[#1E2C30] bg-[#11181B]/90">
        <div className="relative h-36 w-full sm:h-44">
          <CyberIllustration
            src="/src/assets/images/hero_cyber_core_1795428069177.jpg"
            alt="EXAM.exe Neural Core"
            eager
            accent="green"
            fallbackLabel="EXAM.exe // NEURAL CORE"
            className="h-full w-full"
            scrimClassName="bg-gradient-to-t from-[#11181B] via-[#11181B]/55 to-transparent"
          />
          <div className="absolute bottom-3 left-5 right-5 flex flex-wrap items-center justify-between gap-2 text-xs font-mono">
            <span className="text-[#75FFAE] font-semibold">
              EXAM.exe // {rank.title[lang]}
            </span>
            <span className="text-[#8A9993] tabular-nums">
              {t.completedMissions}: {progress.completedModules.length}/{MODULES.length}
            </span>
          </div>
        </div>
        <div className="p-5 sm:p-6">
        <div className="flex flex-col gap-5 lg:flex-row lg:items-center lg:justify-between">
          <div className="space-y-2">
            <div className="flex flex-wrap items-center gap-2 text-xs font-mono text-[#8A9993]">
              <span>{t.welcome}</span>
              <span aria-hidden="true">·</span>
              <span className="text-[#5AD9F5]">{rank.title[lang]}</span>
              <span aria-hidden="true">·</span>
              <span className="tabular-nums">
                {t.level} {String(rank.level).padStart(2, '0')}
              </span>
            </div>
            <h1 className="font-display text-2xl font-bold tracking-tight text-[#F2F5F3] sm:text-3xl">
              {progress.nickname}
            </h1>

            {/* Rank Progress Bar */}
            <div className="max-w-md pt-1">
              <div className="flex items-center justify-between text-xs text-[#8A9993]">
                <span>
                  {nextRank
                    ? `${t.nextRank}: ${nextRank.title[lang]}`
                    : t.maxRank}
                </span>
                <span className="font-mono text-[#75FFAE] tabular-nums">
                  {nextRank
                    ? `${progress.xp} / ${nextRank.minXp} XP`
                    : `${progress.xp} XP`}
                </span>
              </div>
              <div className="mt-1.5 h-2 w-full overflow-hidden rounded-full bg-[#080B0D]">
                <div
                  className="h-full rounded-full bg-gradient-to-r from-[#5AD9F5] to-[#75FFAE] transition-all duration-500"
                  style={{ width: `${rankPct}%` }}
                />
              </div>
            </div>
          </div>

          <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSfx('click');
                onStartModule(nextModule.id);
              }}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl bg-[#75FFAE] px-5 py-3 font-display text-sm font-bold text-[#080B0D] transition hover:bg-[#8BFFBA] active:scale-[0.98] whitespace-nowrap"
            >
              <Play className="h-4 w-4 fill-current" />
              <span>{t.continueMission}</span>
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playSfx('click');
                onNavigate('python-lab');
              }}
              className="inline-flex min-h-[48px] items-center justify-center gap-2 rounded-xl border border-[#26373E] bg-[#0B1013] px-4 py-3 text-sm font-medium text-[#F2F5F3] transition hover:border-[#5AD9F5]/60 hover:text-[#5AD9F5] whitespace-nowrap"
            >
              <Terminal className="h-4 w-4" />
              <span>{lang === 'kk' ? 'Python Зертхана' : 'Python Lab'}</span>
            </button>
          </div>
        </div>

        <div className="mt-4 flex flex-wrap items-center gap-2.5">
          <ShareGameButton lang={lang} variant="primary" />
          <PWAInstallButton lang={lang} compact />
          <div className="flex items-center gap-1 rounded-xl border border-[#24343B] bg-[#0B1013] p-1">
            <button
              type="button"
              onClick={() => {
                soundEngine.playSfx('click');
                onChangeLang('kk');
              }}
              className={`min-h-[34px] rounded-lg px-2.5 text-xs font-semibold transition ${
                lang === 'kk'
                  ? 'bg-[#75FFAE] text-[#080B0D]'
                  : 'text-[#8A9993] hover:text-[#F2F5F3]'
              }`}
            >
              ҚАЗ
            </button>
            <button
              type="button"
              onClick={() => {
                soundEngine.playSfx('click');
                onChangeLang('ru');
              }}
              className={`min-h-[34px] rounded-lg px-2.5 text-xs font-semibold transition ${
                lang === 'ru'
                  ? 'bg-[#75FFAE] text-[#080B0D]'
                  : 'text-[#8A9993] hover:text-[#F2F5F3]'
              }`}
            >
              РУС
            </button>
          </div>
        </div>

        {/* 4 Key Metrics Strip */}
        <div className="mt-6 grid grid-cols-2 gap-3 border-t border-[#1B272C] pt-5 sm:grid-cols-4">
          <div>
            <div className="text-xs text-[#8A9993]">{t.totalXp}</div>
            <div className="mt-1 font-mono text-xl font-bold text-[#75FFAE]">
              <AnimatedNumber value={progress.xp} />
            </div>
          </div>
          <div>
            <div className="text-xs text-[#8A9993]">{t.completedMissions}</div>
            <div className="mt-1 font-mono text-xl font-bold text-[#F2F5F3] tabular-nums">
              {progress.completedModules.length} / {MODULES.length}
            </div>
          </div>
          <div>
            <div className="text-xs text-[#8A9993]">{t.accuracy}</div>
            <div className="mt-1 font-mono text-xl font-bold text-[#5AD9F5] tabular-nums">
              {analytics.overallAccuracy}%
            </div>
          </div>
          <div>
            <div className="text-xs text-[#8A9993]">{t.rank}</div>
            <div className="mt-1 font-display text-xl font-bold text-[#F2F5F3] truncate">
              {rank.title[lang]}
            </div>
          </div>
        </div>

        {/* Booster Inventory Strip */}
        <div className="mt-4 flex flex-wrap items-center justify-between gap-3 border-t border-[#1B272C] pt-4 text-xs">
          <span className="font-mono text-[#8A9993]">{bT.inventoryLabel}:</span>
          <div className="flex flex-wrap items-center gap-4 font-mono">
            <span className="flex items-center gap-1.5 text-[#75FFAE]">
              <Zap className="h-3.5 w-3.5" />
              <span>{bT.doubleXpName}</span>
              <strong className="tabular-nums">×{progress.boosters.double_xp_10s}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-[#5AD9F5]">
              <Shield className="h-3.5 w-3.5" />
              <span>{bT.secondChanceName}</span>
              <strong className="tabular-nums">×{progress.boosters.second_chance}</strong>
            </span>
            <span className="flex items-center gap-1.5 text-[#F5B85A]">
              <Scissors className="h-3.5 w-3.5" />
              <span>{bT.fiftyFiftyName}</span>
              <strong className="tabular-nums">×{progress.boosters.fifty_fifty}</strong>
            </span>
          </div>
        </div>
        </div>
      </section>

      {/* Six Core Modules Grid */}
      <section>
        <div className="mb-3 flex items-center justify-between">
          <h2 className="font-display text-lg font-semibold text-[#F2F5F3]">
            {t.modulesTitle}
          </h2>
          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              onNavigate('missions');
            }}
            className="text-xs font-medium text-[#5AD9F5] hover:underline"
          >
            {UI_TEXT[lang].missions.title} →
          </button>
        </div>

        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {MODULES.map((mod) => {
            const qs = getModuleQuestions(mod.id);
            const doneCount = qs.filter((q) =>
              progress.completedQuestionIds.includes(q.id)
            ).length;
            const pct = qs.length > 0 ? Math.round((doneCount / qs.length) * 100) : 0;
            const isDone = progress.completedModules.includes(mod.id);
            const isGreen = mod.accentColor === 'green';
            const modImg =
              mod.order <= 3
                ? '/src/assets/images/module_binary_logic_1795428069389.jpg'
                : '/src/assets/images/module_code_matrix_1795428069019.jpg';

            return (
              <button
                key={mod.id}
                type="button"
                onClick={() => {
                  soundEngine.playSfx('click');
                  onStartModule(mod.id);
                }}
                className="group flex flex-col justify-between overflow-hidden rounded-xl border border-[#1E2C30] bg-[#11181B]/85 text-left transition hover:border-[#5AD9F5]/50 hover:bg-[#141E22] active:scale-[0.99]"
              >
                <div>
                  <CyberIllustration
                    src={modImg}
                    alt={mod.title[lang]}
                    accent={isGreen ? 'green' : 'cyan'}
                    fallbackLabel={`MODULE ${mod.code}`}
                    className="h-24 w-full"
                    imgClassName="transition duration-300 group-hover:scale-105"
                    scrimClassName="bg-gradient-to-t from-[#11181B] via-[#11181B]/35 to-transparent"
                  />
                  <div className="px-5 pt-3">
                  <div className="flex items-center justify-between text-xs font-mono">
                    <span className={isGreen ? 'text-[#75FFAE]' : 'text-[#5AD9F5]'}>
                      {lang === 'kk' ? 'МОДУЛЬ' : 'МОДУЛЬ'} {mod.code}
                    </span>
                    <span className="text-[#8A9993] tabular-nums">
                      {doneCount}/{qs.length}
                    </span>
                  </div>
                  <h3 className="mt-2 font-display text-lg font-bold text-[#F2F5F3] group-hover:text-[#75FFAE] transition-colors">
                    {mod.title[lang]}
                  </h3>
                  <div className="text-xs font-medium text-[#5AD9F5]">
                    {mod.subtitle[lang]}
                  </div>
                  <p className="mt-2 text-xs leading-relaxed text-[#8A9993]">
                    {mod.description[lang]}
                  </p>
                  </div>
                </div>

                <div className="mx-5 mb-5 mt-4 pt-3 border-t border-[#1A252A]">
                  <div className="flex items-center justify-between text-xs">
                    <span className={isDone ? 'text-[#75FFAE] font-medium' : 'text-[#8A9993]'}>
                      {isDone
                        ? UI_TEXT[lang].missions.completed
                        : doneCount > 0
                          ? UI_TEXT[lang].missions.inProgress
                          : UI_TEXT[lang].missions.offline}
                    </span>
                    <span className="font-mono text-[#F2F5F3] tabular-nums">{pct}%</span>
                  </div>
                  <div className="mt-1.5 h-1.5 w-full overflow-hidden rounded-full bg-[#080B0D]">
                    <div
                      className={`h-full rounded-full transition-all duration-500 ${
                        isDone ? 'bg-[#75FFAE]' : 'bg-[#5AD9F5]'
                      }`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              </button>
            );
          })}
        </div>
      </section>

      {/* Daily Mission + Final Boss + Recent Achievements Row */}
      <section className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        {/* Daily Mission */}
        <div className="flex flex-col justify-between rounded-xl border border-[#1E2C30] bg-[#11181B]/85 p-5">
          <div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#5AD9F5]">
                <Calendar className="h-3.5 w-3.5" />
                {t.dailyMission}
              </span>
              <span className={dailyCompleted ? 'text-[#75FFAE]' : 'text-[#8A9993]'}>
                {dailyCompleted ? t.dailyDone : t.dailyReady}
              </span>
            </div>
            <h3 className="mt-2.5 font-display text-base font-semibold text-[#F2F5F3]">
              {dailyQuestion.title[lang]}
            </h3>
            <p className="mt-1 text-xs text-[#8A9993]">
              {dailyQuestion.topicTag[lang]} · +{dailyQuestion.xpReward + 40} XP
            </p>
          </div>
          <button
            type="button"
            disabled={dailyCompleted}
            onClick={() => {
              soundEngine.playSfx('click');
              onStartDaily(dailyQuestion);
            }}
            className={`mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              dailyCompleted
                ? 'cursor-not-allowed border border-[#1E2C30] bg-[#0B1013] text-[#8A9993]'
                : 'bg-[#5AD9F5] text-[#080B0D] hover:bg-[#7DE3FA]'
            }`}
          >
            <Cpu className="h-4 w-4" />
            <span>{dailyCompleted ? t.dailyDone : t.dailyLaunch}</span>
          </button>
        </div>

        {/* Final Boss Protocol Card */}
        <div className="flex flex-col justify-between rounded-xl border border-[#2B2024] bg-[#11181B]/85 p-5">
          <div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#FF626C]">
                <ShieldAlert className="h-3.5 w-3.5" />
                {lang === 'kk' ? 'ҚОРЫТЫНДЫ ХАТТАМА' : 'ФИНАЛЬНЫЙ ПРОТОКОЛ'}
              </span>
              <span className="tabular-nums text-[#8A9993]">
                {progress.completedModules.length}/6
              </span>
            </div>
            <h3 className="mt-2.5 font-display text-base font-semibold text-[#F2F5F3]">
              {UI_TEXT[lang].nav.boss}
            </h3>
            <p className="mt-1 text-xs leading-relaxed text-[#8A9993]">
              {allModulesDone ? UI_TEXT[lang].boss.rulesNote : t.bossLockedHint}
            </p>
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              onNavigate('final-boss');
            }}
            className={`mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-2 rounded-lg px-4 py-2 text-xs font-semibold transition ${
              allModulesDone
                ? 'bg-[#FF626C] text-[#080B0D] hover:bg-[#FF7B84]'
                : 'border border-[#2A383E] bg-[#0B1013] text-[#8A9993] hover:text-[#F2F5F3]'
            }`}
          >
            {!allModulesDone && <Lock className="h-3.5 w-3.5" />}
            <span>{t.openBoss}</span>
          </button>
        </div>

        {/* Recent Achievements */}
        <div className="flex flex-col justify-between rounded-xl border border-[#1E2C30] bg-[#11181B]/85 p-5">
          <div>
            <div className="flex items-center justify-between text-xs font-mono">
              <span className="flex items-center gap-1.5 text-[#75FFAE]">
                <Award className="h-3.5 w-3.5" />
                {t.recentAchievements}
              </span>
              <button
                type="button"
                onClick={() => {
                  soundEngine.playSfx('click');
                  onNavigate('achievements');
                }}
                className="text-[#5AD9F5] hover:underline"
              >
                {progress.unlockedAchievements.length}/{ACHIEVEMENTS.length}
              </button>
            </div>
            {recentUnlocked.length === 0 ? (
              <p className="mt-3 text-xs leading-relaxed text-[#8A9993]">
                {t.noAchievementsYet}
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {recentUnlocked.map((ach) => (
                  <li
                    key={ach.id}
                    className="flex items-center justify-between border-b border-[#1A252A] pb-1.5 text-xs last:border-0"
                  >
                    <span className="font-medium text-[#F2F5F3]">
                      {ach.title[lang]}
                    </span>
                    <span className="font-mono text-[#75FFAE]">+{ach.xpBonus} XP</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
          <button
            type="button"
            onClick={() => {
              soundEngine.playSfx('click');
              onNavigate('achievements');
            }}
            className="mt-4 inline-flex min-h-[44px] w-full items-center justify-center gap-1.5 rounded-lg border border-[#24343B] bg-[#0B1013] px-4 py-2 text-xs font-medium text-[#F2F5F3] transition hover:border-[#75FFAE]/45"
          >
            <span>{UI_TEXT[lang].nav.achievements}</span>
            <ChevronRight className="h-3.5 w-3.5" />
          </button>
        </div>
      </section>
    </div>
  );
};
