/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useEffect } from 'react';
import { Header } from './components/Header';
import { LanguageSelector } from './components/LanguageSelector';
import { TranslationInput } from './components/TranslationInput';
import { TranslationOutput } from './components/TranslationOutput';
import { HistoryDrawer } from './components/HistoryDrawer';
import { Footer } from './components/Footer';
import {
  LanguageCode,
  SourceLanguageOption,
  TranslationTone,
  TranslationResult,
  HistoryItem,
} from './types';
import { speakText, stopSpeaking } from './utils/speech';
import { detectLanguageFromText } from './utils/detector';
import { ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';

const STORAGE_KEYS = {
  THEME: 'lingua_theme',
  HISTORY: 'lingua_history_v2',
  TONE: 'lingua_tone',
  SOURCE_LANG: 'lingua_source_lang',
  TARGET_LANG: 'lingua_target_lang',
};

export default function App() {
  // Theme state
  const [isDarkMode, setIsDarkMode] = useState<boolean>(() => {
    if (typeof window !== 'undefined') {
      const savedTheme = localStorage.getItem(STORAGE_KEYS.THEME);
      if (savedTheme) {
        return savedTheme === 'dark';
      }
      return window.matchMedia('(prefers-color-scheme: dark)').matches;
    }
    return true;
  });

  // Apply dark mode class to html element
  useEffect(() => {
    const root = document.documentElement;
    if (isDarkMode) {
      root.classList.add('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'dark');
    } else {
      root.classList.remove('dark');
      localStorage.setItem(STORAGE_KEYS.THEME, 'light');
    }
  }, [isDarkMode]);

  const toggleDarkMode = () => setIsDarkMode((prev) => !prev);

  // Translation States (Default: Uzbek -> English)
  const [sourceLang, setSourceLang] = useState<SourceLanguageOption>(() => {
    return (localStorage.getItem(STORAGE_KEYS.SOURCE_LANG) as SourceLanguageOption) || 'uz';
  });
  const [targetLang, setTargetLang] = useState<LanguageCode>(() => {
    return (localStorage.getItem(STORAGE_KEYS.TARGET_LANG) as LanguageCode) || 'en';
  });
  const [tone, setTone] = useState<TranslationTone>(() => {
    return (localStorage.getItem(STORAGE_KEYS.TONE) as TranslationTone) || 'standard';
  });

  const [inputText, setInputText] = useState<string>('');
  const [translationResult, setTranslationResult] = useState<TranslationResult | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isSpeakingInput, setIsSpeakingInput] = useState<boolean>(false);
  const [isSpeakingOutput, setIsSpeakingOutput] = useState<boolean>(false);

  // History Drawer State
  const [isHistoryOpen, setIsHistoryOpen] = useState<boolean>(false);
  const [historyItems, setHistoryItems] = useState<HistoryItem[]>(() => {
    try {
      const saved = localStorage.getItem(STORAGE_KEYS.HISTORY);
      return saved ? JSON.parse(saved) : [];
    } catch {
      return [];
    }
  });

  // Persist language selection
  useEffect(() => {
    localStorage.setItem(STORAGE_KEYS.SOURCE_LANG, sourceLang);
    localStorage.setItem(STORAGE_KEYS.TARGET_LANG, targetLang);
  }, [sourceLang, targetLang]);

  // Save history to local storage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEYS.HISTORY, JSON.stringify(historyItems));
    } catch (e) {
      console.warn('Could not save to localStorage:', e);
    }
  }, [historyItems]);

  // Detected language from current input text
  const detectedLang = detectLanguageFromText(inputText);

  // Swap Languages Handler
  const handleSwapLanguages = () => {
    stopSpeaking();
    setIsSpeakingInput(false);
    setIsSpeakingOutput(false);

    const currentActualSource = sourceLang === 'auto' ? (detectedLang || 'uz') : sourceLang;
    const newSource = targetLang;
    const newTarget = currentActualSource;

    setSourceLang(newSource);
    setTargetLang(newTarget);

    // If we have a translation result, swap the text as well!
    if (translationResult?.translation) {
      const currentTranslation = translationResult.translation;
      setInputText(currentTranslation);
      setTranslationResult({
        originalText: currentTranslation,
        translation: inputText,
        sourceLanguage: newSource,
        targetLanguage: newTarget,
        tone: tone,
        timestamp: Date.now(),
      });
    }
  };

  // Switch to specific pair shortcut
  const handleSelectPair = (s: LanguageCode, t: LanguageCode) => {
    setSourceLang(s);
    setTargetLang(t);
    if (inputText.trim()) {
      handleTranslate(inputText, s, t);
    }
  };

  // Switch source language suggestion (e.g. user typed Uzbek while in English mode)
  const handleApplyLanguageSuggestion = (suggestedSource: LanguageCode) => {
    const newTarget = targetLang === suggestedSource
      ? (suggestedSource === 'uz' ? 'en' : 'uz')
      : targetLang;

    setSourceLang(suggestedSource);
    setTargetLang(newTarget);
    if (inputText.trim()) {
      handleTranslate(inputText, suggestedSource, newTarget);
    }
  };

  // Handle translation execution
  const handleTranslate = async (
    overrideText?: string,
    overrideSource?: SourceLanguageOption,
    overrideTarget?: LanguageCode
  ) => {
    const textToTranslate = (overrideText !== undefined ? overrideText : inputText).trim();

    if (!textToTranslate) {
      setErrorMessage('Iltimos, tarjima qilish uchun matn kiriting.');
      return;
    }

    setErrorMessage(null);
    setIsLoading(true);
    stopSpeaking();

    const activeSourceOption = overrideSource || sourceLang;
    let effectiveTarget = overrideTarget || targetLang;

    // Detect actual source language
    let effectiveSource: LanguageCode = activeSourceOption === 'auto'
      ? (detectLanguageFromText(textToTranslate) || 'uz')
      : activeSourceOption;

    if (activeSourceOption === 'auto') {
      if (effectiveSource === 'uz') {
        effectiveTarget = (effectiveTarget === 'uz' ? 'en' : effectiveTarget) || 'en';
      } else if (effectiveSource === 'ru') {
        effectiveTarget = (effectiveTarget === 'ru' ? 'uz' : effectiveTarget) || 'uz';
      } else {
        effectiveTarget = (effectiveTarget === 'en' ? 'uz' : effectiveTarget) || 'uz';
      }
    } else if (effectiveSource === effectiveTarget) {
      effectiveTarget = effectiveSource === 'uz' ? 'en' : 'uz';
    }

    try {
      const response = await fetch('/api/translate', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          text: textToTranslate,
          from: activeSourceOption,
          to: effectiveTarget,
          tone: tone,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Tarjima vaqtida xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.');
      }

      const newResult: TranslationResult = {
        originalText: textToTranslate,
        translation: data.translation,
        sourceLanguage: data.detectedSourceLanguage || effectiveSource,
        targetLanguage: data.targetLanguage || effectiveTarget,
        tone: tone,
        partOfSpeech: data.partOfSpeech,
        transliteration: data.transliteration,
        alternatives: data.alternatives,
        synonyms: data.synonyms,
        notes: data.notes,
        examples: data.examples,
        timestamp: Date.now(),
      };

      setTranslationResult(newResult);

      // Add to history
      setHistoryItems((prev) => {
        const filtered = prev.filter(
          (item) => item.originalText.toLowerCase() !== textToTranslate.toLowerCase()
        );
        const newItem: HistoryItem = {
          ...newResult,
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          isFavorite: false,
        };
        return [newItem, ...filtered].slice(0, 60);
      });
    } catch (err: any) {
      console.error('Translation error:', err);
      setErrorMessage(
        err.message || 'Tarjima vaqtida xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.'
      );
    } finally {
      setIsLoading(false);
    }
  };

  // Keyboard shortcut: Ctrl + Enter / Cmd + Enter
  const handleKeyDown = (e: React.KeyboardEvent<HTMLTextAreaElement>) => {
    if ((e.ctrlKey || e.metaKey) && e.key === 'Enter') {
      e.preventDefault();
      handleTranslate();
    }
  };

  // Clear Input & Output
  const handleClear = () => {
    setInputText('');
    setTranslationResult(null);
    setErrorMessage(null);
    stopSpeaking();
    setIsSpeakingInput(false);
    setIsSpeakingOutput(false);
  };

  // Speech for Input text
  const handleSpeakInput = async () => {
    if (!inputText.trim()) return;
    const lang = sourceLang === 'auto' ? (detectedLang || 'uz') : sourceLang;
    setIsSpeakingInput(true);
    await speakText(inputText, lang);
    setIsSpeakingInput(false);
  };

  // Speech for Output text
  const handleSpeakOutput = async (text: string, lang: LanguageCode) => {
    if (!text.trim()) return;
    setIsSpeakingOutput(true);
    await speakText(text, lang);
    setIsSpeakingOutput(false);
  };

  // Toggle favorite on current result
  const handleToggleFavoriteResult = (result: TranslationResult) => {
    setHistoryItems((prev) => {
      const match = prev.find((item) => item.originalText === result.originalText);
      if (match) {
        return prev.map((item) =>
          item.id === match.id ? { ...item, isFavorite: !item.isFavorite } : item
        );
      } else {
        const newItem: HistoryItem = {
          ...result,
          id: `${Date.now()}_${Math.random().toString(36).substr(2, 6)}`,
          isFavorite: true,
        };
        return [newItem, ...prev];
      }
    });
  };

  // Check if current result is favorite
  const isCurrentFavorite = Boolean(
    translationResult &&
      historyItems.some(
        (item) =>
          item.originalText === translationResult.originalText &&
          item.translation === translationResult.translation &&
          item.isFavorite
      )
  );

  // Reverse translate from output
  const handleReverseTranslate = () => {
    if (!translationResult?.translation) return;
    const textToReverse = translationResult.translation;
    handleSwapLanguages();
    handleTranslate(textToReverse);
  };

  // Load from History
  const handleSelectHistoryItem = (item: HistoryItem) => {
    setInputText(item.originalText);
    setSourceLang(item.sourceLanguage);
    setTargetLang(item.targetLanguage);
    setTranslationResult(item);
    setErrorMessage(null);
  };

  // Sample prompt selection
  const handleSelectSample = (sampleText: string) => {
    setInputText(sampleText);
    handleTranslate(sampleText);
  };

  // Tone change
  const handleToneChange = (newTone: TranslationTone) => {
    setTone(newTone);
    localStorage.setItem(STORAGE_KEYS.TONE, newTone);
    if (inputText.trim()) {
      handleTranslate();
    }
  };

  return (
    <div className="min-h-screen flex flex-col bg-zinc-50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 transition-colors duration-200">
      {/* Top Navigation */}
      <Header
        isDarkMode={isDarkMode}
        onToggleDarkMode={toggleDarkMode}
        onOpenHistory={() => setIsHistoryOpen(true)}
        historyCount={historyItems.length}
      />

      {/* Main Container */}
      <main className="flex-1 max-w-6xl w-full mx-auto px-4 sm:px-6 pt-6 pb-12">
        <div className="space-y-4">
          {/* Language Selector Bar with Quick Pairs */}
          <LanguageSelector
            sourceLanguage={sourceLang}
            targetLanguage={targetLang}
            tone={tone}
            onSourceChange={setSourceLang}
            onTargetChange={setTargetLang}
            onSwapLanguages={handleSwapLanguages}
            onToneChange={handleToneChange}
            detectedLang={detectedLang}
            onSelectPair={handleSelectPair}
          />

          {/* Error Message Banner */}
          {errorMessage && (
            <div className="p-3.5 bg-red-50 dark:bg-red-950/40 border border-red-200 dark:border-red-900/60 rounded-xl flex items-center justify-between text-xs text-red-800 dark:text-red-300 transition-all">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-red-600 dark:text-red-400 shrink-0" />
                <span>{errorMessage}</span>
              </div>
              <button
                type="button"
                onClick={() => handleTranslate()}
                className="font-medium underline hover:text-red-900 dark:hover:text-red-200 ml-2 cursor-pointer"
              >
                Qaytadan urinish
              </button>
            </div>
          )}

          {/* Dual Translation Panels: Side-by-side on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Panel: Input */}
            <TranslationInput
              value={inputText}
              onChange={(val) => {
                setInputText(val);
                if (errorMessage) setErrorMessage(null);
              }}
              onClear={handleClear}
              onSpeak={handleSpeakInput}
              isSpeaking={isSpeakingInput}
              sourceLang={sourceLang}
              detectedLang={detectedLang}
              onApplyLanguageSuggestion={handleApplyLanguageSuggestion}
              onSelectSample={handleSelectSample}
              onKeyDown={handleKeyDown}
            />

            {/* Right Panel: Output */}
            <TranslationOutput
              result={translationResult}
              isLoading={isLoading}
              onSpeak={handleSpeakOutput}
              isSpeaking={isSpeakingOutput}
              onToggleFavorite={handleToggleFavoriteResult}
              isFavorite={isCurrentFavorite}
              onReverseTranslate={handleReverseTranslate}
            />
          </div>

          {/* Action Row: Big "Tarjima qilish" Button & Keyboard Hint */}
          <div className="flex flex-col sm:flex-row items-center justify-between gap-3 pt-2">
            <div className="text-xs text-zinc-500 dark:text-zinc-400 order-2 sm:order-1 flex items-center gap-2">
              <kbd className="px-2 py-1 font-mono text-[11px] bg-zinc-200 dark:bg-zinc-800 border border-zinc-300 dark:border-zinc-700 rounded text-zinc-700 dark:text-zinc-300">
                Ctrl + Enter
              </kbd>
              <span>orqali tezkor tarjima qilish</span>
            </div>

            {/* Primary Translate Button */}
            <button
              type="button"
              onClick={() => handleTranslate()}
              disabled={isLoading || !inputText.trim()}
              className="w-full sm:w-auto px-8 py-3.5 bg-zinc-900 hover:bg-zinc-800 text-white dark:bg-white dark:text-zinc-900 dark:hover:bg-zinc-100 font-semibold text-sm rounded-xl transition-all duration-200 shadow-sm active:scale-98 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2.5 order-1 sm:order-2 cursor-pointer"
            >
              {isLoading ? (
                <>
                  <RefreshCw className="w-4 h-4 animate-spin" />
                  <span>Tarjima qilinmoqda...</span>
                </>
              ) : (
                <>
                  <span>Tarjima qilish</span>
                  <ArrowRight className="w-4 h-4" />
                </>
              )}
            </button>
          </div>
        </div>
      </main>

      {/* History and Favorites Drawer */}
      <HistoryDrawer
        isOpen={isHistoryOpen}
        onClose={() => setIsHistoryOpen(false)}
        items={historyItems}
        onSelectItem={handleSelectHistoryItem}
        onToggleFavorite={(id) => {
          setHistoryItems((prev) =>
            prev.map((item) =>
              item.id === id ? { ...item, isFavorite: !item.isFavorite } : item
            )
          );
        }}
        onDeleteItem={(id) => {
          setHistoryItems((prev) => prev.filter((item) => item.id !== id));
        }}
        onClearAll={() => {
          setHistoryItems([]);
        }}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
