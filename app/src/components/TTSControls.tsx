"use client";

import { useState } from "react";
import { useReaderStore } from "@/store/useReaderStore";
import { speak, stop, requestWakeLock, releaseWakeLock } from "@/lib/tts";
import { getSettings } from "@/lib/storage";

export default function TTSControls({ text }: { text: string }) {
  const { isPlaying, setIsPlaying, setHighlightRange } = useReaderStore();
  const [loading, setLoading] = useState(false);

  function handlePlay() {
    if (isPlaying || loading) {
      stop();
      setIsPlaying(false);
      setLoading(false);
      setHighlightRange(null);
      releaseWakeLock();
      return;
    }

    const settings = getSettings();
    requestWakeLock();
    setLoading(true);

    speak(text, {
      rate: settings.ttsRate,
      lang: "en-US",
      ttsSettings: settings.tts,
      onStart: () => {
        setLoading(false);
        setIsPlaying(true);
      },
      onBoundary: (charIndex, charLength) => {
        setHighlightRange({ start: charIndex, end: charIndex + charLength });
      },
      onEnd: () => {
        setIsPlaying(false);
        setLoading(false);
        setHighlightRange(null);
        releaseWakeLock();
      },
    });
  }

  return (
    <button
      onClick={handlePlay}
      className={`p-3 rounded-full transition-colors ${
        loading
          ? "bg-blue-400 text-white"
          : isPlaying
            ? "bg-red-500 text-white"
            : "bg-blue-500 text-white hover:bg-blue-600"
      }`}
      aria-label={loading ? "Loading TTS" : isPlaying ? "Stop TTS" : "Play TTS"}
    >
      {loading ? (
        <svg className="w-6 h-6 animate-spin" fill="none" viewBox="0 0 24 24">
          <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
          <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
        </svg>
      ) : isPlaying ? (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <rect x="6" y="4" width="4" height="16" rx="1" />
          <rect x="14" y="4" width="4" height="16" rx="1" />
        </svg>
      ) : (
        <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
          <path d="M8 5v14l11-7z" />
        </svg>
      )}
    </button>
  );
}
