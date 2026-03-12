"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { Newsletter } from "@/types";
import { htmlToParagraphs } from "@/lib/parser";
import { useReaderStore } from "@/store/useReaderStore";
import {
  startOAuth,
  handleOAuthCallback,
  isLoggedIn,
  logout,
  fetchNewsletters,
} from "@/lib/gmail";

export default function Home() {
  const router = useRouter();
  const [pasteMode, setPasteMode] = useState(false);
  const [pasteText, setPasteText] = useState("");
  const [gmailLoggedIn, setGmailLoggedIn] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const { newsletters, setNewsletters, setCurrentNewsletter } =
    useReaderStore();

  // Handle OAuth callback on mount
  useEffect(() => {
    const handled = handleOAuthCallback();
    if (handled) {
      setGmailLoggedIn(true);
    } else {
      setGmailLoggedIn(isLoggedIn());
    }
  }, []);

  // Auto-fetch newsletters when logged in
  const fetchMails = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const fetched = await fetchNewsletters();
      if (fetched.length === 0) {
        setError("새 뉴스레터가 없습니다.");
      } else {
        // Merge with existing, avoid duplicates
        const existingIds = new Set(newsletters.map((n) => n.id));
        const newOnes = fetched.filter((n) => !existingIds.has(n.id));
        if (newOnes.length > 0) {
          setNewsletters([...newOnes, ...newsletters]);
        }
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : "메일을 가져올 수 없습니다.");
      if (
        e instanceof Error &&
        e.message.includes("토큰이 만료")
      ) {
        setGmailLoggedIn(false);
      }
    } finally {
      setLoading(false);
    }
  }, [newsletters, setNewsletters]);

  // Auto-fetch on login
  useEffect(() => {
    if (gmailLoggedIn && newsletters.length === 0) {
      fetchMails();
    }
  }, [gmailLoggedIn]); // eslint-disable-line react-hooks/exhaustive-deps

  function handlePaste() {
    if (!pasteText.trim()) return;

    const isHtml = /<[a-z][\s\S]*>/i.test(pasteText);
    const paragraphs = isHtml
      ? htmlToParagraphs(pasteText)
      : pasteText
          .split(/\n{2,}/)
          .map((p) => p.trim())
          .filter((p) => p.length > 20);

    if (paragraphs.length === 0) return;

    const nl: Newsletter = {
      id: `paste-${Date.now()}`,
      subject: paragraphs[0].slice(0, 60) + "...",
      from: "Pasted",
      date: new Date().toLocaleDateString(),
      paragraphs,
    };

    setNewsletters([nl, ...newsletters]);
    setCurrentNewsletter(nl);
    setPasteText("");
    setPasteMode(false);
    router.push("/reader");
  }

  function openNewsletter(nl: Newsletter) {
    setCurrentNewsletter(nl);
    router.push("/reader");
  }

  function handleGmailLogin() {
    try {
      startOAuth();
    } catch (e) {
      setError(e instanceof Error ? e.message : "로그인 실패");
    }
  }

  function handleLogout() {
    logout();
    setGmailLoggedIn(false);
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <header className="flex items-center justify-between px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <h1 className="text-lg font-semibold">Newsletter Reader</h1>
        <button
          onClick={() => router.push("/settings")}
          className="p-2 rounded-lg hover:bg-zinc-100 dark:hover:bg-zinc-800"
          aria-label="Settings"
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
              d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.066 2.573c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.573 1.066c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.066-2.573c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z"
            />
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
            />
          </svg>
        </button>
      </header>

      {/* Content */}
      <div className="flex-1 px-4 py-4">
        {/* Gmail Connection */}
        <div className="mb-4 flex gap-2">
          {gmailLoggedIn ? (
            <>
              <button
                onClick={fetchMails}
                disabled={loading}
                className="flex-1 py-3 rounded-xl bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors disabled:opacity-50"
              >
                {loading ? "불러오는 중..." : "Gmail 새로고침"}
              </button>
              <button
                onClick={handleLogout}
                className="px-4 py-3 rounded-xl bg-zinc-200 dark:bg-zinc-800 text-sm hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                로그아웃
              </button>
            </>
          ) : (
            <button
              onClick={handleGmailLogin}
              className="flex-1 py-3 rounded-xl bg-white dark:bg-zinc-900 border border-zinc-300 dark:border-zinc-700 font-medium hover:bg-zinc-50 dark:hover:bg-zinc-800 transition-colors flex items-center justify-center gap-2"
            >
              <svg className="w-5 h-5" viewBox="0 0 24 24">
                <path
                  fill="#4285F4"
                  d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
                />
                <path
                  fill="#34A853"
                  d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
                />
                <path
                  fill="#FBBC05"
                  d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
                />
                <path
                  fill="#EA4335"
                  d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
                />
              </svg>
              Gmail 연동하기
            </button>
          )}
        </div>

        {/* Error message */}
        {error && (
          <div className="mb-4 p-3 rounded-xl bg-red-50 dark:bg-red-950/30 border border-red-200 dark:border-red-900 text-sm text-red-600 dark:text-red-400">
            {error}
          </div>
        )}

        {/* Paste button */}
        {!pasteMode && (
          <button
            onClick={() => setPasteMode(true)}
            className="w-full py-3 mb-4 rounded-xl border-2 border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 dark:text-zinc-400 hover:border-blue-400 hover:text-blue-500 transition-colors"
          >
            + 뉴스레터 붙여넣기
          </button>
        )}

        {/* Paste area */}
        {pasteMode && (
          <div className="mb-4 space-y-2">
            <textarea
              value={pasteText}
              onChange={(e) => setPasteText(e.target.value)}
              placeholder="뉴스레터 본문 (텍스트 또는 HTML)을 붙여넣으세요..."
              className="w-full h-40 p-3 rounded-xl border border-zinc-300 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-900 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-blue-500"
              autoFocus
            />
            <div className="flex gap-2">
              <button
                onClick={handlePaste}
                className="flex-1 py-2 rounded-lg bg-blue-500 text-white font-medium hover:bg-blue-600 transition-colors"
              >
                읽기 시작
              </button>
              <button
                onClick={() => {
                  setPasteMode(false);
                  setPasteText("");
                }}
                className="px-4 py-2 rounded-lg bg-zinc-200 dark:bg-zinc-800 hover:bg-zinc-300 dark:hover:bg-zinc-700 transition-colors"
              >
                취소
              </button>
            </div>
          </div>
        )}

        {/* Newsletter list */}
        {newsletters.length === 0 && !loading ? (
          <div className="flex flex-col items-center justify-center py-20 text-zinc-400 dark:text-zinc-600">
            <svg
              className="w-16 h-16 mb-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={1}
                d="M19 20H5a2 2 0 01-2-2V6a2 2 0 012-2h10a2 2 0 012 2v1m2 13a2 2 0 01-2-2V7m2 13a2 2 0 002-2V9a2 2 0 00-2-2h-2m-4-3H9M7 16h6M7 8h6v4H7V8z"
              />
            </svg>
            <p className="text-sm">
              {gmailLoggedIn
                ? "Gmail에서 뉴스레터를 불러오거나 붙여넣기하세요"
                : "Gmail을 연동하거나 뉴스레터를 붙여넣어 시작하세요"}
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {newsletters.map((nl) => (
              <button
                key={nl.id}
                onClick={() => openNewsletter(nl)}
                className="w-full text-left p-4 rounded-xl bg-zinc-50 dark:bg-zinc-900 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition-colors"
              >
                <p className="font-medium text-sm line-clamp-1">
                  {nl.subject}
                </p>
                <div className="flex items-center gap-2 mt-1 text-xs text-zinc-500">
                  <span>{nl.from}</span>
                  <span>·</span>
                  <span>{nl.date}</span>
                  <span>·</span>
                  <span>{nl.paragraphs.length} paragraphs</span>
                </div>
              </button>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
