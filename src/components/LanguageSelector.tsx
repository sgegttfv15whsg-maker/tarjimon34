import React from 'react';
import { ArrowLeftRight, ChevronDown } from 'lucide-react';
import { LanguageCode, SourceLanguageOption, TranslationTone } from '../types';

interface LanguageSelectorProps {
  sourceLanguage: SourceLanguageOption;
  targetLanguage: LanguageCode;
  tone: TranslationTone;
  onSourceChange: (lang: SourceLanguageOption) => void;
  onTargetChange: (lang: LanguageCode) => void;
  onSwapLanguages: () => void;
  onToneChange: (tone: TranslationTone) => void;
  detectedLang?: LanguageCode | null;
  onSelectPair?: (source: LanguageCode, target: LanguageCode) => void;
}

export const LanguageSelector: React.FC<LanguageSelectorProps> = ({
  sourceLanguage,
  targetLanguage,
  tone,
  onSourceChange,
  onTargetChange,
  onSwapLanguages,
  onToneChange,
  detectedLang,
  onSelectPair,
}) => {
  const formatDetectedName = (code?: LanguageCode | null) => {
    if (!code) return '';
    if (code === 'uz') return 'O‘zbek';
    if (code === 'ru') return 'Rus';
    return 'Ingliz';
  };

  return (
    <div className="w-full bg-white dark:bg-zinc-900 border border-zinc-200/80 dark:border-zinc-800 rounded-2xl p-2.5 sm:p-3.5 shadow-xs transition-colors duration-200 space-y-2.5">
      <div className="flex flex-col lg:flex-row items-stretch lg:items-center justify-between gap-3">
        {/* Language Selectors and Central Swap Button */}
        <div className="flex items-center justify-between sm:justify-start gap-2 flex-1">
          {/* Source Language Selector */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={sourceLanguage}
              onChange={(e) => onSourceChange(e.target.value as SourceLanguageOption)}
              className="w-full sm:w-48 appearance-none py-2.5 pl-3.5 pr-8 text-sm font-semibold bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-700/60 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all cursor-pointer"
            >
              <option value="auto">
                ✨ Avto aniqlash {detectedLang ? `(${formatDetectedName(detectedLang)})` : ''}
              </option>
              <option value="uz">🇺🇿 O‘zbek tili</option>
              <option value="ru">🇷🇺 Rus tili</option>
              <option value="en">🇬🇧 Ingliz tili</option>
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>

          {/* Big Swap Button */}
          <button
            type="button"
            onClick={onSwapLanguages}
            title="Tillar yo‘nalishini almashtirish (⇄)"
            aria-label="Tillar yo‘nalishini almashtirish"
            className="group relative p-2.5 sm:px-3.5 text-zinc-700 dark:text-zinc-200 bg-zinc-100 hover:bg-zinc-900 hover:text-white dark:bg-zinc-800 dark:hover:bg-white dark:hover:text-zinc-900 rounded-xl transition-all duration-200 border border-zinc-200 dark:border-zinc-700/60 shadow-xs active:scale-95 flex items-center justify-center shrink-0"
          >
            <ArrowLeftRight className="w-4 h-4 transition-transform duration-300 group-hover:rotate-180" />
          </button>

          {/* Target Language Selector */}
          <div className="relative flex-1 sm:flex-initial">
            <select
              value={targetLanguage}
              onChange={(e) => onTargetChange(e.target.value as LanguageCode)}
              className="w-full sm:w-48 appearance-none py-2.5 pl-3.5 pr-8 text-sm font-semibold bg-zinc-50 dark:bg-zinc-800/80 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-900 dark:text-white rounded-xl border border-zinc-200 dark:border-zinc-700/60 focus:outline-none focus:ring-2 focus:ring-zinc-900 dark:focus:ring-white transition-all cursor-pointer"
            >
              <option value="uz">🇺🇿 O‘zbek tili</option>
              <option value="ru">🇷🇺 Rus tili</option>
              <option value="en">🇬🇧 Ingliz tili</option>
            </select>
            <ChevronDown className="w-4 h-4 text-zinc-400 absolute right-2.5 top-1/2 -translate-y-1/2 pointer-events-none" />
          </div>
        </div>

        {/* Tone Selector */}
        <div className="flex items-center justify-end border-t lg:border-t-0 pt-2 lg:pt-0 border-zinc-100 dark:border-zinc-800/60">
          <div className="inline-flex p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-xl border border-zinc-200/60 dark:border-zinc-700/40 w-full sm:w-auto">
            <button
              type="button"
              onClick={() => onToneChange('standard')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                tone === 'standard'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
            >
              Oddiy
            </button>
            <button
              type="button"
              onClick={() => onToneChange('formal')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                tone === 'formal'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Rasmiy va hurmatli muloqot uslubi"
            >
              Rasmiy
            </button>
            <button
              type="button"
              onClick={() => onToneChange('casual')}
              className={`flex-1 sm:flex-initial px-3 py-1.5 text-xs font-medium rounded-lg transition-all ${
                tone === 'casual'
                  ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs font-semibold'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
              }`}
              title="Do‘stona va so‘zlashuv uslubi"
            >
              So‘zlashuv
            </button>
          </div>
        </div>
      </div>

      {/* Quick Pair Shortcuts (Section 8) */}
      <div className="flex flex-wrap items-center gap-1.5 pt-1 border-t border-zinc-100 dark:border-zinc-800/60 text-xs">
        <span className="text-[11px] text-zinc-400 dark:text-zinc-500 font-medium mr-1">
          Tezkor juftliklar:
        </span>
        <button
          type="button"
          onClick={() => onSelectPair && onSelectPair('uz', 'en')}
          className={`px-2.5 py-1 rounded-lg transition-all ${
            (sourceLanguage === 'uz' && targetLanguage === 'en') || (sourceLanguage === 'en' && targetLanguage === 'uz')
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          🇺🇿 O‘zbekcha ⇄ 🇬🇧 English
        </button>
        <button
          type="button"
          onClick={() => onSelectPair && onSelectPair('uz', 'ru')}
          className={`px-2.5 py-1 rounded-lg transition-all ${
            (sourceLanguage === 'uz' && targetLanguage === 'ru') || (sourceLanguage === 'ru' && targetLanguage === 'uz')
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          🇺🇿 O‘zbekcha ⇄ 🇷🇺 Русский
        </button>
        <button
          type="button"
          onClick={() => onSelectPair && onSelectPair('ru', 'en')}
          className={`px-2.5 py-1 rounded-lg transition-all ${
            (sourceLanguage === 'ru' && targetLanguage === 'en') || (sourceLanguage === 'en' && targetLanguage === 'ru')
              ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium'
              : 'text-zinc-600 dark:text-zinc-400 hover:bg-zinc-100 dark:hover:bg-zinc-800'
          }`}
        >
          🇷🇺 Русский ⇄ 🇬🇧 English
        </button>
      </div>
    </div>
  );
};
