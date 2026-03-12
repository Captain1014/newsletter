"use client";

import { useMemo } from "react";
import { useReaderStore } from "@/store/useReaderStore";

export default function ParagraphCard({ text }: { text: string }) {
  const { highlightRange } = useReaderStore();

  const rendered = useMemo(() => {
    if (!highlightRange) return text;

    const { start, end } = highlightRange;
    if (start >= text.length) return text;

    const before = text.slice(0, start);
    const highlighted = text.slice(start, end);
    const after = text.slice(end);

    return (
      <>
        {before}
        <span className="tts-highlight">{highlighted}</span>
        {after}
      </>
    );
  }, [text, highlightRange]);

  return (
    <div className="p-5 rounded-2xl bg-white dark:bg-zinc-900 shadow-sm border border-zinc-100 dark:border-zinc-800">
      <p className="text-base leading-7 whitespace-pre-wrap">{rendered}</p>
    </div>
  );
}
