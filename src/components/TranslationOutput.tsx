import React, { useState } from 'react';
import { Copy, Check, Volume2, Star, Loader2, ArrowLeftRight, BookOpen } from 'lucide-react';
import { TranslationResult, LanguageCode } from '../types';
import { getLanguageFlag, getLanguageName } from '../utils/detector';

interface TranslationOutputProps {
  result: TranslationResult | null;
  isLoading: boolean;
  onSpeak: (text: string, lang: LanguageCode) => void;
  isSpeaking: boolean;
  onToggleFavorite?: (result: TranslationResult) => void;
  isFavorite?: boolean;
  onReverseTranslate?: () => void;
}

export const TranslationOutput: React.FC<TranslationOutputProps> = ({
  result,
  isLoading,
  onSpeak,
  isSpeaking,
  onToggleFavorite,
  isFavorite = false,
  onReverseTranslate,
}) => {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    if (!result?.translation) return;
    try {
      await navigator.clipboard.writeText(result.translation);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    } catch {
      // Fallback
      const textArea = document.createElement('textarea');
      textArea.value = result.translation;
      document.body.appendChild(textArea);
      textArea.select();
      document.execCommand('copy');
      document.body.removeChild(textArea);
      setCopied(true);
      setTimeout(() => setCopied(false), 2200);
    }
  };

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-xs transition-colors duration-200 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Tarjima
          </span>
          {result && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
              · {getLanguageFlag(result.targetLanguage)} {getLanguageName(result.targetLanguage)}
            </span>
          )}
        </div>

        {/* Action icons */}
        {result?.translation && !isLoading && (
          <div className="flex items-center gap-1.5">
            {/* Copy button */}
            <button
              type="button"
              onClick={handleCopy}
              className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-medium transition-all cursor-pointer ${
                copied
                  ? 'bg-zinc-900 text-white dark:bg-white dark:text-zinc-900'
                  : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700'
              }`}
              title="Tarjimani nusxalash (📋)"
              aria-label="Tarjimani nusxalash"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-400" />
                  <span className="font-semibold">Tarjima nusxalandi!</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5" />
                  <span className="hidden sm:inline">Nusxalash</span>
                </>
              )}
            </button>

            {/* Audio Listen button */}
            <button
              type="button"
              onClick={() => onSpeak(result.translation, result.targetLanguage)}
              disabled={isSpeaking}
              className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                isSpeaking
                  ? 'text-zinc-900 dark:text-white bg-zinc-200 dark:bg-zinc-800 animate-pulse'
                  : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="Tarjimani ovozli eshitish"
              aria-label="Ovozli eshitish"
            >
              <Volume2 className="w-4 h-4" />
            </button>

            {/* Favorite button */}
            {onToggleFavorite && (
              <button
                type="button"
                onClick={() => onToggleFavorite(result)}
                className={`p-1.5 rounded-lg transition-colors cursor-pointer ${
                  isFavorite
                    ? 'text-amber-500 hover:text-amber-600 bg-amber-50 dark:bg-amber-950/30'
                    : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
                }`}
                title={isFavorite ? "Sevimlilardan o‘chirish" : "Sevimlilarga saqlash"}
                aria-label="Sevimlilarga saqlash"
              >
                <Star className={`w-4 h-4 ${isFavorite ? 'fill-amber-500' : ''}`} />
              </button>
            )}

            {/* Reverse translate button */}
            {onReverseTranslate && (
              <button
                type="button"
                onClick={onReverseTranslate}
                className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors hidden sm:flex cursor-pointer"
                title="Teskari tarjima qilish"
                aria-label="Teskari tarjima"
              >
                <ArrowLeftRight className="w-4 h-4" />
              </button>
            )}
          </div>
        )}
      </div>

      {/* Main Content Viewport */}
      <div className="relative flex-1 p-4 overflow-y-auto">
        {isLoading ? (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center gap-3 text-zinc-400 dark:text-zinc-500 py-12">
            <div className="relative flex items-center justify-center">
              <Loader2 className="w-8 h-8 animate-spin text-zinc-900 dark:text-white" />
            </div>
            <p className="text-sm font-medium tracking-wide animate-pulse text-zinc-700 dark:text-zinc-300">
              Tarjima qilinmoqda...
            </p>
          </div>
        ) : result?.translation ? (
          <div className="space-y-4">
            {/* Primary Translation Text */}
            <div className="text-zinc-900 dark:text-white text-base sm:text-lg leading-relaxed font-normal whitespace-pre-wrap select-text">
              {result.translation}
            </div>

            {/* Linguistic / Dictionary details for single words and idioms */}
            {(result.partOfSpeech ||
              result.transliteration ||
              (result.alternatives && result.alternatives.length > 0) ||
              (result.synonyms && result.synonyms.length > 0) ||
              (result.examples && result.examples.length > 0)) && (
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/80 space-y-3">
                {/* Part of Speech & Transliteration */}
                <div className="flex flex-wrap items-center gap-2 text-xs text-zinc-500 dark:text-zinc-400 font-medium">
                  {result.partOfSpeech && (
                    <span className="italic text-zinc-700 dark:text-zinc-300">
                      {result.partOfSpeech}
                    </span>
                  )}
                  {result.partOfSpeech && result.transliteration && <span>·</span>}
                  {result.transliteration && (
                    <span className="font-mono text-zinc-600 dark:text-zinc-400">
                      [{result.transliteration}]
                    </span>
                  )}
                </div>

                {/* Alternatives */}
                {result.alternatives && result.alternatives.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 block mb-1">
                      Boshqa variantlar:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.alternatives.map((alt, i) => (
                        <span
                          key={i}
                          className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md"
                        >
                          {alt}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Synonyms */}
                {result.synonyms && result.synonyms.length > 0 && (
                  <div>
                    <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 block mb-1">
                      Sinonimlar:
                    </span>
                    <div className="flex flex-wrap gap-1.5">
                      {result.synonyms.map((syn, i) => (
                        <span
                          key={i}
                          className="text-xs text-zinc-700 dark:text-zinc-300 bg-zinc-100 dark:bg-zinc-800 px-2 py-0.5 rounded-md"
                        >
                          {syn}
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Examples */}
                {result.examples && result.examples.length > 0 && (
                  <div className="space-y-1.5">
                    <span className="text-xs font-semibold text-zinc-400 dark:text-zinc-500 flex items-center gap-1">
                      <BookOpen className="w-3 h-3" /> Misollar:
                    </span>
                    {result.examples.map((eg, i) => (
                      <div
                        key={i}
                        className="text-xs p-2 rounded-lg bg-zinc-50 dark:bg-zinc-800/40 border border-zinc-100 dark:border-zinc-800/60"
                      >
                        <p className="text-zinc-800 dark:text-zinc-200 font-medium">
                          {eg.original}
                        </p>
                        <p className="text-zinc-500 dark:text-zinc-400 mt-0.5">
                          {eg.translated}
                        </p>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        ) : (
          <div className="h-full min-h-[180px] flex flex-col items-center justify-center text-center p-6 text-zinc-400 dark:text-zinc-600">
            <p className="text-base sm:text-lg font-medium text-zinc-400 dark:text-zinc-600">
              Tarjima shu yerda ko‘rsatiladi
            </p>
            <p className="text-xs text-zinc-400 dark:text-zinc-500 mt-1 max-w-xs">
              Chap panelga o‘zbekcha, ruscha yoki inglizcha matn yozing va «Tarjima qilish» tugmasini bosing
            </p>
          </div>
        )}
      </div>

      {/* Bottom Bar */}
      <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex items-center justify-between text-[11px] text-zinc-400 dark:text-zinc-500">
        <div className="flex items-center gap-2">
          <span>AI Tarjima</span>
          {result?.tone && (
            <>
              <span>·</span>
              <span className="capitalize">{result.tone === 'formal' ? 'Rasmiy' : result.tone === 'casual' ? 'So‘zlashuv' : 'Oddiy'}</span>
            </>
          )}
        </div>
        {result?.translation && (
          <div className="font-mono tabular-nums">
            {result.translation.length} ta belgi
          </div>
        )}
      </div>
    </div>
  );
};
