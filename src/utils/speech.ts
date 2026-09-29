import { LanguageCode } from '../types';

export function speakText(text: string, lang: LanguageCode): Promise<void> {
  return new Promise((resolve) => {
    if (!('speechSynthesis' in window)) {
      console.warn('Speech synthesis not supported on this browser.');
      resolve();
      return;
    }

    window.speechSynthesis.cancel(); // cancel any active speech

    const utterance = new SpeechSynthesisUtterance(text);

    if (lang === 'ru') {
      utterance.lang = 'ru-RU';
    } else if (lang === 'en') {
      utterance.lang = 'en-US';
    } else if (lang === 'uz') {
      utterance.lang = 'uz-UZ';
    }

    utterance.rate = 0.95; // slightly slower for maximum clarity

    const voices = window.speechSynthesis.getVoices();

    let matchedVoice = voices.find((v) => {
      if (lang === 'ru') return v.lang.startsWith('ru');
      if (lang === 'en') return v.lang.startsWith('en');
      if (lang === 'uz') return v.lang.startsWith('uz');
      return false;
    });

    // If Uzbek voice is not natively installed in browser, try Turkish as close phonetic match
    if (lang === 'uz' && !matchedVoice) {
      matchedVoice = voices.find((v) => v.lang.startsWith('tr'));
    }

    if (matchedVoice) {
      utterance.voice = matchedVoice;
    }

    utterance.onend = () => resolve();
    utterance.onerror = (e) => {
      if (e.error === 'canceled' || e.error === 'interrupted') {
        resolve();
      } else {
        console.warn('Speech synthesis notice:', e.error);
        resolve();
      }
    };

    window.speechSynthesis.speak(utterance);
  });
}

export function stopSpeaking() {
  if ('speechSynthesis' in window) {
    window.speechSynthesis.cancel();
  }
}
