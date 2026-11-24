import { useCallback, useEffect, useState } from 'react';
import { soundEngine } from './audio/soundEngine';
import { AchievementToast } from './components/AchievementToast';
import { CyberBackground } from './components/CyberBackground';
import { NavigationShell } from './components/NavigationShell';
import { OfflineIndicator } from './components/PWAInstallButton';
import { getModuleQuestions } from './data/finalBossPool';
import { getRankForXp, MODULES } from './data/ranksAndAchievements';
import { AchievementsScreen } from './screens/AchievementsScreen';
import { DashboardScreen } from './screens/DashboardScreen';
import { FinalBossScreen } from './screens/FinalBossScreen';
import { GameplayScreen, GameplaySessionConfig } from './screens/GameplayScreen';
import { MissionSelectScreen } from './screens/MissionSelectScreen';
import { PerformanceScreen } from './screens/PerformanceScreen';
import { ProfileScreen } from './screens/ProfileScreen';
import { PythonLabScreen } from './screens/PythonLabScreen';
import { ResultsScreen } from './screens/ResultsScreen';
import { SettingsScreen } from './screens/SettingsScreen';
import { SqlTerminalScreen } from './screens/SqlTerminalScreen';
import { StartScreen } from './screens/StartScreen';
import {
  AchievementId,
  BoosterId,
  Language,
  ModuleId,
  PlayerProgress,
  PlayerSettings,
  Question,
  ScreenId,
  SessionRunSummary,
  SimulationResult,
} from './types/game';
import {
  clearProgress,
  getTodayDateKey,
  loadProgress,
  recomputeProgressionAndAchievements,
  saveProgress,
} from './utils/storage';

export default function App() {
  const [progress, setProgress] = useState<PlayerProgress>(() => loadProgress());
  const [screen, setScreen] = useState<ScreenId>(() =>
    progress.hasBooted && progress.nickname ? 'dashboard' : 'start'
  );
  const [activeSession, setActiveSession] =
    useState<GameplaySessionConfig | null>(null);
  const [sessionSummary, setSessionSummary] =
    useState<SessionRunSummary | null>(null);
  const [toastQueue, setToastQueue] = useState<AchievementId[]>([]);

  const lang = progress.settings.language;

  // Persist save state
  useEffect(() => {
    saveProgress(progress);
  }, [progress]);

  // Sync HTML lang & reduced-motion class
  useEffect(() => {
    document.documentElement.lang = lang;
    if (progress.settings.reducedMotion) {
      document.documentElement.classList.add('reduced-motion');
    } else {
      document.documentElement.classList.remove('reduced-motion');
    }
  }, [lang, progress.settings.reducedMotion]);

  // Sync Web Audio Engine configuration
  useEffect(() => {
    soundEngine.configure({
      musicEnabled: progress.settings.musicEnabled,
      sfxEnabled: progress.settings.sfxEnabled,
      musicVolume: progress.settings.musicVolume,
      sfxVolume: progress.settings.sfxVolume,
    });
  }, [progress.settings]);

  // Global first-interaction unlock for iOS Safari Web Audio
  useEffect(() => {
    const unlockOnce = () => {
      soundEngine.unlock();
    };
    window.addEventListener('pointerdown', unlockOnce, { passive: true });
    window.addEventListener('keydown', unlockOnce, { passive: true });
    return () => {
      window.removeEventListener('pointerdown', unlockOnce);
      window.removeEventListener('keydown', unlockOnce);
    };
  }, []);

  // Adaptive music environment per screen
  useEffect(() => {
    if (screen === 'start') {
      soundEngine.setEnvironment('menu');
    } else if (
      screen === 'dashboard' ||
      screen === 'missions' ||
      screen === 'profile' ||
      screen === 'analytics' ||
      screen === 'achievements' ||
      screen === 'settings'
    ) {
      soundEngine.setEnvironment('menu');
    } else if (screen === 'python-lab') {
      soundEngine.setEnvironment('python');
    } else if (screen === 'sql-terminal') {
      soundEngine.setEnvironment('sql');
    }
  }, [screen]);

  const enqueueAchievements = useCallback((ids: AchievementId[]) => {
    if (ids.length === 0) return;
    soundEngine.playSfx('achievement');
    setToastQueue((prev) => [...prev, ...ids]);
  }, []);

  const handleStartGame = (nickname: string) => {
    soundEngine.unlock();
    setProgress((prev) => {
      const updated: PlayerProgress = {
        ...prev,
        nickname,
        hasBooted: true,
      };
      const { next, newlyUnlocked } = recomputeProgressionAndAchievements(updated);
      if (newlyUnlocked.length > 0) {
        window.setTimeout(() => enqueueAchievements(newlyUnlocked), 250);
      }
      return next;
    });
    setScreen('dashboard');
  };

  const handleUpdateSettings = (partial: Partial<PlayerSettings>) => {
    setProgress((prev) => ({
      ...prev,
      settings: { ...prev.settings, ...partial },
    }));
  };

  const handleChangeLang = (newLang: Language) => {
    handleUpdateSettings({ language: newLang });
  };

  const handleStartModule = (moduleId: ModuleId) => {
    const qs = getModuleQuestions(moduleId);
    setActiveSession({
      mode: 'module',
      moduleId,
      questions: qs,
    });
    setScreen('gameplay');
  };

  const handleStartSingle = (question: Question) => {
    setActiveSession({
      mode: 'single',
      moduleId: question.moduleId,
      questions: [question],
    });
    setScreen('gameplay');
  };

  const handleStartDaily = (question: Question) => {
    setActiveSession({
      mode: 'daily',
      moduleId: question.moduleId,
      questions: [question],
    });
    setScreen('gameplay');
  };

  const handleConsumeBooster = useCallback(
    (id: BoosterId): boolean => {
      if (progress.boosters[id] <= 0) return false;
      setProgress((prev) => {
        if (prev.boosters[id] <= 0) return prev;
        return {
          ...prev,
          boosters: {
            ...prev.boosters,
            [id]: prev.boosters[id] - 1,
          },
        };
      });
      return true;
    },
    [progress.boosters]
  );

  const handleAnswerRecorded = useCallback(
    (
      question: Question,
      isCorrect: boolean,
      isDaily: boolean,
      xpMultiplier = 1
    ): number => {
      let xpToAward = 0;
      setProgress((prev) => {
        const alreadySolved = prev.completedQuestionIds.includes(question.id);
        if (isCorrect) {
          xpToAward = alreadySolved
            ? Math.round(question.xpReward * 0.25)
            : question.xpReward;
          if (isDaily) {
            xpToAward += 40;
          }
          xpToAward = Math.round(xpToAward * xpMultiplier);
        }

        const completedIds =
          isCorrect && !alreadySolved
            ? [...prev.completedQuestionIds, question.id]
            : prev.completedQuestionIds;

        const updated: PlayerProgress = {
          ...prev,
          xp: prev.xp + xpToAward,
          completedQuestionIds: completedIds,
          lastDailyMissionDate:
            isDaily && isCorrect ? getTodayDateKey() : prev.lastDailyMissionDate,
          dailyMissionQuestionId:
            isDaily && isCorrect ? question.id : prev.dailyMissionQuestionId,
          answerHistory: [
            ...prev.answerHistory,
            {
              questionId: question.id,
              moduleId: question.moduleId,
              topicRu: question.topicTag.ru,
              topicKk: question.topicTag.kk,
              format: question.format,
              isCorrect,
              timestamp: Date.now(),
            },
          ],
        };

        const { next, newlyUnlocked } = recomputeProgressionAndAchievements(updated);
        if (newlyUnlocked.length > 0) {
          window.setTimeout(() => enqueueAchievements(newlyUnlocked), 200);
        }
        return next;
      });
      return xpToAward;
    },
    [enqueueAchievements]
  );

  const handleFinishSession = (
    reviewed: Array<{ question: Question; isCorrect: boolean; userSummary: string }>,
    totalXpEarned: number
  ) => {
    if (!activeSession) return;
    const correctCount = reviewed.filter((r) => r.isCorrect).length;
    const accuracy =
      reviewed.length > 0 ? Math.round((correctCount / reviewed.length) * 100) : 0;
    const isPerfectModuleRun =
      activeSession.mode === 'module' &&
      reviewed.length >= 8 &&
      correctCount === reviewed.length;

    const shouldRefillBoosters =
      (activeSession.mode === 'module' && accuracy >= 60) ||
      (activeSession.mode === 'daily' && correctCount === 1);

    const prevRank = getRankForXp(Math.max(0, progress.xp - totalXpEarned)).id;
    let newRank = getRankForXp(progress.xp).id;
    let unlockedNow: AchievementId[] = [];

    if (isPerfectModuleRun || shouldRefillBoosters) {
      setProgress((prev) => {
        const refilled = shouldRefillBoosters
          ? {
              ...prev,
              boosters: {
                double_xp_10s: Math.min(9, prev.boosters.double_xp_10s + 1),
                second_chance: Math.min(9, prev.boosters.second_chance + 1),
                fifty_fifty: Math.min(9, prev.boosters.fifty_fifty + 1),
              },
            }
          : prev;
        const { next, newlyUnlocked } = recomputeProgressionAndAchievements(refilled, {
          perfectRunTriggered: isPerfectModuleRun,
        });
        newRank = getRankForXp(next.xp).id;
        unlockedNow = newlyUnlocked;
        if (newlyUnlocked.length > 0) {
          window.setTimeout(() => enqueueAchievements(newlyUnlocked), 200);
        }
        return next;
      });
    }

    setSessionSummary({
      mode: activeSession.mode,
      moduleId: activeSession.moduleId,
      totalQuestions: reviewed.length,
      correctCount,
      xpEarned: totalXpEarned,
      accuracy,
      perfectRun: isPerfectModuleRun,
      previousRankId: prevRank,
      newRankId: newRank,
      newlyUnlockedAchievements: unlockedNow,
      reviewedAnswers: reviewed,
    });
    setScreen('results');
  };

  const handleRecordLabPractice = (question: Question, isCorrect: boolean) => {
    handleAnswerRecorded(question, isCorrect, false);
  };

  const handleSaveBossResult = (
    sim: SimulationResult,
    xpAwarded: number,
    records: Array<{ question: Question; isCorrect: boolean }>
  ) => {
    setProgress((prev) => {
      const newRecords = records.map((r) => ({
        questionId: r.question.id,
        moduleId: r.question.moduleId,
        topicRu: r.question.topicTag.ru,
        topicKk: r.question.topicTag.kk,
        format: r.question.format,
        isCorrect: r.isCorrect,
        timestamp: Date.now(),
        isFinalBoss: true,
      }));
      const updated: PlayerProgress = {
        ...prev,
        xp: prev.xp + xpAwarded,
        answerHistory: [...prev.answerHistory, ...newRecords],
        simulationResults: [...prev.simulationResults, sim],
      };
      const { next, newlyUnlocked } = recomputeProgressionAndAchievements(updated, {
        finalSimPassed: sim.accuracy >= 80,
      });
      if (newlyUnlocked.length > 0) {
        window.setTimeout(() => enqueueAchievements(newlyUnlocked), 300);
      }
      return next;
    });
  };

  const handleResetProgress = () => {
    const fresh = clearProgress();
    setProgress(fresh);
    setActiveSession(null);
    setSessionSummary(null);
    setToastQueue([]);
    setScreen('start');
  };

  const allModulesCompleted = MODULES.every((m) =>
    progress.completedModules.includes(m.id)
  );

  return (
    <div className="min-h-screen bg-[#080B0D] text-[#F2F5F3]">
      <CyberBackground
        enabled={progress.settings.backgroundAnimations}
        reducedMotion={progress.settings.reducedMotion}
        bossAlert={screen === 'final-boss'}
      />

      <AchievementToast
        achievementId={toastQueue[0] ?? null}
        lang={lang}
        onClose={() => setToastQueue((q) => q.slice(1))}
      />

      <OfflineIndicator lang={lang} />

      {screen === 'start' ? (
        <StartScreen
          lang={lang}
          initialNickname={progress.nickname}
          hasBootedBefore={progress.hasBooted}
          onChangeLang={handleChangeLang}
          onStart={handleStartGame}
        />
      ) : (
        <NavigationShell
          currentScreen={screen}
          onNavigate={setScreen}
          lang={lang}
          xp={progress.xp}
          allModulesCompleted={allModulesCompleted}
        >
          {screen === 'dashboard' && (
            <DashboardScreen
              progress={progress}
              lang={lang}
              onChangeLang={handleChangeLang}
              onNavigate={setScreen}
              onStartModule={handleStartModule}
              onStartDaily={handleStartDaily}
            />
          )}

          {screen === 'missions' && (
            <MissionSelectScreen
              progress={progress}
              lang={lang}
              onStartModule={handleStartModule}
              onStartSingleQuestion={handleStartSingle}
              onNavigate={setScreen}
            />
          )}

          {screen === 'gameplay' && activeSession && (
            <GameplayScreen
              session={activeSession}
              lang={lang}
              boosters={progress.boosters}
              onConsumeBooster={handleConsumeBooster}
              onExit={() => setScreen('missions')}
              onAnswerRecorded={handleAnswerRecorded}
              onFinishSession={handleFinishSession}
            />
          )}

          {screen === 'python-lab' && (
            <PythonLabScreen
              lang={lang}
              completedIds={progress.completedQuestionIds}
              onRecordPractice={handleRecordLabPractice}
              onOpenSqlTerminal={() => setScreen('sql-terminal')}
            />
          )}

          {screen === 'sql-terminal' && (
            <SqlTerminalScreen
              lang={lang}
              completedIds={progress.completedQuestionIds}
              onRecordPractice={handleRecordLabPractice}
              onOpenPythonLab={() => setScreen('python-lab')}
            />
          )}

          {screen === 'results' && sessionSummary && (
            <ResultsScreen
              summary={sessionSummary}
              lang={lang}
              onReplayModule={handleStartModule}
              onGoDashboard={() => setScreen('dashboard')}
              onGoMissions={() => setScreen('missions')}
            />
          )}

          {screen === 'profile' && (
            <ProfileScreen
              progress={progress}
              lang={lang}
              onUpdateNickname={(nickname) =>
                setProgress((prev) => ({ ...prev, nickname }))
              }
            />
          )}

          {screen === 'analytics' && (
            <PerformanceScreen
              progress={progress}
              lang={lang}
              onPracticeQuestion={handleStartSingle}
            />
          )}

          {screen === 'achievements' && (
            <AchievementsScreen progress={progress} lang={lang} />
          )}

          {screen === 'settings' && (
            <SettingsScreen
              settings={progress.settings}
              onUpdateSettings={handleUpdateSettings}
              onResetProgress={handleResetProgress}
            />
          )}

          {screen === 'final-boss' && (
            <FinalBossScreen
              progress={progress}
              lang={lang}
              onSaveSimulationResult={handleSaveBossResult}
              onGoMissions={() => setScreen('missions')}
            />
          )}
        </NavigationShell>
      )}
    </div>
  );
}
