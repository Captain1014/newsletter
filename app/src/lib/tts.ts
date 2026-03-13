import { TTSSettings, AppSettings } from "@/types";
import { getSettings } from "./storage";

type BoundaryCallback = (charIndex: number, charLength: number) => void;
type EndCallback = () => void;

let currentUtterance: SpeechSynthesisUtterance | null = null;
let currentAudio: HTMLAudioElement | null = null;
let animationFrameId: number | null = null;
let currentAbort: AbortController | null = null;

interface SpeakOptions {
  rate?: number;
  lang?: string;
  onStart?: () => void;
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
      // Create & prime audio element during user gesture (required for iOS)
      const audio = new Audio();
      audio.play().then(() => audio.pause()).catch(() => {});
      speakGemini(text, apiKey, tts.voice || "Kore", options, audio);
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

// Prefetch cache: key = text, value = blob URL
const audioCache = new Map<string, string>();

/** Fetch Gemini TTS audio and return a blob URL (or null on failure) */
async function fetchGeminiAudio(
  text: string,
  apiKey: string,
  voice: string,
  signal?: AbortSignal
): Promise<string | null> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash-preview-tts:generateContent?key=${apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      signal,
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
    console.error("Gemini TTS error:", await res.text());
    return null;
  }

  const data = await res.json();
  const audioPart = data.candidates?.[0]?.content?.parts?.find(
    (p: { inlineData?: { mimeType: string; data: string } }) => p.inlineData
  );

  if (!audioPart?.inlineData) return null;

  const { mimeType, data: audioBase64 } = audioPart.inlineData;

  if (mimeType.startsWith("audio/L16") || mimeType.startsWith("audio/pcm")) {
    const raw = Uint8Array.from(atob(audioBase64), (c) => c.charCodeAt(0));
    const wav = pcmToWav(raw, 24000);
    const blob = new Blob([wav], { type: "audio/wav" });
    return URL.createObjectURL(blob);
  }
  return `data:${mimeType};base64,${audioBase64}`;
}

/** Prefetch audio for a text segment (no-op if already cached) */
export function prefetchGeminiTTS(text: string, apiKey: string, voice: string) {
  if (audioCache.has(text)) return;
  fetchGeminiAudio(text, apiKey, voice)
    .then((src) => { if (src) audioCache.set(text, src); })
    .catch(() => {});
}

function clearAudioCache() {
  for (const src of audioCache.values()) {
    if (src.startsWith("blob:")) URL.revokeObjectURL(src);
  }
  audioCache.clear();
}

async function speakGemini(text: string, apiKey: string, voice: string, options: SpeakOptions, audio: HTMLAudioElement) {
  try {
    currentAbort?.abort();
    const abort = new AbortController();
    currentAbort = abort;

    // Use cached audio if available, otherwise fetch
    let audioSrc: string | null = audioCache.get(text) ?? null;
    if (!audioSrc) {
      audioSrc = await fetchGeminiAudio(text, apiKey, voice, abort.signal);
    }

    if (abort.signal.aborted) return;

    if (!audioSrc) {
      speakBrowser(text, options);
      return;
    }

    // Remove from cache since we're using it now
    audioCache.delete(text);

    audio.src = audioSrc;
    audio.playbackRate = options.rate ?? 1.0;
    currentAudio = audio;

    audio.oncanplaythrough = () => {
      options.onStart?.();
      audio.play().catch(() => {
        if (audioSrc!.startsWith("blob:")) URL.revokeObjectURL(audioSrc!);
        currentAudio = null;
        speakBrowser(text, options);
      });
    };

    audio.onended = () => {
      if (audioSrc!.startsWith("blob:")) URL.revokeObjectURL(audioSrc!);
      currentAudio = null;
      options.onEnd?.();
    };

    audio.onerror = () => {
      if (audioSrc!.startsWith("blob:")) URL.revokeObjectURL(audioSrc!);
      currentAudio = null;
      speakBrowser(text, options);
    };
  } catch (e) {
    if (e instanceof DOMException && e.name === "AbortError") return;
    speakBrowser(text, options);
  }
}

// --- Google Cloud TTS ---
async function speakGoogleCloud(text: string, options: SpeakOptions) {
  const tts = options.ttsSettings;
  if (!tts?.apiKey) { speakBrowser(text, options); return; }
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
      options.onStart?.();
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

/** Convert raw PCM (16-bit LE mono) to a WAV ArrayBuffer */
function pcmToWav(pcm: Uint8Array, sampleRate: number): ArrayBuffer {
  const header = 44;
  const buf = new ArrayBuffer(header + pcm.length);
  const view = new DataView(buf);
  const writeStr = (off: number, s: string) => {
    for (let i = 0; i < s.length; i++) view.setUint8(off + i, s.charCodeAt(i));
  };
  writeStr(0, "RIFF");
  view.setUint32(4, 36 + pcm.length, true);
  writeStr(8, "WAVE");
  writeStr(12, "fmt ");
  view.setUint32(16, 16, true); // chunk size
  view.setUint16(20, 1, true); // PCM
  view.setUint16(22, 1, true); // mono
  view.setUint32(24, sampleRate, true);
  view.setUint32(28, sampleRate * 2, true); // byte rate
  view.setUint16(32, 2, true); // block align
  view.setUint16(34, 16, true); // bits per sample
  writeStr(36, "data");
  view.setUint32(40, pcm.length, true);
  new Uint8Array(buf, header).set(pcm);
  return buf;
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

  utterance.onend = () => options.onEnd?.();
  utterance.onstart = () => options.onStart?.();
  utterance.onerror = () => {
    // Ensure loading state is cleared even if browser TTS fails
    options.onStart?.();
    options.onEnd?.();
  };

  currentUtterance = utterance;
  speechSynthesis.speak(utterance);
}

export function stop() {
  // Abort any in-flight Gemini fetch
  if (currentAbort) {
    currentAbort.abort();
    currentAbort = null;
  }
  // Stop audio
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

// --- Podcast mode (sequential TTS) ---
let podcastCancelled = false;
let podcastSkipping = false;
let podcastSegments: string[] = [];
let podcastIndex = 0;
let podcastResolve: (() => void) | null = null;

export interface PodcastCallbacks {
  onSegmentStart?: (index: number) => void;
  onSegmentEnd?: (index: number) => void;
  onComplete?: () => void;
  onError?: (error: string) => void;
}

export async function speakPodcast(
  segments: string[],
  options: SpeakOptions,
  callbacks: PodcastCallbacks
) {
  podcastCancelled = false;
  podcastSegments = segments;

  // Extract Gemini settings for prefetching
  const tts = options.ttsSettings;
  const settings = getSettings();
  const apiKey = tts?.provider === "gemini" ? (tts.apiKey || settings.ai.apiKey) : "";
  const voice = tts?.voice || "Kore";

  // Prefetch the first segment immediately
  if (apiKey && segments.length > 0) {
    prefetchGeminiTTS(segments[0], apiKey, voice);
  }

  for (podcastIndex = 0; podcastIndex < segments.length; podcastIndex++) {
    if (podcastCancelled) break;

    // Prefetch next segment while current one plays
    if (apiKey && podcastIndex + 1 < segments.length) {
      prefetchGeminiTTS(segments[podcastIndex + 1], apiKey, voice);
    }

    callbacks.onSegmentStart?.(podcastIndex);

    await new Promise<void>((resolve) => {
      podcastResolve = resolve;
      speak(segments[podcastIndex], {
        ...options,
        onStart: undefined,
        onBoundary: undefined,
        onEnd: () => {
          // Guard: if skipping, don't resolve here — podcastSkip will resolve
          if (podcastSkipping) return;
          callbacks.onSegmentEnd?.(podcastIndex);
          podcastResolve = null;
          resolve();
        },
      });
    });

    if (podcastCancelled) break;
  }

  if (!podcastCancelled) {
    callbacks.onComplete?.();
  }
}

export function podcastSkip(delta: number) {
  const newIndex = Math.max(0, Math.min(podcastIndex + delta, podcastSegments.length - 1));
  if (newIndex === podcastIndex) return;

  podcastSkipping = true;
  stop(); // onEnd won't resolve because podcastSkipping is true
  podcastSkipping = false;

  podcastIndex = newIndex - 1; // will be incremented by loop
  const r = podcastResolve;
  podcastResolve = null;
  r?.();
}

export function stopPodcast() {
  podcastCancelled = true;
  podcastSkipping = true;
  stop();
  podcastSkipping = false;
  clearAudioCache();
  const r = podcastResolve;
  podcastResolve = null;
  r?.();
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
