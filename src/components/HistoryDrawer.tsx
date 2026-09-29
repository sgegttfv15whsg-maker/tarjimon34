import React, { useState } from 'react';
import { X, Trash2, Star, Clock, Copy, Check, ArrowRight } from 'lucide-react';
import { HistoryItem } from '../types';

interface HistoryDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  items: HistoryItem[];
  onSelectItem: (item: HistoryItem) => void;
  onToggleFavorite: (id: string) => void;
  onDeleteItem: (id: string) => void;
  onClearAll: () => void;
}

export const HistoryDrawer: React.FC<HistoryDrawerProps> = ({
  isOpen,
  onClose,
  items,
  onSelectItem,
  onToggleFavorite,
  onDeleteItem,
  onClearAll,
}) => {
  const [filter, setFilter] = useState<'all' | 'favorites'>('all');
  const [copiedId, setCopiedId] = useState<string | null>(null);

  if (!isOpen) return null;

  const filteredItems = items.filter((item) =>
    filter === 'favorites' ? item.isFavorite : true
  );

  const handleCopy = async (id: string, text: string) => {
    try {
      await navigator.clipboard.writeText(text);
      setCopiedId(id);
      setTimeout(() => setCopiedId(null), 1800);
    } catch {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-xs transition-opacity"
        onClick={onClose}
      />

      <div className="fixed inset-y-0 right-0 max-w-full flex pl-10">
        <div className="w-screen max-w-md bg-white dark:bg-zinc-900 border-l border-zinc-200 dark:border-zinc-800 shadow-2xl flex flex-col">
          {/* Header */}
          <div className="px-5 py-4 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between">
            <div>
              <h2 className="text-base font-bold text-zinc-900 dark:text-white">
                Tarjimalar tarixi
              </h2>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Oldingi tarjimalar va saqlanganlar
              </p>
            </div>
            <button
              type="button"
              onClick={onClose}
              className="p-1.5 text-zinc-400 hover:text-zinc-700 dark:text-zinc-500 dark:hover:text-zinc-200 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* Filter Bar */}
          <div className="px-5 py-3 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between gap-2">
            <div className="flex items-center gap-1 p-1 bg-zinc-100 dark:bg-zinc-800/80 rounded-lg">
              <button
                type="button"
                onClick={() => setFilter('all')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors ${
                  filter === 'all'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                Barchasi ({items.length})
              </button>
              <button
                type="button"
                onClick={() => setFilter('favorites')}
                className={`px-3 py-1 text-xs font-medium rounded-md transition-colors flex items-center gap-1 ${
                  filter === 'favorites'
                    ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-white shadow-xs'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                Sevimlilar ({items.filter((i) => i.isFavorite).length})
              </button>
            </div>

            {items.length > 0 && (
              <button
                type="button"
                onClick={onClearAll}
                className="text-xs text-red-600 dark:text-red-400 hover:underline flex items-center gap-1"
                title="Tarixni tozalash"
              >
                <Trash2 className="w-3 h-3" />
                Tozalash
              </button>
            )}
          </div>

          {/* List items */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {filteredItems.length === 0 ? (
              <div className="h-64 flex flex-col items-center justify-center text-center text-zinc-400 dark:text-zinc-500">
                <Clock className="w-8 h-8 stroke-1 mb-2 opacity-60" />
                <p className="text-sm font-medium">Hozircha hech narsa yo‘q</p>
                <p className="text-xs mt-1 max-w-[200px]">
                  {filter === 'favorites'
                    ? 'Yulduzcha belgisini bosib, muhim tarjimalarni saqlab qo‘yishingiz mumkin.'
                    : 'Tarjima qilgan har bir matningiz bu yerda saqlanadi.'}
                </p>
              </div>
            ) : (
              filteredItems.map((item) => (
                <div
                  key={item.id}
                  className="group relative p-3 rounded-xl border border-zinc-200/80 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900 hover:border-zinc-300 dark:hover:border-zinc-700 transition-all space-y-2"
                >
                  <div className="flex items-center justify-between text-xs text-zinc-400 dark:text-zinc-500">
                    <span className="font-mono">
                      {item.sourceLanguage === 'ru' ? '🇷🇺 Ruscha' : '🇬🇧 Inglizcha'} →{' '}
                      {item.targetLanguage === 'ru' ? '🇷🇺 Ruscha' : '🇬🇧 Inglizcha'}
                    </span>
                    <div className="flex items-center gap-1">
                      <button
                        type="button"
                        onClick={() => onToggleFavorite(item.id)}
                        className="p-1 hover:text-amber-500 transition-colors"
                        title="Sevimlilarga qo'shish"
                      >
                        <Star
                          className={`w-3.5 h-3.5 ${
                            item.isFavorite
                              ? 'fill-amber-500 text-amber-500'
                              : 'text-zinc-400'
                          }`}
                        />
                      </button>
                      <button
                        type="button"
                        onClick={() => handleCopy(item.id, item.translation)}
                        className="p-1 hover:text-zinc-700 dark:hover:text-zinc-200 transition-colors"
                        title="Nusxalash"
                      >
                        {copiedId === item.id ? (
                          <Check className="w-3.5 h-3.5 text-emerald-500" />
                        ) : (
                          <Copy className="w-3.5 h-3.5" />
                        )}
                      </button>
                      <button
                        type="button"
                        onClick={() => onDeleteItem(item.id)}
                        className="p-1 hover:text-red-500 transition-colors"
                        title="O'chirish"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                      </button>
                    </div>
                  </div>

                  {/* Texts */}
                  <div
                    onClick={() => {
                      onSelectItem(item);
                      onClose();
                    }}
                    className="cursor-pointer space-y-1"
                  >
                    <p className="text-xs text-zinc-600 dark:text-zinc-400 line-clamp-2">
                      {item.originalText}
                    </p>
                    <p className="text-sm font-medium text-zinc-900 dark:text-white line-clamp-2">
                      {item.translation}
                    </p>
                  </div>

                  {/* Load action hint */}
                  <div className="pt-1 flex items-center justify-end">
                    <button
                      type="button"
                      onClick={() => {
                        onSelectItem(item);
                        onClose();
                      }}
                      className="text-[11px] font-medium text-zinc-600 hover:text-zinc-900 dark:text-zinc-400 dark:hover:text-white flex items-center gap-1"
                    >
                      Tarjimonga yuklash <ArrowRight className="w-3 h-3" />
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      </div>
    </div>
  );
};
