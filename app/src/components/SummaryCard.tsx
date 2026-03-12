"use client";

import { useState } from "react";
import { getSummary } from "@/lib/ai";
import { getSettings } from "@/lib/storage";

export default function SummaryCard({ paragraphs }: { paragraphs: string[] }) {
  const [summary, setSummary] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleGenerateSummary = async () => {
    setLoading(true);
    setError(null);
    try {
      const settings = getSettings();
      const fullText = paragraphs.join("\n\n");
      const result = await getSummary(fullText, settings.ai);
      setSummary(result);
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to generate summary");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800">
      <div className="flex items-center gap-2 mb-3">
        <svg className="w-5 h-5 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
        </svg>
        <h2 className="text-sm font-semibold">Summary</h2>
        <span className="text-xs text-zinc-400 ml-auto">{paragraphs.length} paragraphs</span>
      </div>

      {summary ? (
        <p className="text-base leading-7 whitespace-pre-wrap">{summary}</p>
      ) : error ? (
        <div className="space-y-3">
          <p className="text-sm text-red-400">{error}</p>
          <button
            onClick={handleGenerateSummary}
            className="px-4 py-2 text-sm rounded-lg bg-blue-500 text-white active:bg-blue-600"
          >
            Retry
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          <p className="text-sm text-zinc-400">
            Get a quick overview before reading the full newsletter.
          </p>
          <button
            onClick={handleGenerateSummary}
            disabled={loading}
            className="px-4 py-2.5 text-sm rounded-lg bg-blue-500 text-white active:bg-blue-600 disabled:opacity-50 min-h-[44px]"
          >
            {loading ? "Generating..." : "Generate Summary"}
          </button>
        </div>
      )}
    </div>
  );
}
