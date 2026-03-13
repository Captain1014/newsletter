"use client";

import { useReaderStore } from "@/store/useReaderStore";
import { generatePodcastScript } from "@/lib/ai";
import { speakPodcast, stopPodcast, requestWakeLock, releaseWakeLock } from "@/lib/tts";
import { getSettings } from "@/lib/storage";

export default function PodcastPlayer() {
  const {
    currentNewsletter,
    isPodcastMode,
    podcastSegments,
    podcastCurrentSegment,
    podcastLoading,
    setIsPodcastMode,
    setPodcastSegments,
    setPodcastCurrentSegment,
    setPodcastLoading,
    resetPodcast,
  } = useReaderStore();

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
      // Generate podcast script from AI
      const segments = await generatePodcastScript(
        currentNewsletter.paragraphs,
        settings.ai
      );
      setPodcastSegments(segments);
      setPodcastLoading(false);

      // Start sequential TTS
      await requestWakeLock();
      await speakPodcast(segments, {
        rate: settings.ttsRate,
        lang: "en-US",
        ttsSettings: settings.tts,
      }, {
        onSegmentStart: (i) => setPodcastCurrentSegment(i),
        onComplete: () => {
          releaseWakeLock();
          resetPodcast();
        },
      });
    } catch {
      setPodcastLoading(false);
      resetPodcast();
      releaseWakeLock();
    }
  }

  function handleStop() {
    stopPodcast();
    releaseWakeLock();
    resetPodcast();
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
    <div className="flex flex-col gap-3 p-4 rounded-2xl bg-purple-50 dark:bg-purple-950/30 border border-purple-200 dark:border-purple-800">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <svg className="w-5 h-5 text-purple-500" fill="currentColor" viewBox="0 0 24 24">
            <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3Z" />
            <path d="M19 10v2a7 7 0 0 1-14 0v-2H3v2a9 9 0 0 0 8 8.94V23h2v-2.06A9 9 0 0 0 21 12v-2h-2Z" />
          </svg>
          <span className="text-sm font-semibold text-purple-700 dark:text-purple-300">
            Podcast Mode
          </span>
        </div>
        <button
          onClick={handleStop}
          className="p-2 rounded-full bg-purple-500 text-white hover:bg-purple-600 min-w-[44px] min-h-[44px] flex items-center justify-center"
          aria-label="Stop podcast"
        >
          <svg className="w-5 h-5" fill="currentColor" viewBox="0 0 24 24">
            <rect x="6" y="6" width="12" height="12" rx="1" />
          </svg>
        </button>
      </div>

      {/* Status */}
      {podcastLoading ? (
        <div className="flex items-center gap-2 text-sm text-purple-600 dark:text-purple-400">
          <svg className="w-4 h-4 animate-spin" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z" />
          </svg>
          Generating podcast script...
        </div>
      ) : (
        <>
          {/* Progress bar */}
          <div className="h-1.5 bg-purple-200 dark:bg-purple-900 rounded-full overflow-hidden">
            <div
              className="h-full bg-purple-500 transition-all duration-500 rounded-full"
              style={{ width: `${progress}%` }}
            />
          </div>
          <p className="text-xs text-purple-500 dark:text-purple-400">
            Segment {current} / {total}
          </p>

          {/* Current segment text */}
          {podcastCurrentSegment >= 0 && podcastSegments[podcastCurrentSegment] && (
            <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed line-clamp-3">
              {podcastSegments[podcastCurrentSegment]}
            </p>
          )}
        </>
      )}
    </div>
  );
}
