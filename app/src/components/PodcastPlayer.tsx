"use client";

import { useRef } from "react";
import { useReaderStore } from "@/store/useReaderStore";
import { generatePodcastScript } from "@/lib/ai";
import {
  speakPodcast,
  stopPodcast,
  podcastSkip,
  pause,
  resume,
  requestWakeLock,
  releaseWakeLock,
} from "@/lib/tts";
import { getSettings } from "@/lib/storage";

export default function PodcastPlayer() {
  const {
    currentNewsletter,
    isPodcastMode,
    podcastSegments,
    podcastCurrentSegment,
    podcastLoading,
    podcastPaused,
    setIsPodcastMode,
    setPodcastSegments,
    setPodcastCurrentSegment,
    setPodcastLoading,
    setPodcastPaused,
    resetPodcast,
  } = useReaderStore();

  const progressRef = useRef<HTMLDivElement>(null);

  async function handleStart() {
    if (!currentNewsletter) return;

    const settings = getSettings();
    if (!settings.ai.apiKey) {
      alert("API key is required. Please set it in Settings.");
      return;
    }

    setPodcastLoading(true);
    setIsPodcastMode(true);

    try {
      const segments = await generatePodcastScript(
        currentNewsletter.paragraphs,
        settings.ai
      );
      setPodcastSegments(segments);
      setPodcastLoading(false);

      await requestWakeLock();
      await speakPodcast(
        segments,
        {
          rate: settings.ttsRate,
          lang: "en-US",
          ttsSettings: settings.tts,
        },
        {
          onSegmentStart: (i) => {
            setPodcastCurrentSegment(i);
            setPodcastPaused(false);
          },
          onComplete: () => {
            releaseWakeLock();
            resetPodcast();
          },
        }
      );
    } catch {
      setPodcastLoading(false);
      resetPodcast();
      releaseWakeLock();
    }
  }

  function handleClose() {
    stopPodcast();
    releaseWakeLock();
    resetPodcast();
  }

  function handlePauseResume() {
    if (podcastPaused) {
      resume();
      setPodcastPaused(false);
    } else {
      pause();
      setPodcastPaused(true);
    }
  }

  function handleSkipBack() {
    setPodcastPaused(false);
    podcastSkip(-1);
  }

  function handleSkipForward() {
    setPodcastPaused(false);
    podcastSkip(1);
  }

  function handleProgressTap(e: React.MouseEvent<HTMLDivElement> | React.TouchEvent<HTMLDivElement>) {
    if (!progressRef.current || podcastSegments.length === 0) return;
    const rect = progressRef.current.getBoundingClientRect();
    const clientX = "touches" in e ? e.touches[0].clientX : e.clientX;
    const ratio = Math.max(0, Math.min(1, (clientX - rect.left) / rect.width));
    const targetIndex = Math.floor(ratio * podcastSegments.length);
    const delta = targetIndex - podcastCurrentSegment;
    if (delta !== 0) {
      setPodcastPaused(false);
      podcastSkip(delta);
    }
  }

  // Not in podcast mode — show start button
  if (!isPodcastMode) {
    return (
      <button
        onClick={handleStart}
        className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-purple-500 text-white text-sm font-medium hover:bg-purple-600 active:bg-purple-700 transition-colors min-h-[44px]"
      >
        <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
          <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
          <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2Z" />
        </svg>
        Podcast
      </button>
    );
  }

  // Podcast mode active
  const total = podcastSegments.length;
  const current = podcastCurrentSegment + 1;
  const progress = total > 0 ? (current / total) * 100 : 0;

  return (
    <div className="flex flex-col flex-1 min-h-0">
      <div className="flex flex-col gap-3 p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800 flex-1 min-h-0">
        {/* Header */}
        <div className="flex items-center justify-between shrink-0">
          <div className="flex items-center gap-2">
            <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
              <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
              <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2Z" />
            </svg>
            <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
              Podcast
            </span>
            <span className="text-xs text-purple-500 dark:text-purple-400">
              {current} / {total}
            </span>
          </div>
          {/* Close button */}
          <button
            onClick={handleClose}
            className="p-2 rounded-full hover:bg-purple-200 dark:hover:bg-purple-800 transition-colors min-w-[44px] min-h-[44px] flex items-center justify-center"
            aria-label="Close podcast"
          >
            <svg className="w-5 h-5 text-purple-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Content */}
        {podcastLoading ? (
          <div className="flex items-center justify-center gap-2 text-sm text-purple-600 dark:text-purple-400 flex-1">
            <svg className="w-5 h-5 animate-spin" fill="none" viewBox="0 0 24 24">
              <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
              <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
            </svg>
            Generating podcast script...
          </div>
        ) : (
          <>
            {/* Seekable progress bar */}
            <div
              ref={progressRef}
              className="h-2 bg-purple-200 dark:bg-purple-900 rounded-full overflow-hidden cursor-pointer shrink-0 touch-none"
              onClick={handleProgressTap}
              onTouchStart={handleProgressTap}
            >
              <div
                className="h-full bg-purple-500 transition-all duration-300 rounded-full relative"
                style={{ width: `${progress}%` }}
              >
                <div className="absolute right-0 top-1/2 -translate-y-1/2 translate-x-1/2 w-4 h-4 bg-purple-500 rounded-full border-2 border-white dark:border-zinc-900 shadow" />
              </div>
            </div>

            {/* Script text — scrollable */}
            <div className="flex-1 min-h-0 overflow-y-auto overscroll-contain rounded-lg bg-white/50 dark:bg-zinc-900/50 p-3">
              {podcastCurrentSegment >= 0 && podcastSegments[podcastCurrentSegment] ? (
                <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed whitespace-pre-wrap">
                  {podcastSegments[podcastCurrentSegment]}
                </p>
              ) : (
                <p className="text-sm text-zinc-400 italic">Starting...</p>
              )}
            </div>

            {/* Controls */}
            <div className="flex items-center justify-center gap-4 shrink-0 pt-1">
              {/* Skip back */}
              <button
                onClick={handleSkipBack}
                disabled={podcastCurrentSegment <= 0}
                className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 active:bg-purple-200 dark:active:bg-purple-800 disabled:opacity-30 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                aria-label="Previous segment"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 6h2v12H6zm3.5 6 8.5 6V6z" />
                </svg>
              </button>

              {/* Pause / Resume */}
              <button
                onClick={handlePauseResume}
                className="p-4 rounded-full bg-purple-500 text-white hover:bg-purple-600 active:bg-purple-700 transition-colors min-w-[56px] min-h-[56px] flex items-center justify-center shadow-lg"
                aria-label={podcastPaused ? "Resume" : "Pause"}
              >
                {podcastPaused ? (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <path d="M8 5v14l11-7z" />
                  </svg>
                ) : (
                  <svg className="w-6 h-6" fill="currentColor" viewBox="0 0 24 24">
                    <rect x="6" y="4" width="4" height="16" rx="1" />
                    <rect x="14" y="4" width="4" height="16" rx="1" />
                  </svg>
                )}
              </button>

              {/* Skip forward */}
              <button
                onClick={handleSkipForward}
                disabled={podcastCurrentSegment >= total - 1}
                className="p-3 rounded-full bg-purple-100 dark:bg-purple-900/50 text-purple-600 dark:text-purple-400 active:bg-purple-200 dark:active:bg-purple-800 disabled:opacity-30 transition-colors min-w-[48px] min-h-[48px] flex items-center justify-center"
                aria-label="Next segment"
              >
                <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M6 18l8.5-6L6 6v12zM16 6v12h2V6h-2z" />
                </svg>
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
