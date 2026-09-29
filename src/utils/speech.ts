import { LanguageCode } from '../types';

export interface SpeakOptions {
  rate?: number;
  volume?: number;
  onStart?: () => void;
  onEnd?: () => void;
  onError?: (error: string) => void;
}

// Current active playback token to prevent overlapping chunk queues
let currentPlaybackId = 0;

export function isSpeechSupported(): boolean {
  return typeof window !== 'undefined' && 'speechSynthesis' in window && 'SpeechSynthesisUtterance' in window;
}

// Helper to get all loaded voices (handles asynchronous voice list loading)
export function getVoices(): Promise<SpeechSynthesisVoice[]> {
  return new Promise((resolve) => {
    if (!isSpeechSupported()) {
      resolve([]);
      return;
    }

    const immediateVoices = window.speechSynthesis.getVoices();
    if (immediateVoices && immediateVoices.length > 0) {
      resolve(immediateVoices);
      return;
    }

    const handleVoicesChanged = () => {
      window.speechSynthesis.removeEventListener('voiceschanged', handleVoicesChanged);
      resolve(window.speechSynthesis.getVoices() || []);
    };

    window.speechSynthesis.addEventListener('voiceschanged', handleVoicesChanged);

    // Timeout fallback if event never fires
    setTimeout(() => {
      resolve(window.speechSynthesis.getVoices() || []);
    }, 400);
  });
}

// Find optimal voice based on language code
export async function getBestVoice(lang: LanguageCode): Promise<SpeechSynthesisVoice | null> {
  const voices = await getVoices();
  if (!voices || voices.length === 0) return null;

  if (lang === 'ru') {
    return (
      voices.find((v) => v.lang.toLowerCase().startsWith('ru')) ||
      voices.find((v) => v.name.toLowerCase().includes('russian')) ||
      null
    );
  }

  if (lang === 'en') {
    return (
      voices.find((v) => v.lang.toLowerCase() === 'en-us') ||
      voices.find((v) => v.lang.toLowerCase() === 'en-gb') ||
      voices.find((v) => v.lang.toLowerCase().startsWith('en')) ||
      voices.find((v) => v.name.toLowerCase().includes('english')) ||
      null
    );
  }

  if (lang === 'uz') {
    // 1. Look for native Uzbek voice
    const uzVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('uz') || v.name.toLowerCase().includes('uzbek')
    );
    if (uzVoice) return uzVoice;

    // 2. Phonetic close match: Turkish (tr-TR) is phonetically excellent for Uzbek Latin
    const trVoice = voices.find(
      (v) => v.lang.toLowerCase().startsWith('tr') || v.name.toLowerCase().includes('turkish')
    );
    if (trVoice) return trVoice;

    // 3. Fallback to default
    return voices.find((v) => v.default) || voices[0] || null;
  }

  return null;
}

// Split long text into manageable sentences to prevent Web Speech API buffer cutoffs
function splitIntoChunks(text: string): string[] {
  if (!text || text.trim() === '') return [];

  // Match sentences ending with ., !, ?, or newlines, or chunks under 160 characters
  const sentences = text.match(/[^.!?\n]+[.!?\n]*/g) || [text];
  const chunks: string[] = [];

  for (const s of sentences) {
    const trimmed = s.trim();
    if (!trimmed) continue;

    if (trimmed.length > 200) {
      // Split on commas or spaces if sentence is unusually long
      const parts = trimmed.match(/.{1,160}(\s+|$)/g) || [trimmed];
      for (const p of parts) {
        if (p.trim()) chunks.push(p.trim());
      }
    } else {
      chunks.push(trimmed);
    }
  }

  return chunks.length > 0 ? chunks : [text];
}

export async function speakText(
  text: string,
  lang: LanguageCode,
  options: SpeakOptions = {}
): Promise<void> {
  if (!isSpeechSupported()) {
    options.onError?.('Bu qurilmada ovozli o‘qish funksiyasi qo‘llab-quvvatlanmaydi.');
    return;
  }

  if (!text || text.trim() === '') {
    return;
  }

  // Cancel any existing speech
  stopSpeaking();

  const playbackId = ++currentPlaybackId;
  const chunks = splitIntoChunks(text);
  const voice = await getBestVoice(lang);

  const rate = options.rate ?? 1.0;
  const volume = options.volume ?? 1.0;

  options.onStart?.();

  let chunkIndex = 0;

  const playNextChunk = () => {
    // If stopped or another playback started, abort
    if (currentPlaybackId !== playbackId) {
      return;
    }

    if (chunkIndex >= chunks.length) {
      options.onEnd?.();
      return;
    }

    const chunkText = chunks[chunkIndex];
    chunkIndex++;

    const utterance = new SpeechSynthesisUtterance(chunkText);

    if (voice) {
      utterance.voice = voice;
      utterance.lang = voice.lang;
    } else {
      utterance.lang = lang === 'ru' ? 'ru-RU' : lang === 'en' ? 'en-US' : 'uz-UZ';
    }

    utterance.rate = rate;
    utterance.volume = volume;

    utterance.onend = () => {
      if (currentPlaybackId === playbackId) {
        playNextChunk();
      }
    };

    utterance.onerror = (e) => {
      if (e.error === 'canceled' || e.error === 'interrupted') {
        // Normal interruption/stop
        return;
      }
      console.warn('SpeechSynthesis error:', e.error);
      if (currentPlaybackId === playbackId) {
        playNextChunk(); // continue with next chunk even if one minor error occurred
      }
    };

    window.speechSynthesis.speak(utterance);
  };

  playNextChunk();
}

export function stopSpeaking(): void {
  currentPlaybackId++;
  if (isSpeechSupported()) {
    try {
      window.speechSynthesis.cancel();
    } catch (e) {
      console.warn('Error cancelling speech synthesis:', e);
    }
  }
}
