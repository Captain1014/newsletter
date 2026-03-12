import { TTSSettings, AppSettings } from "@/types";
import { getSettings } from "./storage";

type BoundaryCallback = (charIndex: number, charLength: number) => void;
type EndCallback = () => void;

let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentAudio: HTMLAudioElement | null = null;
let animationFrameId: number | null = null;

interface SpeakOptions {
  rate?: number;
  lang?: string;
  onBoundary?: BoundaryCallback;
  onEnd?: EndCallback;
  ttsSettings?: TTSSettings;
}

export function speak(text: string, options: SpeakOptions = {}) {
  stop();

  const tts = options.ttsSettings;
  if (tts?.provider === "gemini") {
    const settings = getSettings();
    const apiKey = tts.apiKey || settings.ai.apiKey;
    if (apiKey) {
      speakGemini(text, apiKey, tts.voice || "Kore", options);
    } else {
      speakBrowser(text, options);
    }
  } else if (tts?.provider === "google-cloud" && tts.apiKey) {
    speakGoogleCloud(text, options);
  } else {
    speakBrowser(text, options);
  }
}

// --- Gemini TTS ---
async function speakGemini(text: string, apiKey: string, voice: string, options: SpeakOptions) {
  try {
    const res = await fetch(
      `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key=${apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          contents: [{ parts: [{ text: `Read this aloud naturally:\n\n${text}` }] }],
          generationConfig: {
            responseModalities: ["AUDIO"],
            speechConfig: {
              voiceConfig: {
                prebuiltVoiceConfig: { voiceName: voice },
              },
            },
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Gemini TTS error:", err);
      speakBrowser(text, options);
      return;
    }

    const data = await res.json();
    const audioPart = data.candidates?.[0]?.content?.parts?.find(
      (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
    );

    if (!audioPart?.inlineData) {
      console.error("Gemini TTS: no audio in response");
      speakBrowser(text, options);
      return;
    }

    const { mimeType, data: audioBase64 } = audioPart.inlineData;
    const audioSrc = `data:${mimeType};base64,${audioBase64}`;
    const audio = new Audio(audioSrc);
    audio.playbackRate = options.rate ?? 1.0;
    currentAudio = audio;

    const words = buildWordMap(text);

    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      if (!duration || !options.onBoundary) {
        audio.play();
        return;
      }

      const trackProgress = () => {
        if (!currentAudio || currentAudio.paused || currentAudio.ended) return;
        const progress = audio.currentTime / duration;
        const charPos = Math.floor(progress * text.length);
        const word = words.find((w) => charPos >= w.start && charPos < w.start + w.length);
        if (word) options.onBoundary!(word.start, word.length);
        animationFrameId = requestAnimationFrame(trackProgress);
      };

      audio.play();
      animationFrameId = requestAnimationFrame(trackProgress);
    };

    audio.onended = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      currentAudio = null;
      options.onEnd?.();
    };

    audio.onerror = () => {
      console.error("Gemini audio playback error, falling back to browser TTS");
      currentAudio = null;
      speakBrowser(text, options);
    };
  } catch {
    speakBrowser(text, options);
  }
}

// --- Google Cloud TTS ---
async function speakGoogleCloud(text: string, options: SpeakOptions) {
  const tts = options.ttsSettings!;
  try {
    const res = await fetch(
      `https://texttospeech.googleapis.com/v1/text:synthesize?key=${tts.apiKey}`,
      {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          input: { text },
          voice: {
            languageCode: "en-US",
            name: tts.voice || "en-US-Neural2-J",
          },
          audioConfig: {
            audioEncoding: "MP3",
            speakingRate: options.rate ?? 1.0,
          },
        }),
      }
    );

    if (!res.ok) {
      const err = await res.text();
      console.error("Google Cloud TTS error:", err);
      // Fallback to browser TTS
      speakBrowser(text, options);
      return;
    }

    const data = await res.json();
    const audioSrc = `data:audio/mp3;base64,${data.audioContent}`;

    const audio = new Audio(audioSrc);
    audio.playbackRate = 1.0; // rate is already applied server-side
    currentAudio = audio;

    // Word highlight estimation based on audio progress
    const words = buildWordMap(text);

    audio.onloadedmetadata = () => {
      const duration = audio.duration;
      if (!duration || !options.onBoundary) {
        audio.play();
        return;
      }

      // Track progress with animation frame
      const trackProgress = () => {
        if (!currentAudio || currentAudio.paused || currentAudio.ended) return;
        const progress = audio.currentTime / duration;
        const charPos = Math.floor(progress * text.length);

        // Find the word at this character position
        const word = words.find(
          (w) => charPos >= w.start && charPos < w.start + w.length
        );
        if (word) {
          options.onBoundary!(word.start, word.length);
        }

        animationFrameId = requestAnimationFrame(trackProgress);
      };

      audio.play();
      animationFrameId = requestAnimationFrame(trackProgress);
    };

    audio.onended = () => {
      if (animationFrameId) cancelAnimationFrame(animationFrameId);
      currentAudio = null;
      options.onEnd?.();
    };

    audio.onerror = () => {
      console.error("Audio playback error, falling back to browser TTS");
      currentAudio = null;
      speakBrowser(text, options);
    };
  } catch {
    // Network error — fallback
    speakBrowser(text, options);
  }
}

function buildWordMap(text: string): { start: number; length: number }[] {
  const words: { start: number; length: number }[] = [];
  const regex = /\S+/g;
  let match;
  while ((match = regex.exec(text)) !== null) {
    words.push({ start: match.index, length: match[0].length });
  }
  return words;
}

// --- Browser TTS (fallback) ---
function speakBrowser(text: string, options: SpeakOptions) {
  const utterance = new SpeechSynthesisUtterance(text);
  utterance.lang = options.lang ?? "en-US";
  utterance.rate = options.rate ?? 1.0;

  if (options.onBoundary) {
    utterance.onboundary = (event: SpeechSynthesisEvent) => {
      if (event.name === "word") {
        options.onBoundary!(event.charIndex, event.charLength);
      }
    };
  }

  if (options.onEnd) {
    utterance.onend = options.onEnd;
  }

  currentUtterance = utterance;
  speechSynthesis.speak(utterance);
}

export function stop() {
  // Stop Google Cloud audio
  if (currentAudio) {
    currentAudio.pause();
    currentAudio = null;
  }
  if (animationFrameId) {
    cancelAnimationFrame(animationFrameId);
    animationFrameId = null;
  }
  // Stop browser TTS
  speechSynthesis.cancel();
  currentUtterance = null;
}

export function pause() {
  if (currentAudio) {
    currentAudio.pause();
  } else {
    speechSynthesis.pause();
  }
}

export function resume() {
  if (currentAudio) {
    currentAudio.play();
  } else {
    speechSynthesis.resume();
  }
}

export function isSpeaking(): boolean {
  if (currentAudio) return !currentAudio.paused && !currentAudio.ended;
  return speechSynthesis.speaking;
}

export function isPaused(): boolean {
  if (currentAudio) return currentAudio.paused;
  return speechSynthesis.paused;
}

// Wake Lock to prevent screen from turning off during TTS
let wakeLock: WakeLockSentinel | null = null;

export async function requestWakeLock() {
  try {
    if ("wakeLock" in navigator) {
      wakeLock = await navigator.wakeLock.request("screen");
    }
  } catch {
    // Wake Lock not supported or permission denied — ignore
  }
}

export async function releaseWakeLock() {
  if (wakeLock) {
    await wakeLock.release();
    wakeLock = null;
  }
}
