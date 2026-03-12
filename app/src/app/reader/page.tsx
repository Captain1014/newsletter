"use client";

import { useRouter } from "next/navigation";
import { useReaderStore } from "@/store/useReaderStore";
import { stop } from "@/lib/tts";
import ParagraphCard from "@/components/ParagraphCard";
import TTSControls from "@/components/TTSControls";
import AIExplainer from "@/components/AIExplainer";
import SummaryCard from "@/components/SummaryCard";
import { useSwipeable } from "react-swipeable";
import { useEffect } from "react";

export default function ReaderPage() {
  const router = useRouter();
  const {
    currentNewsletter,
    currentIndex,
    goNext,
    goPrev,
    setIsPlaying,
    setHighlightRange,
  } = useReaderStore();

  // Stop TTS on unmount
  useEffect(() => {
    return () => {
      stop();
      setIsPlaying(false);
      setHighlightRange(null);
    };
  }, [setIsPlaying, setHighlightRange]);

  const swipeHandlers = useSwipeable({
    onSwipedLeft: () => {
      stop();
      setIsPlaying(false);
      setHighlightRange(null);
      goNext();
    },
    onSwipedRight: () => {
      stop();
      setIsPlaying(false);
      setHighlightRange(null);
      goPrev();
    },
    preventScrollOnSwipe: true,
    trackMouse: false,
  });

  useEffect(() => {
    if (!currentNewsletter) {
      router.push("/");
    }
  }, [currentNewsletter, router]);

  if (!currentNewsletter) {
    return null;
  }

  const isSummaryCard = currentIndex === 0;
  const paragraphIndex = currentIndex - 1;
  const paragraph = isSummaryCard ? "" : currentNewsletter.paragraphs[paragraphIndex];
  const total = currentNewsletter.paragraphs.length + 1; // +1 for summary card

  return (
    <div className="flex flex-col flex-1" {...swipeHandlers}>
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => {
            stop();
            router.push("/");
          }}
          className="p-1 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Back"
        >
          <svg
            className="w-5 h-5"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 19l-7-7 7-7"
            />
          </svg>
        </button>
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium truncate">
            {currentNewsletter.subject}
          </p>
          <p className="text-xs text-zinc-500">
            {currentIndex + 1} / {total}
          </p>
        </div>
      </header>

      {/* Progress bar */}
      <div className="h-1 bg-zinc-100 dark:bg-zinc-800">
        <div
          className="h-full bg-blue-500 transition-all duration-300"
          style={{ width: `${((currentIndex + 1) / total) * 100}%` }}
        />
      </div>

      {/* Card area */}
      <div className="flex-1 flex flex-col justify-center px-4 py-6 gap-4">
        {isSummaryCard ? (
          <SummaryCard paragraphs={currentNewsletter.paragraphs} />
        ) : (
          <>
            <ParagraphCard text={paragraph} />
            {/* Controls */}
            <div className="flex items-center justify-between">
              <AIExplainer paragraph={paragraph} />
              <TTSControls text={paragraph} />
            </div>
          </>
        )}
      </div>

      {/* Navigation buttons */}
      <div className="flex justify-between items-center px-4 py-3 safe-bottom gap-3">
        <button
          onClick={() => {
            stop();
            setIsPlaying(false);
            setHighlightRange(null);
            goPrev();
          }}
          disabled={currentIndex === 0}
          className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl text-sm font-medium bg-zinc-100 dark:bg-zinc-800 enabled:active:bg-zinc-200 dark:enabled:active:bg-zinc-700 disabled:opacity-30 transition-colors min-h-[44px]"
          aria-label="이전"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          이전
        </button>
        <span className="text-xs text-zinc-400 whitespace-nowrap">
          {currentIndex + 1} / {total}
        </span>
        <button
          onClick={() => {
            stop();
            setIsPlaying(false);
            setHighlightRange(null);
            goNext();
          }}
          disabled={currentIndex >= total - 1}
          className="flex-1 flex items-center justify-center gap-1 py-3 rounded-xl text-sm font-medium bg-zinc-100 dark:bg-zinc-800 enabled:active:bg-zinc-200 dark:enabled:active:bg-zinc-700 disabled:opacity-30 transition-colors min-h-[44px]"
          aria-label="다음"
        >
          다음
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
          </svg>
        </button>
      </div>
    </div>
  );
}
