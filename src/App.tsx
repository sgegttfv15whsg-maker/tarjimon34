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
import { AudioSettingsModal } from './components/AudioSettingsModal';
import { Footer } from './components/Footer';
import {
  LanguageCode,
  SourceLanguageOption,
  TranslationTone,
  TranslationResult,
  HistoryItem,
  SpeechSettings,
  SpeechSpeed,
} from './types';
import { speakText, stopSpeaking, isSpeechSupported } from './utils/speech';
import { detectLanguageFromText } from './utils/detector';
import { ArrowRight, AlertCircle, RefreshCw } from 'lucide-react';

const STORAGE_KEYS = {
  THEME: 'lingua_theme',
  HISTORY: 'lingua_history_v2',
  TONE: 'lingua_tone',
  SOURCE_LANG: 'lingua_source_lang',
  TARGET_LANG: 'lingua_target_lang',
  SPEECH_RATE: 'lingua_speech_rate',
  SPEECH_VOLUME: 'lingua_speech_volume',
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

  // Audio / Speech Synthesis States
  const [speechSettings, setSpeechSettings] = useState<SpeechSettings>(() => {
    const savedRate = localStorage.getItem(STORAGE_KEYS.SPEECH_RATE);
    const savedVolume = localStorage.getItem(STORAGE_KEYS.SPEECH_VOLUME);
    return {
      rate: savedRate ? (parseFloat(savedRate) as SpeechSpeed) : 1.0,
      volume: savedVolume ? parseFloat(savedVolume) : 1.0,
    };
  });
  const [isAudioModalOpen, setIsAudioModalOpen] = useState<boolean>(false);
  const [activeSpeaker, setActiveSpeaker] = useState<'none' | 'input' | 'output'>('none');
  const [isTestingAudio, setIsTestingAudio] = useState<boolean>(false);

  // Save speech settings to localStorage
  const handleUpdateSpeechSettings = (newSettings: SpeechSettings) => {
    setSpeechSettings(newSettings);
    localStorage.setItem(STORAGE_KEYS.SPEECH_RATE, newSettings.rate.toString());
    localStorage.setItem(STORAGE_KEYS.SPEECH_VOLUME, newSettings.volume.toString());
  };

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

  // Stop active speech whenever user changes input text (Section 12)
  const handleInputChange = (val: string) => {
    if (activeSpeaker !== 'none') {
      stopSpeaking();
      setActiveSpeaker('none');
    }
    setInputText(val);
    if (errorMessage) setErrorMessage(null);
  };

  // Manual Stop speech (Section 4)
  const handleStopSpeaking = () => {
    stopSpeaking();
    setActiveSpeaker('none');
    setIsTestingAudio(false);
  };

  // Speak input text (Section 1, 3, 8, 9, 13)
  const handleSpeakInput = async () => {
    if (!inputText.trim()) return;

    if (!isSpeechSupported()) {
      setErrorMessage('Bu qurilmada ovozli o‘qish funksiyasi qo‘llab-quvvatlanmaydi.');
      return;
    }

    // Stop any existing speech before starting (Section 13)
    stopSpeaking();
    setActiveSpeaker('input');

    // Language resolution: if source is auto, use detected language
    const langToSpeak: LanguageCode = sourceLang === 'auto'
      ? (detectedLang || 'uz')
      : sourceLang;

    await speakText(inputText, langToSpeak, {
      rate: speechSettings.rate,
      volume: speechSettings.volume,
      onStart: () => setActiveSpeaker('input'),
      onEnd: () => setActiveSpeaker('none'),
      onError: (err) => {
        setActiveSpeaker('none');
        setErrorMessage(err);
      },
    });
  };

  // Speak output translation text (Section 2, 3, 8, 9, 13)
  const handleSpeakOutput = async (text: string, lang: LanguageCode) => {
    if (!text.trim()) return;

    if (!isSpeechSupported()) {
      setErrorMessage('Bu qurilmada ovozli o‘qish funksiyasi qo‘llab-quvvatlanmaydi.');
      return;
    }

    // Stop any existing speech before starting (Section 13)
    stopSpeaking();
    setActiveSpeaker('output');

    await speakText(text, lang, {
      rate: speechSettings.rate,
      volume: speechSettings.volume,
      onStart: () => setActiveSpeaker('output'),
      onEnd: () => setActiveSpeaker('none'),
      onError: (err) => {
        setActiveSpeaker('none');
        setErrorMessage(err);
      },
    });
  };

  // Test Speech inside Audio Settings Modal
  const handleTestSpeech = async () => {
    if (!isSpeechSupported()) {
      alert('Bu qurilmada ovozli o‘qish funksiyasi qo‘llab-quvvatlanmaydi.');
      return;
    }

    stopSpeaking();
    setIsTestingAudio(true);

    const testPhrases: Record<LanguageCode, string> = {
      uz: 'Salom! Ovozli o‘qish funksiyasi muvaffaqiyatli ishlamoqda.',
      ru: 'Здравствуйте! Функция озвучивания текста работает успешно.',
      en: 'Hello! The text to speech feature is working properly.',
    };

    const currentLang = sourceLang === 'auto' ? (detectedLang || 'uz') : sourceLang;
    const phrase = testPhrases[currentLang];

    await speakText(phrase, currentLang, {
      rate: speechSettings.rate,
      volume: speechSettings.volume,
      onStart: () => setIsTestingAudio(true),
      onEnd: () => setIsTestingAudio(false),
      onError: () => setIsTestingAudio(false),
    });
  };

  // Swap Languages Handler
  const handleSwapLanguages = () => {
    handleStopSpeaking();

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
    handleStopSpeaking();
    setSourceLang(s);
    setTargetLang(t);
    if (inputText.trim()) {
      handleTranslate(inputText, s, t);
    }
  };

  // Switch source language suggestion (e.g. user typed Uzbek while in English mode)
  const handleApplyLanguageSuggestion = (suggestedSource: LanguageCode) => {
    handleStopSpeaking();
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

    handleStopSpeaking();
    setErrorMessage(null);
    setIsLoading(true);

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
    handleStopSpeaking();
    setInputText('');
    setTranslationResult(null);
    setErrorMessage(null);
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
    handleStopSpeaking();
    setInputText(item.originalText);
    setSourceLang(item.sourceLanguage);
    setTargetLang(item.targetLanguage);
    setTranslationResult(item);
    setErrorMessage(null);
  };

  // Sample prompt selection
  const handleSelectSample = (sampleText: string) => {
    handleStopSpeaking();
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
        onOpenAudioSettings={() => setIsAudioModalOpen(true)}
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
                onClick={() => setErrorMessage(null)}
                className="font-medium underline hover:text-red-900 dark:hover:text-red-200 ml-2 cursor-pointer"
              >
                Yopish
              </button>
            </div>
          )}

          {/* Dual Translation Panels: Side-by-side on desktop, stacked on mobile */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Left Panel: Input with Speech */}
            <TranslationInput
              value={inputText}
              onChange={handleInputChange}
              onClear={handleClear}
              onSpeak={handleSpeakInput}
              onStopSpeaking={handleStopSpeaking}
              isSpeaking={activeSpeaker === 'input'}
              sourceLang={sourceLang}
              detectedLang={detectedLang}
              onApplyLanguageSuggestion={handleApplyLanguageSuggestion}
              onSelectSample={handleSelectSample}
              onKeyDown={handleKeyDown}
              onOpenAudioSettings={() => setIsAudioModalOpen(true)}
            />

            {/* Right Panel: Output with Speech */}
            <TranslationOutput
              result={translationResult}
              isLoading={isLoading}
              onSpeak={handleSpeakOutput}
              onStopSpeaking={handleStopSpeaking}
              isSpeaking={activeSpeaker === 'output'}
              onToggleFavorite={handleToggleFavoriteResult}
              isFavorite={isCurrentFavorite}
              onReverseTranslate={handleReverseTranslate}
              onOpenAudioSettings={() => setIsAudioModalOpen(true)}
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

      {/* Audio Settings Modal */}
      <AudioSettingsModal
        isOpen={isAudioModalOpen}
        onClose={() => setIsAudioModalOpen(false)}
        settings={speechSettings}
        onUpdateSettings={handleUpdateSpeechSettings}
        onTestSpeech={handleTestSpeech}
        isTesting={isTestingAudio}
      />

      {/* Footer */}
      <Footer />
    </div>
  );
}
