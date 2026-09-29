import React from 'react';

export const Footer: React.FC = () => {
  return (
    <footer className="w-full border-t border-zinc-200/80 dark:border-zinc-800/80 py-6 mt-12 bg-white/50 dark:bg-zinc-950/50 transition-colors">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 flex flex-col sm:flex-row items-center justify-between gap-3 text-xs text-zinc-500 dark:text-zinc-400">
        <div className="flex items-center gap-2">
          <span className="font-semibold text-zinc-800 dark:text-zinc-200">
            Uzbek ↔ Russian ↔ English Translator
          </span>
          <span aria-hidden="true">·</span>
          <span>Fast • Simple • Accurate</span>
        </div>

        <div className="flex items-center gap-4 text-zinc-400 dark:text-zinc-500">
          <span>Ctrl + Enter orqali tezkor tarjima</span>
          <span aria-hidden="true">·</span>
          <span>© {new Date().getFullYear()} Lingua Translate</span>
        </div>
      </div>
    </footer>
  );
};
