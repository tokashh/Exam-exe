import React from 'react';
import {
  Award,
  BarChart3,
  Cpu,
  Home,
  Settings,
  ShieldAlert,
  Terminal,
  User,
} from 'lucide-react';
import { Language, ScreenId } from '../types/game';
import { UI_TEXT } from '../i18n/translations';
import { soundEngine } from '../audio/soundEngine';

interface NavigationShellProps {
  currentScreen: ScreenId;
  onNavigate: (screen: ScreenId) => void;
  lang: Language;
  xp: number;
  allModulesCompleted: boolean;
  children: React.ReactNode;
}

export const NavigationShell: React.FC<NavigationShellProps> = ({
  currentScreen,
  onNavigate,
  lang,
  xp,
  allModulesCompleted,
  children,
}) => {
  const t = UI_TEXT[lang].nav;

  const navClick = (target: ScreenId) => {
    soundEngine.playSfx('click');
    onNavigate(target);
  };

  // Top bar follows clean 3-zone layout: Brand | 5 Nav Links | 1 Primary Action
  const desktopLinks: Array<{ id: ScreenId; label: string }> = [
    { id: 'dashboard', label: t.dashboard },
    { id: 'missions', label: t.missions },
    { id: 'python-lab', label: 'Python / SQL' },
    { id: 'analytics', label: t.analytics },
    { id: 'achievements', label: t.achievements },
  ];

  // Compact mobile bottom bar (under 15% viewport height)
  const mobileTabs: Array<{
    id: ScreenId;
    label: string;
    icon: React.ComponentType<{ className?: string }>;
  }> = [
    { id: 'dashboard', label: t.dashboard, icon: Home },
    { id: 'missions', label: t.missions, icon: Cpu },
    { id: 'python-lab', label: t.labs, icon: Terminal },
    { id: 'analytics', label: t.analytics, icon: BarChart3 },
    { id: 'profile', label: t.profile, icon: User },
  ];

  const isLabActive =
    currentScreen === 'python-lab' || currentScreen === 'sql-terminal';

  return (
    <div className="relative z-10 flex min-h-screen flex-col">
      {/* Compact Top Bar (<= 56px) */}
      <header className="sticky top-0 z-30 border-b border-[#1D2A30] bg-[#080B0D]/90 backdrop-blur-md pt-safe">
        <div className="mx-auto flex h-14 max-w-6xl items-center justify-between gap-4 px-4 sm:px-6 md:gap-8">
          {/* Zone 1: Brand Title */}
          <button
            type="button"
            onClick={() => navClick('dashboard')}
            className="font-display text-lg font-bold tracking-tight text-[#F2F5F3] transition hover:text-[#75FFAE] whitespace-nowrap shrink-0"
          >
            EXAM<span className="text-[#75FFAE]">.exe</span>
          </button>

          {/* Zone 2: Concise Single-Line Desktop Nav Links */}
          <nav
            aria-label="Primary"
            className="hidden items-center gap-6 md:flex"
          >
            {desktopLinks.map((item) => {
              const active =
                currentScreen === item.id ||
                (item.id === 'python-lab' && isLabActive);
              return (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => navClick(item.id)}
                  className={`min-h-[40px] text-sm font-medium transition-colors whitespace-nowrap shrink-0 ${
                    active
                      ? 'text-[#75FFAE] underline decoration-[#75FFAE]/60 decoration-2 underline-offset-8'
                      : 'text-[#8A9993] hover:text-[#F2F5F3]'
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </nav>

          {/* Zone 3: Single Primary Contextual Action + Compact Utility Triggers */}
          <div className="flex items-center gap-2 shrink-0">
            <span className="hidden font-mono text-xs text-[#5AD9F5] tabular-nums sm:inline whitespace-nowrap">
              {xp.toLocaleString()} XP
            </span>
            <button
              type="button"
              onClick={() => navClick('final-boss')}
              className={`inline-flex min-h-[40px] items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition whitespace-nowrap shrink-0 ${
                currentScreen === 'final-boss'
                  ? 'bg-[#FF626C] text-[#080B0D]'
                  : allModulesCompleted
                    ? 'border border-[#FF626C]/60 bg-[#FF626C]/15 text-[#FF626C] hover:bg-[#FF626C]/25'
                    : 'border border-[#26363D] bg-[#11181B] text-[#8A9993] hover:text-[#F2F5F3]'
              }`}
            >
              <ShieldAlert className="h-3.5 w-3.5 shrink-0" />
              <span>{t.boss}</span>
            </button>
            <button
              type="button"
              onClick={() => navClick('achievements')}
              aria-label={t.achievements}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition md:hidden ${
                currentScreen === 'achievements'
                  ? 'bg-[#75FFAE]/15 text-[#75FFAE]'
                  : 'text-[#8A9993] hover:bg-[#11181B] hover:text-[#F2F5F3]'
              }`}
            >
              <Award className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navClick('profile')}
              aria-label={t.profile}
              className={`hidden h-10 w-10 items-center justify-center rounded-lg transition md:flex ${
                currentScreen === 'profile'
                  ? 'bg-[#75FFAE]/15 text-[#75FFAE]'
                  : 'text-[#8A9993] hover:bg-[#11181B] hover:text-[#F2F5F3]'
              }`}
            >
              <User className="h-4 w-4" />
            </button>
            <button
              type="button"
              onClick={() => navClick('settings')}
              aria-label={t.settings}
              className={`flex h-10 w-10 items-center justify-center rounded-lg transition ${
                currentScreen === 'settings'
                  ? 'bg-[#5AD9F5]/15 text-[#5AD9F5]'
                  : 'text-[#8A9993] hover:bg-[#11181B] hover:text-[#F2F5F3]'
              }`}
            >
              <Settings className="h-4 w-4" />
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="mx-auto w-full max-w-6xl flex-1 px-4 pt-5 pb-24 sm:px-6 md:pb-10">
        {children}
      </main>

      {/* Mobile Fixed Bottom Navigation Bar (56px height) */}
      <nav
        aria-label="Mobile navigation"
        className="fixed bottom-0 left-0 right-0 z-30 border-t border-[#1D2A30] bg-[#080B0D]/95 backdrop-blur-md pb-safe md:hidden"
      >
        <div className="grid h-14 grid-cols-5 items-center">
          {mobileTabs.map((tab) => {
            const Icon = tab.icon;
            const active =
              currentScreen === tab.id ||
              (tab.id === 'python-lab' && isLabActive);
            return (
              <button
                key={tab.id}
                type="button"
                onClick={() => navClick(tab.id)}
                className={`flex h-full min-h-[44px] flex-col items-center justify-center gap-0.5 transition-colors ${
                  active ? 'text-[#75FFAE]' : 'text-[#8A9993]'
                }`}
              >
                <Icon className="h-5 w-5" />
                <span className="text-[10px] font-medium leading-none truncate max-w-[64px]">
                  {tab.label}
                </span>
              </button>
            );
          })}
        </div>
      </nav>
    </div>
  );
};
