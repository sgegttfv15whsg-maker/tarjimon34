import React from 'react';
import { X, Volume2, Gauge, Check } from 'lucide-react';
import { SpeechSpeed, SpeechSettings } from '../types';

interface AudioSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  settings: SpeechSettings;
  onUpdateSettings: (newSettings: SpeechSettings) => void;
  onTestSpeech: () => void;
  isTesting: boolean;
}

export const AudioSettingsModal: React.FC<AudioSettingsModalProps> = ({
  isOpen,
  onClose,
  settings,
  onUpdateSettings,
  onTestSpeech,
  isTesting,
}) => {
  if (!isOpen) return null;

  const handleSpeedSelect = (rate: SpeechSpeed) => {
    onUpdateSettings({ ...settings, rate });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const volume = parseFloat(e.target.value);
    onUpdateSettings({ ...settings, volume });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      {/* Modal Dialog */}
      <div className="relative w-full max-w-sm bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 rounded-2xl p-5 shadow-2xl space-y-5 z-10 transition-all">
        {/* Header */}
        <div className="flex items-center justify-between pb-3 border-b border-zinc-100 dark:border-zinc-800">
          <div className="flex items-center gap-2">
            <div className="p-1.5 rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-900 dark:text-white">
              <Volume2 className="w-4 h-4" />
            </div>
            <div>
              <h3 className="text-sm font-bold text-zinc-900 dark:text-white">
                Ovoz sozlamalari
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Text-to-Speech tezligi va balandligi
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        {/* Speed Selector (Section 6) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Gauge className="w-3.5 h-3.5 text-zinc-500" />
              Ovoz tezligi
            </span>
            <span className="font-mono text-zinc-400 dark:text-zinc-500">
              {settings.rate === 0.75 ? '0.75x' : settings.rate === 1.25 ? '1.25x' : '1.0x'}
            </span>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <button
              type="button"
              onClick={() => handleSpeedSelect(0.75)}
              className={`py-2 px-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                settings.rate === 0.75
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <span className="text-sm">🐢</span>
              <span>Sekin</span>
            </button>

            <button
              type="button"
              onClick={() => handleSpeedSelect(1.0)}
              className={`py-2 px-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                settings.rate === 1.0
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <span className="text-sm">▶️</span>
              <span>Normal</span>
            </button>

            <button
              type="button"
              onClick={() => handleSpeedSelect(1.25)}
              className={`py-2 px-3 rounded-xl border text-xs font-medium flex flex-col items-center justify-center gap-1 transition-all cursor-pointer ${
                settings.rate === 1.25
                  ? 'border-zinc-900 bg-zinc-900 text-white dark:border-white dark:bg-white dark:text-zinc-900 shadow-xs'
                  : 'border-zinc-200 dark:border-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-50 dark:hover:bg-zinc-800/60'
              }`}
            >
              <span className="text-sm">⚡</span>
              <span>Tez</span>
            </button>
          </div>
        </div>

        {/* Volume Control (Section 7) */}
        <div className="space-y-2">
          <div className="flex items-center justify-between text-xs">
            <span className="font-semibold text-zinc-800 dark:text-zinc-200 flex items-center gap-1.5">
              <Volume2 className="w-3.5 h-3.5 text-zinc-500" />
              Ovoz balandligi
            </span>
            <span className="font-mono text-zinc-400 dark:text-zinc-500">
              {Math.round(settings.volume * 100)}%
            </span>
          </div>

          <input
            type="range"
            min="0"
            max="1"
            step="0.05"
            value={settings.volume}
            onChange={handleVolumeChange}
            className="w-full accent-zinc-900 dark:accent-white cursor-pointer h-1.5 bg-zinc-200 dark:bg-zinc-700 rounded-lg appearance-none"
          />
        </div>

        {/* Test Speech Button & Done */}
        <div className="pt-2 flex items-center justify-between gap-3 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onTestSpeech}
            className="text-xs font-medium text-zinc-700 dark:text-zinc-300 hover:text-zinc-900 dark:hover:text-white flex items-center gap-1.5 py-1.5 px-2.5 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors cursor-pointer"
          >
            <Volume2 className="w-3.5 h-3.5" />
            <span>{isTesting ? 'O‘qilmoqda...' : 'Sinab ko‘rish'}</span>
          </button>

          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 bg-zinc-900 text-white dark:bg-white dark:text-zinc-900 rounded-xl text-xs font-semibold hover:opacity-90 transition-opacity flex items-center gap-1 cursor-pointer"
          >
            <Check className="w-3.5 h-3.5" />
            <span>Tayyor</span>
          </button>
        </div>
      </div>
    </div>
  );
};
