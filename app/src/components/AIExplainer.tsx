"use client";

import { useReaderStore } from "@/store/useReaderStore";
import { getExplanation } from "@/lib/ai";
import { getSettings } from "@/lib/storage";

export default function AIExplainer({ paragraph }: { paragraph: string }) {
  const {
    explanation,
    isLoadingExplanation,
    showExplanation,
    setExplanation,
    setIsLoadingExplanation,
    setShowExplanation,
  } = useReaderStore();

  async function handleExplain() {
    if (showExplanation) {
      setShowExplanation(false);
      return;
    }

    if (explanation) {
      setShowExplanation(true);
      return;
    }

    const settings = getSettings();
    setIsLoadingExplanation(true);
    setShowExplanation(true);

    try {
      const result = await getExplanation(paragraph, settings.ai);
      setExplanation(result);
    } catch (e) {
      setExplanation(
        e instanceof Error ? e.message : "해설을 불러올 수 없습니다."
      );
    } finally {
      setIsLoadingExplanation(false);
    }
  }

  return (
    <div>
      <button
        onClick={handleExplain}
        disabled={isLoadingExplanation}
        className="px-4 py-2 rounded-full text-sm font-medium bg-zinc-100 dark:bg-zinc-800 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
      >
        {isLoadingExplanation
          ? "로딩..."
          : showExplanation
            ? "해설 닫기"
            : "AI 해설"}
      </button>

      {showExplanation && explanation && (
        <div className="mt-3 p-4 rounded-xl bg-blue-50 dark:bg-blue-950/30 border border-blue-100 dark:border-blue-900 text-sm leading-6">
          {explanation}
        </div>
      )}
    </div>
  );
}
