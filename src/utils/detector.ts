import { LanguageCode } from '../types';

// Common Uzbek words and stems
const UZBEK_WORDS = new Set([
  'salom', 'qalaysan', 'qalay', 'ishlar', 'ishlaring', 'bugun', 'kecha', 'ertaga',
  'men', 'sen', 'u', 'biz', 'siz', 'ular', 'kitob', 'maktab', 'yaxshi', 'yomon',
  'rahmat', 'iltimos', 'nima', 'qayerda', 'qachon', 'nega', 'qanday', 'qaysi',
  'bordi', 'bordim', 'bordik', 'bordilar', 'ketyapman', 'keldim', 'kelyapman',
  'qilmoq', 'qilish', 'qildim', 'qildik', 'o‘qituvchi', 'o\'qituvchi', 'oʻqituvchi',
  'o‘quvchi', 'o\'quvchi', 'oʻquvchi', 'o‘qiyman', 'o\'qiyman', 'gap', 'so‘z', 'so\'z',
  'til', 'havo', 'juda', 'emas', 'bor', 'yo‘q', 'yo\'q', 'katta', 'kichik', 'odam',
  'inson', 'bola', 'ish', 'uy', 'do‘st', 'do\'st', 'sevaman', 'yaxshiman', 'maktabga',
  'kitobni', 'yozdim', 'o‘qish', 'dars', 'g‘ijduvonga', 'toshkent', 'o‘zbekiston'
]);

// Common English words
const ENGLISH_WORDS = new Set([
  'the', 'is', 'are', 'am', 'was', 'were', 'you', 'your', 'he', 'she', 'it', 'we', 'they',
  'i', 'how', 'what', 'where', 'when', 'why', 'who', 'hello', 'hi', 'school', 'book',
  'books', 'went', 'go', 'going', 'today', 'good', 'reading', 'read', 'my', 'friend',
  'like', 'love', 'please', 'thank', 'thanks', 'this', 'that', 'with', 'from', 'have',
  'has', 'not', 'can', 'will', 'do', 'does', 'did', 'very', 'well', 'morning', 'night'
]);

export function detectLanguageFromText(text: string): LanguageCode | null {
  if (!text || text.trim() === '') return null;

  const trimmed = text.trim().toLowerCase();

  // 1. Cyrillic check: if mostly Cyrillic characters -> 'ru'
  const cyrillicMatches = text.match(/[\u0400-\u04FF]/g) || [];
  const latinMatches = text.match(/[a-zA-Z]/g) || [];

  if (cyrillicMatches.length > latinMatches.length && cyrillicMatches.length > 0) {
    return 'ru';
  }

  if (latinMatches.length === 0) {
    return null;
  }

  // 2. Strong Uzbek character combinations & orthography:
  // o‘, g‘, o', g', oʻ, gʻ, o’, g’, sh, ch, q (when not qu)
  const hasUzbekSpecialChars = /[og][‘'ʻ’`]|sh|ch/i.test(trimmed);
  // In Uzbek, 'q' is often followed by vowels (a, o, i, u, e) without 'u' (e.g. qalay, qor, oq). In English, 'q' is almost always 'qu'
  const hasUzbekQ = /q[^u\s]|q$|[^a-z]q/i.test(trimmed);

  // 3. Word token matching
  const words = trimmed.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'ʻ’‘]/g, ' ').split(/\s+/).filter(Boolean);
  let uzbekScore = 0;
  let englishScore = 0;

  for (const word of words) {
    if (UZBEK_WORDS.has(word)) {
      uzbekScore += 3;
    }
    if (ENGLISH_WORDS.has(word)) {
      englishScore += 3;
    }

    // Common Uzbek suffixes
    if (/(?:lar|ga|ka|qa|da|dan|ning|ni|di|dim|dik|dilar|man|san|miz|siz|yapti|yapman|moqda)$/.test(word) && word.length > 4) {
      uzbekScore += 1.5;
    }

    // Uzbek specific letter 'q'
    if (word.includes('q') && !word.includes('qu')) {
      uzbekScore += 2;
    }
  }

  if (hasUzbekSpecialChars) {
    uzbekScore += 3;
  }
  if (hasUzbekQ) {
    uzbekScore += 3;
  }

  if (uzbekScore > englishScore) {
    return 'uz';
  } else if (englishScore > uzbekScore) {
    return 'en';
  }

  // If tied or unsure, check common character trigrams or default based on features
  if (hasUzbekSpecialChars || hasUzbekQ) {
    return 'uz';
  }

  // Default Latin to English if no Uzbek markers found
  return 'en';
}

export function getLanguageName(code: LanguageCode | 'auto'): string {
  switch (code) {
    case 'uz':
      return 'O‘zbek tili';
    case 'ru':
      return 'Rus tili';
    case 'en':
      return 'Ingliz tili';
    case 'auto':
      return 'Avto aniqlash';
    default:
      return '';
  }
}

export function getLanguageFlag(code: LanguageCode | 'auto'): string {
  switch (code) {
    case 'uz':
      return '🇺🇿';
    case 'ru':
      return '🇷🇺';
    case 'en':
      return '🇬🇧';
    case 'auto':
      return '✨';
    default:
      return '';
  }
}
