/**
 * speechService.js
 * ----------------------------------------------------------------
 * Responsible ONLY for converting spoken audio into text.
 *
 * In the real deployment, the FRONTEND does the actual capture of
 * microphone audio and speech-to-text using the browser's built-in
 * Web Speech API (SpeechRecognition) — this keeps latency low and
 * avoids streaming raw audio to the server for the MVP.
 *
 * This backend service exists so that:
 *   1. A server-side provider (Google Speech-to-Text, Whisper API,
 *      Azure Speech, etc.) can be swapped in later with no changes
 *      to socket/index.js or the frontend contract.
 *   2. There is a single mock fallback used in demo mode when no
 *      recognized browser transcript is available.
 */

const DEMO_SENTENCES = {
  en: [
    "How are you feeling today?",
    "Can you describe your symptoms?",
    "I will prescribe some medicine.",
    "Please take rest and drink plenty of water.",
  ],
  ta: [
    "எனக்கு தலைவலி இருக்கிறது",
    "எனக்கு காய்ச்சல் உள்ளது",
    "நன்றி மருத்துவரே",
  ],
  hi: [
    "मुझे सिरदर्द है",
    "मुझे बुखार है",
    "धन्यवाद डॉक्टर",
  ],
};

/**
 * Mock "speech-to-text" used only when the frontend hasn't already
 * produced a transcript via the Web Speech API (e.g. unsupported
 * browser, or a scripted demo). Returns a random plausible sentence
 * in the requested language.
 */
function mockTranscribe(language = "en") {
  const options = DEMO_SENTENCES[language] || DEMO_SENTENCES.en;
  const text = options[Math.floor(Math.random() * options.length)];
  return { text, confidence: 0.92, provider: "mock" };
}

/**
 * Public entry point. In "mock" mode (default), returns a plausible
 * demo sentence. In a real deployment this would forward `audioBuffer`
 * to a real STT provider based on SPEECH_PROVIDER.
 */
async function transcribeAudio({ audioBuffer, language = "en" } = {}) {
  const provider = (process.env.SPEECH_PROVIDER || "mock").toLowerCase();

  if (provider === "mock" || !audioBuffer) {
    return mockTranscribe(language);
  }

  // Placeholder for a real provider integration.
  // e.g. Google Speech-to-Text, Whisper API, Azure Cognitive Services.
  console.warn(`SPEECH_PROVIDER="${provider}" not implemented yet, falling back to mock`);
  return mockTranscribe(language);
}

module.exports = { transcribeAudio, mockTranscribe };
