/**
 * translationService.js
 * ----------------------------------------------------------------
 * Responsible ONLY for translating already-transcribed text from a
 * source language to a target language.
 *
 * Architecture:
 *   speechService.js   -> turns audio into text (speech-to-text)
 *   translationService.js (this file) -> turns text in language A
 *                          into text in language B
 *   socket/index.js    -> delivers the translated subtitle to
 *                          the other participant(s) in real time
 *
 * This separation means a real provider (Google Cloud Translate,
 * Azure Translator, DeepL, etc.) can be dropped in later by only
 * editing this file - nothing else in the app needs to change.
 *
 * Provider selection is controlled by TRANSLATION_PROVIDER in .env.
 * Defaults to "mock" so the whole app works without any paid API key.
 */

const MOCK_PHRASES = {
  // A small demo dictionary so the mock translator returns believable,
  // topical results for common telemedicine phrases used in the demo.
  ta: {
    en: {
      "எனக்கு தலைவலி இருக்கிறது": "I have a headache",
      "எனக்கு காய்ச்சல் உள்ளது": "I have a fever",
      "நன்றி மருத்துவரே": "Thank you, doctor",
      "எனக்கு மருந்து தேவை": "I need medicine",
    },
  },
  hi: {
    en: {
      "मुझे सिरदर्द है": "I have a headache",
      "मुझे बुखार है": "I have a fever",
      "धन्यवाद डॉक्टर": "Thank you, doctor",
      "मुझे दवा चाहिए": "I need medicine",
    },
  },
  en: {
    ta: {
      "I will prescribe some medicine": "நான் சில மருந்துகளை பரிந்துரைக்கிறேன்",
      "How are you feeling today": "இன்று நீங்கள் எப்படி உணருகிறீர்கள்",
      "Please take rest": "தயவுசெய்து ஓய்வெடுங்கள்",
    },
    hi: {
      "I will prescribe some medicine": "मैं कुछ दवा लिखूंगा",
      "How are you feeling today": "आज आपको कैसा महसूस हो रहा है",
      "Please take rest": "कृपया आराम करें",
    },
  },
};

/**
 * Very small deterministic "mock translation" so demos are consistent.
 * If the exact phrase isn't in our dictionary, it falls back to a
 * clearly-labelled placeholder translation so it's obvious in the UI
 * that this is demo/mock output, not a real translation.
 */
function mockTranslate(text, sourceLang, targetLang) {
  if (sourceLang === targetLang) return text;

  const dict = MOCK_PHRASES[sourceLang]?.[targetLang];
  if (dict && dict[text.trim()]) {
    return dict[text.trim()];
  }

  const langNames = { en: "English", ta: "Tamil", hi: "Hindi" };
  return `[${langNames[targetLang] || targetLang} demo translation] ${text}`;
}

async function googleTranslate(text, sourceLang, targetLang) {
  const apiKey = process.env.GOOGLE_TRANSLATE_API_KEY;
  if (!apiKey) {
    console.warn("GOOGLE_TRANSLATE_API_KEY missing, falling back to mock translation");
    return mockTranslate(text, sourceLang, targetLang);
  }
  try {
    const res = await fetch(
      `https://translation.googleapis.com/language/translate/v2?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ q: text, source: sourceLang, target: targetLang, format: "text" }),
      }
    );
    const data = await res.json();
    return data?.data?.translations?.[0]?.translatedText || mockTranslate(text, sourceLang, targetLang);
  } catch (err) {
    console.error("Google Translate error, falling back to mock:", err.message);
    return mockTranslate(text, sourceLang, targetLang);
  }
}

/**
 * Public entry point used by the rest of the app.
 * @param {string} text - original transcribed text
 * @param {string} sourceLang - "en" | "ta" | "hi"
 * @param {string} targetLang - "en" | "ta" | "hi"
 * @returns {Promise<{translatedText: string, provider: string}>}
 */
async function translateText(text, sourceLang, targetLang) {
  const provider = (process.env.TRANSLATION_PROVIDER || "mock").toLowerCase();

  let translatedText;
  if (provider === "google") {
    translatedText = await googleTranslate(text, sourceLang, targetLang);
  } else {
    translatedText = mockTranslate(text, sourceLang, targetLang);
  }

  return { translatedText, provider };
}

module.exports = { translateText };
