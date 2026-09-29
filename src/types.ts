export type LanguageCode = 'uz' | 'ru' | 'en';
export type SourceLanguageOption = 'auto' | 'uz' | 'ru' | 'en';
export type TranslationTone = 'standard' | 'formal' | 'casual';

export type SpeechSpeed = 0.75 | 1.0 | 1.25;

export interface SpeechSettings {
  rate: SpeechSpeed;
  volume: number; // 0.0 to 1.0
}

export interface TranslationResult {
  originalText: string;
  translation: string;
  sourceLanguage: LanguageCode;
  targetLanguage: LanguageCode;
  tone: TranslationTone;
  partOfSpeech?: string;
  transliteration?: string;
  alternatives?: string[];
  synonyms?: string[];
  notes?: string;
  examples?: Array<{ original: string; translated: string }>;
  timestamp: number;
}

export interface HistoryItem extends TranslationResult {
  id: string;
  isFavorite: boolean;
}
