"use client";

import { useReaderStore } from "@/store/useReaderStore";
import { speak, stop, requestWakeLock, releaseWakeLock } from "@/lib/tts";
import { getSettings } from "@/lib/storage";
import { useCallback } from "react";

export default function TTSControls({ text }: { text: string }) {
  const { isPlaying, setIsPlaying, setHighlightRange } = useReaderStore();

  const handlePlay = useCallback(() => {
    if (isPlaying) {
      stop();
      setIsPlaying(false);
      setHighlightRange(null);
      releaseWakeLock();
      return;
    }

    const settings = getSettings();
    requestWakeLock();
    setIsPlaying(true);

    speak(text, {
      rate: settings.ttsRate,
      lang: "en-US",
      ttsSettings: settings.tts,
      onBoundary: (charIndex, charLength) => {
        setHighlightRange({ start: charIndex, end: charIndex + charLength });
      },
      onEnd: () => {
        setIsPlaying(false);
        setHighlightRange(null);
        releaseWakeLock();
      },
    });
  }, [isPlaying, text, setIsPlaying, setHighlightRange]);

  return (
    <button
      onClick={handlePlay}
      className={`p-3 rounded-full transition-colors ${
        isPlaying
          ? "bg-red-500 text-white"
          : "bg-blue-500 text-white hover:bg-blue-600"
      }`}
      aria-label={isPlaying ? "Stop TTS" : "Play TTS"}
    >
      {isPlaying ? (
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
