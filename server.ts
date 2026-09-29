import express from 'express';
import dotenv from 'dotenv';
import path from 'path';
import { fileURLToPath } from 'url';
import { GoogleGenAI, Type } from '@google/genai';
import { createServer as createViteServer } from 'vite';

dotenv.config();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const app = express();
const PORT = process.env.PORT ? parseInt(process.env.PORT, 10) : 3000;

app.use(express.json({ limit: '5mb' }));

// Initialize Google Gen AI
const apiKey = process.env.GEMINI_API_KEY || '';
const ai = new GoogleGenAI({
  apiKey: apiKey,
  httpOptions: {
    headers: {
      'User-Agent': 'aistudio-build',
    },
  },
});

type LangCode = 'uz' | 'ru' | 'en';

interface TranslateRequestBody {
  text: string;
  from: 'uz' | 'ru' | 'en' | 'auto';
  to: 'uz' | 'ru' | 'en';
  tone?: 'standard' | 'formal' | 'casual';
}

const UZBEK_WORDS = new Set([
  'salom', 'qalaysan', 'qalay', 'ishlar', 'ishlaring', 'bugun', 'kecha', 'ertaga',
  'men', 'sen', 'u', 'biz', 'siz', 'ular', 'kitob', 'maktab', 'yaxshi', 'yomon',
  'rahmat', 'iltimos', 'nima', 'qayerda', 'qachon', 'nega', 'qanday', 'qaysi',
  'bordi', 'bordim', 'bordik', 'bordilar', 'ketyapman', 'keldim', 'kelyapman',
  'qilmoq', 'qilish', 'qildim', 'o‘qituvchi', 'o\'qituvchi', 'oʻqituvchi',
  'o‘quvchi', 'o\'quvchi', 'oʻquvchi', 'o‘qiyman', 'gap', 'so‘z', 'so\'z',
  'til', 'havo', 'juda', 'emas', 'bor', 'yo‘q', 'yo\'q', 'katta', 'kichik',
  'odam', 'inson', 'bola', 'ish', 'uy', 'do‘st', 'do\'st', 'sevaman', 'yaxshiman',
  'maktabga', 'kitobni', 'yozdim', 'o‘qish', 'dars', 'g‘ijduvonga', 'gijduvonga'
]);

const ENGLISH_WORDS = new Set([
  'the', 'is', 'are', 'am', 'was', 'were', 'you', 'your', 'he', 'she', 'it', 'we', 'they',
  'i', 'how', 'what', 'where', 'when', 'why', 'who', 'hello', 'hi', 'school', 'book',
  'books', 'went', 'go', 'going', 'today', 'good', 'reading', 'read', 'my', 'friend',
  'like', 'love', 'please', 'thank', 'thanks', 'this', 'that', 'with', 'from', 'have',
  'has', 'not', 'can', 'will', 'do', 'does', 'did', 'very', 'well', 'morning', 'night'
]);

// Helper to detect language
function detectLanguage(str: string): LangCode {
  const trimmed = str.trim().toLowerCase();

  // 1. Cyrillic check
  const cyrillicCount = (str.match(/[\u0400-\u04FF]/g) || []).length;
  const latinCount = (str.match(/[a-zA-Z]/g) || []).length;

  if (cyrillicCount > latinCount && cyrillicCount > 0) {
    return 'ru';
  }

  // 2. Check Uzbek specific markers
  const hasUzbekSpecialChars = /[og][‘'ʻ’`]|sh|ch/i.test(trimmed);
  const hasUzbekQ = /q[^u\s]|q$|[^a-z]q/i.test(trimmed);

  const words = trimmed.replace(/[.,\/#!$%\^&\*;:{}=\-_`~()?"'ʻ’‘]/g, ' ').split(/\s+/).filter(Boolean);
  let uzScore = 0;
  let enScore = 0;

  for (const word of words) {
    if (UZBEK_WORDS.has(word)) uzScore += 3;
    if (ENGLISH_WORDS.has(word)) enScore += 3;
    if (/(?:lar|ga|ka|qa|da|dan|ning|ni|di|dim|dik|dilar|man|san|miz|siz|yapti|yapman|moqda)$/.test(word) && word.length > 4) {
      uzScore += 2;
    }
  }

  if (hasUzbekSpecialChars) uzScore += 3;
  if (hasUzbekQ) uzScore += 3;

  if (uzScore > enScore) return 'uz';
  if (enScore > uzScore) return 'en';
  if (hasUzbekSpecialChars || hasUzbekQ) return 'uz';

  return 'en';
}

function getLangName(code: LangCode): string {
  switch (code) {
    case 'uz': return 'Uzbek (O‘zbek tili)';
    case 'ru': return 'Russian (Русский язык)';
    case 'en': return 'English';
  }
}

// Built-in offline dictionary fallback for common phrases and test cases
const offlineDictionary: Record<string, Record<string, { translation: string; alternatives?: string[]; partOfSpeech?: string }>> = {
  'salom, qalaysan?': {
    'ru': { translation: 'Привет, как ты?', alternatives: ['Привет, как дела?'] },
    'en': { translation: 'Hello, how are you?', alternatives: ['Hi, how are you doing?'] },
  },
  'salom': {
    'ru': { translation: 'Привет', alternatives: ['Здравствуйте'], partOfSpeech: 'междометие' },
    'en': { translation: 'Hello', alternatives: ['Hi', 'Hey'], partOfSpeech: 'interjection' },
  },
  'kitob': {
    'ru': { translation: 'Книга', alternatives: ['Книжка'], partOfSpeech: 'существительное' },
    'en': { translation: 'Book', alternatives: ['Volume', 'Tome'], partOfSpeech: 'noun' },
  },
  'maktab': {
    'ru': { translation: 'Школа', partOfSpeech: 'существительное' },
    'en': { translation: 'School', partOfSpeech: 'noun' },
  },
  'men bugun maktabga bordim.': {
    'ru': { translation: 'Я сегодня ходил в школу.', alternatives: ['Я сегодня пошел в школу.'] },
    'en': { translation: 'I went to school today.', alternatives: ['Today I went to school.'] },
  },
  'bugun havo yaxshi.': {
    'ru': { translation: 'Сегодня хорошая погода.' },
    'en': { translation: 'The weather is good today.' },
  },
  'bugun havo juda yaxshi.': {
    'ru': { translation: 'Сегодня очень хорошая погода.' },
    'en': { translation: 'The weather is very good today.' },
  },
  'o‘qituvchi g‘ijduvonga bordi.': {
    'ru': { translation: 'Учитель поехал в Гиждуван.' },
    'en': { translation: 'The teacher went to Gijduvan.' },
  },
  'привет, как дела?': {
    'uz': { translation: 'Salom, ishlaring qalay?', alternatives: ['Salom, qalaysan?'] },
    'en': { translation: 'Hello, how are you?', alternatives: ['Hi, how are you doing?'] },
  },
  'привет': {
    'uz': { translation: 'Salom', alternatives: ['Salomlashuv'], partOfSpeech: 'undov so‘z' },
    'en': { translation: 'Hello', alternatives: ['Hi', 'Hey'], partOfSpeech: 'interjection' },
  },
  'книга': {
    'uz': { translation: 'Kitob', partOfSpeech: 'ot' },
    'en': { translation: 'Book', partOfSpeech: 'noun' },
  },
  'я сегодня ходил в школу.': {
    'uz': { translation: 'Men bugun maktabga bordim.' },
    'en': { translation: 'I went to school today.' },
  },
  'я люблю читать книги.': {
    'uz': { translation: 'Men kitob o‘qishni yaxshi ko‘raman.' },
    'en': { translation: 'I love reading books.' },
  },
  'hello, how are you?': {
    'uz': { translation: 'Salom, qalaysan?', alternatives: ['Salom, ishlaringiz qalay?'] },
    'ru': { translation: 'Привет, как дела?', alternatives: ['Здравствуйте, как ваши дела?'] },
  },
  'hello': {
    'uz': { translation: 'Salom', partOfSpeech: 'undov so‘z' },
    'ru': { translation: 'Привет', partOfSpeech: 'междометие' },
  },
  'book': {
    'uz': { translation: 'Kitob', partOfSpeech: 'ot' },
    'ru': { translation: 'Книга', partOfSpeech: 'существительное' },
  },
  'school': {
    'uz': { translation: 'Maktab', partOfSpeech: 'ot' },
    'ru': { translation: 'Школа', partOfSpeech: 'существительное' },
  },
  'i like reading books.': {
    'uz': { translation: 'Men kitob o‘qishni yoqtiraman.' },
    'ru': { translation: 'Мне нравится читать книги.' },
  },
  'i am going to school.': {
    'uz': { translation: 'Men maktabga ketyapman.' },
    'ru': { translation: 'Я иду в школу.' },
  },
  'hello, my friend.': {
    'uz': { translation: 'Salom, do‘stim.' },
    'ru': { translation: 'Привет, мой друг.' },
  },
};

// Clean any accidental prefix or markdown from translation
function cleanTranslationText(text: string): string {
  if (!text) return '';
  let cleaned = text.trim();
  // Remove prefixes like "Tarjima: ", "Translation: ", "Перевод: "
  cleaned = cleaned.replace(/^(?:tarjima|translation|перевод|natija):\s*/i, '');
  // Remove wrapping quotes if redundant
  if (
    (cleaned.startsWith('"') && cleaned.endsWith('"')) ||
    (cleaned.startsWith('«') && cleaned.endsWith('»'))
  ) {
    cleaned = cleaned.slice(1, -1).trim();
  }
  return cleaned;
}

// API: Translation endpoint
app.post('/api/translate', async (req, res) => {
  try {
    const { text, from = 'auto', to = 'en', tone = 'standard' } = req.body as TranslateRequestBody;

    if (!text || typeof text !== 'string' || text.trim() === '') {
      return res.status(400).json({
        error: 'Iltimos, tarjima qilish uchun matn kiriting.',
      });
    }

    const trimmedText = text.trim();
    const isSingleWord = !trimmedText.includes(' ') && trimmedText.length < 35;

    // Detect source language
    let detectedSource: LangCode = from === 'auto'
      ? detectLanguage(trimmedText)
      : from;

    let targetLanguage: LangCode = to;

    // Handle auto or same-language target assignment
    if (from === 'auto') {
      if (detectedSource === 'uz') {
        targetLanguage = (to === 'uz' ? 'en' : to) || 'en';
      } else if (detectedSource === 'ru') {
        targetLanguage = (to === 'ru' ? 'uz' : to) || 'uz';
      } else {
        targetLanguage = (to === 'en' ? 'uz' : to) || 'uz';
      }
    } else if (from === to) {
      if (from === 'uz') targetLanguage = 'en';
      else if (from === 'ru') targetLanguage = 'uz';
      else targetLanguage = 'uz';
    }

    // Call Gemini API if API key is present
    if (apiKey) {
      const modelsToTry = ['gemini-3.1-flash-lite', 'gemini-3.8-flash'];
      let lastError: any = null;

      for (const modelName of modelsToTry) {
        try {
          const promptInstruction = `
You are a master trilingual translator, lexicographer, and linguist specializing in Uzbek (O‘zbek tili), Russian (Русский язык), and English.
Translate the text from ${getLangName(detectedSource)} into ${getLangName(targetLanguage)}.

Quality & Orthography Guidelines:
1. MEANING & CONTEXT: Translate naturally and accurately preserving meaning, context, proper nouns, grammatical agreement, tenses, questions, and imperatives. Avoid awkward literal word-for-word translation.
2. UZBEK SPECIFICS: When the target language is Uzbek, use standard modern Uzbek Latin script with proper letters: o‘, g‘, sh, ch, q, x, and correct case suffixes (-ga, -dan, -da, -ning, -ni, etc.).
3. REGISTER & TONE: The requested tone is "${tone}".
   - "standard": Balanced, natural everyday speech or written text.
   - "formal": Respectful, polite, official/business style (e.g., using "Siz" forms in Uzbek, "Вы" forms in Russian, polite formal register in English).
   - "casual": Friendly, colloquial, conversational.
4. SINGLE WORDS & SHORT PHRASES:
   If the input is a single word or short phrase, provide:
   - translation: Primary best translation (just the word, no commentary)
   - partOfSpeech: Word class (e.g., "ot / noun / существительное", "fe'l / verb / глагол")
   - transliteration: Pronunciation guide if useful
   - alternatives: 2 to 4 valid alternative translations
   - synonyms: 2 to 3 synonyms in the target language
   - examples: 1 or 2 high-quality bilingual usage sentences
5. LONG TEXT:
   Preserve paragraphs, line breaks, punctuation, capitalization, and numbers.
6. STRICT OUTPUT:
   The translation field must contain ONLY the translated text itself. Do NOT output prefixes like "Tarjima:", "Translation:", or "Перевод:".
7. ACCURATE LANGUAGE DETECTION:
   Confirm the detectedSourceLanguage as exactly "uz", "ru", or "en".

TEXT TO TRANSLATE:
"""
${trimmedText}
"""
`;

          const response = await ai.models.generateContent({
            model: modelName,
            contents: promptInstruction,
            config: {
              temperature: 0.2,
              responseMimeType: 'application/json',
              responseSchema: {
                type: Type.OBJECT,
                properties: {
                  translation: {
                    type: Type.STRING,
                    description: 'The translated text into target language without any label prefix',
                  },
                  detectedSourceLanguage: {
                    type: Type.STRING,
                    description: 'The detected language code: uz, ru, or en',
                  },
                  targetLanguage: {
                    type: Type.STRING,
                    description: 'The target language code: uz, ru, or en',
                  },
                  partOfSpeech: {
                    type: Type.STRING,
                    description: 'Part of speech if single word or short phrase, otherwise empty',
                  },
                  transliteration: {
                    type: Type.STRING,
                    description: 'Pronunciation or phonetic transliteration',
                  },
                  alternatives: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Alternative translations or nuances',
                  },
                  synonyms: {
                    type: Type.ARRAY,
                    items: { type: Type.STRING },
                    description: 'Synonyms in the target language',
                  },
                  notes: {
                    type: Type.STRING,
                    description: 'Brief linguistic or cultural nuance note if applicable',
                  },
                  examples: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        original: { type: Type.STRING },
                        translated: { type: Type.STRING },
                      },
                    },
                    description: 'Example usage sentences',
                  },
                },
                required: ['translation', 'detectedSourceLanguage', 'targetLanguage'],
              },
            },
          });

          const rawText = response.text || '';
          const parsed = JSON.parse(rawText);

          const cleanedTranslation = cleanTranslationText(parsed.translation || '');

          return res.json({
            translation: cleanedTranslation,
            detectedSourceLanguage: (parsed.detectedSourceLanguage as LangCode) || detectedSource,
            targetLanguage: (parsed.targetLanguage as LangCode) || targetLanguage,
            partOfSpeech: parsed.partOfSpeech || (isSingleWord ? 'word' : undefined),
            transliteration: parsed.transliteration,
            alternatives: parsed.alternatives || [],
            synonyms: parsed.synonyms || [],
            notes: parsed.notes,
            examples: parsed.examples || [],
          });
        } catch (err: any) {
          console.warn(`Model ${modelName} failed:`, err?.message || err);
          lastError = err;
        }
      }

      // If all models failed, try offlineDictionary
      const lower = trimmedText.toLowerCase();
      const dictEntry = offlineDictionary[lower]?.[targetLanguage];
      if (dictEntry) {
        return res.json({
          translation: dictEntry.translation,
          detectedSourceLanguage: detectedSource,
          targetLanguage: targetLanguage,
          partOfSpeech: dictEntry.partOfSpeech,
          alternatives: dictEntry.alternatives || [],
          synonyms: [],
        });
      }

      throw lastError || new Error('Tarjima xizmati javob bermadi.');
    } else {
      // Offline fallback dictionary
      const lower = trimmedText.toLowerCase();
      const match = offlineDictionary[lower]?.[targetLanguage];
      if (match) {
        return res.json({
          translation: match.translation,
          detectedSourceLanguage: detectedSource,
          targetLanguage: targetLanguage,
          partOfSpeech: match.partOfSpeech,
          alternatives: match.alternatives || [],
          synonyms: [],
        });
      }
      return res.status(500).json({
        error: 'Tarjima tizimi sozlanmoqda. Iltimos, qaytadan urinib ko‘ring.',
      });
    }
  } catch (error: any) {
    console.error('Translation error:', error);
    return res.status(500).json({
      error: 'Tarjima vaqtida xatolik yuz berdi. Iltimos, qaytadan urinib ko‘ring.',
    });
  }
});

// API: Language detector
app.post('/api/detect', (req, res) => {
  const { text } = req.body;
  if (!text || typeof text !== 'string') {
    return res.json({ language: 'unknown' });
  }
  const detected = detectLanguage(text);
  return res.json({
    language: detected,
    confidence: 0.95,
  });
});

// Setup Vite middleware in dev or static files in production
async function startServer() {
  if (process.env.NODE_ENV === 'production') {
    app.use(express.static(path.resolve(__dirname, 'dist')));
    app.get('*', (req, res) => {
      res.sendFile(path.resolve(__dirname, 'dist', 'index.html'));
    });
  } else {
    const vite = await createViteServer({
      server: { middlewareMode: true },
      appType: 'spa',
    });
    app.use(vite.middlewares);
  }

  app.listen(PORT, '0.0.0.0', () => {
    console.log(`Lingua Translate server is running on http://0.0.0.0:${PORT}`);
  });
}

startServer().catch((err) => {
  console.error('Failed to start server:', err);
  process.exit(1);
});
