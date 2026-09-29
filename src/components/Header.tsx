import React from 'react';
import { Sun, Moon, History } from 'lucide-react';

interface HeaderProps {
  isDarkMode: boolean;
  onToggleDarkMode: () => void;
  onOpenHistory: () => void;
  historyCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  isDarkMode,
  onToggleDarkMode,
  onOpenHistory,
  historyCount,
}) => {
  return (
    <header className="w-full border-b border-zinc-200 dark:border-zinc-800 bg-white/80 dark:bg-zinc-950/80 backdrop-blur-md sticky top-0 z-30 transition-colors duration-200">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        {/* Zone 1: Brand wordmark */}
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-zinc-900 dark:bg-white text-white dark:text-zinc-900 flex items-center justify-center font-bold text-base shadow-sm">
            LT
          </div>
          <div>
            <h1 className="text-lg font-bold tracking-tight text-zinc-900 dark:text-white leading-none">
              Lingua Translate
            </h1>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 font-normal mt-0.5">
              O‘zbekcha ↔ Russian ↔ English
            </p>
          </div>
        </div>

        {/* Zone 2: Informational / Center guidance */}
        <div className="hidden md:flex items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400">
          <span className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
            🇺🇿 O‘zbekcha
          </span>
          <span className="text-zinc-400">⇄</span>
          <span className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
            🇷🇺 Ruscha
          </span>
          <span className="text-zinc-400">⇄</span>
          <span className="inline-flex items-center gap-1 font-medium text-zinc-700 dark:text-zinc-300">
            🇬🇧 Inglizcha
          </span>
        </div>

        {/* Zone 3: Actions (History & Dark/Light mode) */}
        <div className="flex items-center gap-2">
          {/* History Button */}
          <button
            type="button"
            onClick={onOpenHistory}
            className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer"
            title="Tarjimalar tarixi va saqlanganlar"
          >
            <History className="w-3.5 h-3.5 text-zinc-500 dark:text-zinc-400" />
            <span className="hidden sm:inline">Tarix</span>
            {historyCount > 0 && (
              <span className="ml-0.5 px-1.5 py-0.2 font-mono text-[10px] bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200 rounded">
                {historyCount}
              </span>
            )}
          </button>

          {/* Theme Toggle Button */}
          <button
            type="button"
            onClick={onToggleDarkMode}
            aria-label={isDarkMode ? "Yorug‘ rejimga o‘tish" : "Qorong‘i rejimga o‘tish"}
            className="p-2 text-zinc-700 dark:text-zinc-300 bg-zinc-100 hover:bg-zinc-200 dark:bg-zinc-900 dark:hover:bg-zinc-800 rounded-lg transition-colors focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-zinc-400 cursor-pointer"
            title={isDarkMode ? "Yorug‘ rejim (Light mode)" : "Qorong‘i rejim (Dark mode)"}
          >
            {isDarkMode ? (
              <Sun className="w-4 h-4 text-amber-400 transition-transform duration-300 hover:rotate-45" />
            ) : (
              <Moon className="w-4 h-4 text-zinc-700 transition-transform duration-300 hover:-rotate-12" />
            )}
          </button>
        </div>
      </div>
    </header>
  );
};
