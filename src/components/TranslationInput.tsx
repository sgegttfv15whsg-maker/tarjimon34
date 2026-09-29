import React, { useRef, useEffect } from 'react';
import { Trash2, Volume2, Clipboard, ArrowRightLeft, Sparkles } from 'lucide-react';
import { LanguageCode } from '../types';
import { getLanguageName, getLanguageFlag } from '../utils/detector';

interface TranslationInputProps {
  value: string;
  onChange: (val: string) => void;
  onClear: () => void;
  onSpeak: () => void;
  isSpeaking: boolean;
  sourceLang: LanguageCode | 'auto';
  detectedLang?: LanguageCode | null;
  onApplyLanguageSuggestion?: (lang: LanguageCode) => void;
  onSelectSample: (text: string) => void;
  onKeyDown?: (e: React.KeyboardEvent<HTMLTextAreaElement>) => void;
}

const SAMPLE_PHRASES = [
  { text: 'Salom, qalaysan?', label: 'O‘zbekcha (uz)' },
  { text: 'Bugun havo juda yaxshi.', label: 'O‘zbekcha gap' },
  { text: 'O‘qituvchi G‘ijduvonga bordi.', label: 'O‘zbekcha harflar' },
  { text: 'Привет, как дела?', label: 'Ruscha (ru)' },
  { text: 'Could you please send me the report by tomorrow?', label: 'Inglizcha (en)' },
  { text: 'Kitob', label: 'Bitta so‘z' },
];

export const TranslationInput: React.FC<TranslationInputProps> = ({
  value,
  onChange,
  onClear,
  onSpeak,
  isSpeaking,
  sourceLang,
  detectedLang,
  onApplyLanguageSuggestion,
  onSelectSample,
  onKeyDown,
}) => {
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Auto-resize textarea height
  useEffect(() => {
    if (textareaRef.current) {
      textareaRef.current.style.height = 'auto';
      const scrollHeight = textareaRef.current.scrollHeight;
      textareaRef.current.style.height = `${Math.max(180, Math.min(scrollHeight, 400))}px`;
    }
  }, [value]);

  const handlePaste = async () => {
    try {
      const clipText = await navigator.clipboard.readText();
      if (clipText) {
        onChange(clipText);
      }
    } catch {
      // Clipboard access might be denied in some iframe security contexts
    }
  };

  const charCount = value.length;
  const wordCount = value.trim() ? value.trim().split(/\s+/).length : 0;

  // Check if detected language conflicts with explicit selected source language
  const showSuggestion =
    sourceLang !== 'auto' &&
    detectedLang &&
    detectedLang !== sourceLang &&
    value.trim().length > 3;

  return (
    <div className="flex flex-col h-full bg-white dark:bg-zinc-900 border border-zinc-200/90 dark:border-zinc-800 rounded-2xl shadow-xs transition-colors duration-200 relative overflow-hidden">
      {/* Top Header */}
      <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50">
        <div className="flex items-center gap-2">
          <span className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 uppercase tracking-wider">
            Matnni kiriting
          </span>
          {detectedLang && (
            <span className="text-xs text-zinc-500 dark:text-zinc-400 flex items-center gap-1 font-mono">
              · {getLanguageFlag(detectedLang)} {getLanguageName(detectedLang)} {sourceLang === 'auto' ? 'aniqlandi' : ''}
            </span>
          )}
        </div>

        {/* Action icons */}
        <div className="flex items-center gap-1">
          {value && (
            <button
              type="button"
              onClick={onClear}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
              title="Tozalash (🗑)"
              aria-label="Matnni tozalash"
            >
              <Trash2 className="w-4 h-4" />
            </button>
          )}

          <button
            type="button"
            onClick={handlePaste}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800 rounded-lg transition-colors"
            title="Clipboarddan joylash"
            aria-label="Matnni joylash"
          >
            <Clipboard className="w-4 h-4" />
          </button>

          {value.trim() && (
            <button
              type="button"
              onClick={onSpeak}
              disabled={isSpeaking}
              className={`p-1.5 rounded-lg transition-colors ${
                isSpeaking
                  ? 'text-zinc-900 dark:text-white bg-zinc-200 dark:bg-zinc-800 animate-pulse'
                  : 'text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 hover:bg-zinc-100 dark:hover:bg-zinc-800'
              }`}
              title="Matnni ovozli eshitish"
              aria-label="Ovozli eshitish"
            >
              <Volume2 className="w-4 h-4" />
            </button>
          )}
        </div>
      </div>

      {/* Language mismatch auto-detection warning / recommendation */}
      {showSuggestion && onApplyLanguageSuggestion && (
        <div className="mx-3 mt-3 px-3 py-2 bg-zinc-100 dark:bg-zinc-800/90 border border-zinc-200 dark:border-zinc-700 rounded-xl flex items-center justify-between gap-2 text-xs">
          <div className="flex items-center gap-1.5 text-zinc-700 dark:text-zinc-300">
            <Sparkles className="w-3.5 h-3.5 text-zinc-900 dark:text-white shrink-0" />
            <span>
              Kiritilgan matn <strong>{getLanguageFlag(detectedLang)} {getLanguageName(detectedLang)}</strong>ga o‘xshaydi.
            </span>
          </div>
          <button
            type="button"
            onClick={() => onApplyLanguageSuggestion(detectedLang)}
            className="px-2.5 py-1 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 font-medium rounded-lg text-xs hover:opacity-90 transition-opacity flex items-center gap-1 shrink-0 cursor-pointer"
          >
            <ArrowRightLeft className="w-3 h-3" />
            Almashtirish
          </button>
        </div>
      )}

      {/* Main Textarea */}
      <div className="relative flex-1 p-4">
        <textarea
          ref={textareaRef}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          onKeyDown={onKeyDown}
          placeholder="O‘zbekcha, ruscha yoki inglizcha so‘z, gap yoki matn kiriting... (Ctrl + Enter)"
          className="w-full h-full min-h-[180px] max-h-[420px] bg-transparent resize-none border-none outline-none text-zinc-900 dark:text-white placeholder:text-zinc-400 dark:placeholder:text-zinc-600 text-base sm:text-lg leading-relaxed font-normal"
          spellCheck="false"
        />
      </div>

      {/* Bottom bar: character counts & quick examples */}
      <div className="px-4 py-2.5 border-t border-zinc-100 dark:border-zinc-800/80 bg-zinc-50/50 dark:bg-zinc-900/50 flex flex-wrap items-center justify-between gap-2">
        {/* Sample phrases */}
        <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5">
          <span className="text-[11px] font-medium text-zinc-400 dark:text-zinc-500 whitespace-nowrap hidden sm:inline">
            Namunalar:
          </span>
          {SAMPLE_PHRASES.map((sample, idx) => (
            <button
              key={idx}
              type="button"
              onClick={() => onSelectSample(sample.text)}
              className="text-[11px] text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white bg-white dark:bg-zinc-800 hover:bg-zinc-100 dark:hover:bg-zinc-700/80 border border-zinc-200/80 dark:border-zinc-700/60 rounded-md px-2 py-0.5 whitespace-nowrap transition-colors cursor-pointer"
            >
              {sample.text}
            </button>
          ))}
        </div>

        {/* Counter */}
        <div className="text-[11px] text-zinc-400 dark:text-zinc-500 font-mono tabular-nums shrink-0 ml-auto">
          {charCount > 0 ? (
            <span>
              {wordCount} ta so‘z · {charCount} ta belgi
            </span>
          ) : (
            <span>0 ta belgi</span>
          )}
        </div>
      </div>
    </div>
  );
};
