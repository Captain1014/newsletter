"use client";

import { useRouter } from "next/navigation";
import { useState, useEffect } from "react";
import { getSettings, saveSettings } from "@/lib/storage";
import { AppSettings } from "@/types";

export default function SettingsPage() {
  const router = useRouter();
  const [settings, setSettings] = useState<AppSettings | null>(null);

  useEffect(() => {
    setSettings(getSettings());
  }, []);

  if (!settings) return null;

  function update(partial: Partial<AppSettings>) {
    const next = { ...settings!, ...partial };
    setSettings(next);
    saveSettings(next);
  }

  function updateAI(partial: Partial<AppSettings["ai"]>) {
    const ai = { ...settings!.ai, ...partial };
    update({ ai });
  }

  return (
    <div className="flex flex-col flex-1">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-3 border-b border-zinc-200 dark:border-zinc-800">
        <button
          onClick={() => router.push("/")}
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
        <h1 className="text-lg font-semibold">Settings</h1>
      </header>

      <div className="flex-1 px-4 py-4 space-y-6 overflow-y-auto">
        {/* AI Provider */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-3">
            AI Explanation
          </h2>
          <div className="space-y-3">
            {/* Provider select */}
            <div>
              <label className="text-sm mb-1 block">AI Provider</label>
              <select
                value={settings.ai.provider}
                onChange={(e) =>
                  updateAI({
                    provider: e.target.value as "gemini" | "claude",
                    model:
                      e.target.value === "gemini"
                        ? "gemini-2.5-flash"
                        : "claude-haiku-4-5-20251001",
                  })
                }
                className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
              >
                <option value="gemini">Google Gemini (Free)</option>
                <option value="claude">Anthropic Claude</option>
              </select>
            </div>

            {/* API Key */}
            <div>
              <label className="text-sm mb-1 block">API Key</label>
              <input
                type="password"
                value={settings.ai.apiKey}
                onChange={(e) => updateAI({ apiKey: e.target.value })}
                placeholder={
                  settings.ai.provider === "gemini"
                    ? "Gemini API key"
                    : "Claude API key"
                }
                className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
              />
            </div>

            {/* User Profile */}
            <div>
              <label className="text-sm mb-1 block">About Me</label>
              <textarea
                value={settings.ai.userProfile ?? ""}
                onChange={(e) => updateAI({ userProfile: e.target.value })}
                placeholder="e.g. I'm a Korean software engineer. I know tech well but not finance. Use coding analogies when possible."
                rows={3}
                className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm resize-none"
              />
              <p className="text-xs text-zinc-400 mt-1">
                AI will tailor explanations and podcast scripts to your background.
              </p>
            </div>

            {/* Language */}
            <div>
              <label className="text-sm mb-1 block">Explanation Language</label>
              <select
                value={settings.ai.language}
                onChange={(e) => updateAI({ language: e.target.value })}
                className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
              >
                <option value="ko">Korean</option>
                <option value="ja">Japanese</option>
                <option value="zh">Chinese</option>
                <option value="es">Spanish</option>
                <option value="fr">French</option>
                <option value="de">German</option>
              </select>
            </div>
          </div>
        </section>

        {/* TTS */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-3">
            TTS Settings
          </h2>
          <div className="space-y-3">
            {/* TTS Provider */}
            <div>
              <label className="text-sm mb-1 block">Voice Engine</label>
              <select
                value={settings.tts?.provider ?? "browser"}
                onChange={(e) =>
                  update({
                    tts: {
                      ...settings.tts,
                      provider: e.target.value as "browser" | "google-cloud" | "gemini",
                    },
                  })
                }
                className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
              >
                <option value="gemini">Gemini TTS (Shares AI key, Free)</option>
                <option value="google-cloud">Google Cloud TTS (Natural voice)</option>
                <option value="browser">Browser Built-in TTS (Free)</option>
              </select>
            </div>

            {/* Gemini TTS voice */}
            {settings.tts?.provider === "gemini" && (
              <div>
                <label className="text-sm mb-1 block">Voice</label>
                <select
                  value={settings.tts?.voice ?? "Kore"}
                  onChange={(e) =>
                    update({
                      tts: { ...settings.tts, voice: e.target.value },
                    })
                  }
                  className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                >
                  <option value="Kore">Kore (Female, Calm)</option>
                  <option value="Aoede">Aoede (Female, Bright)</option>
                  <option value="Puck">Puck (Male, Energetic)</option>
                  <option value="Charon">Charon (Male, Deep)</option>
                  <option value="Fenrir">Fenrir (Male, Natural)</option>
                </select>
                <p className="text-xs text-zinc-400 mt-1">
                  Shares the Gemini API key from AI settings. No separate key needed.
                </p>
              </div>
            )}

            {/* Google Cloud TTS API Key */}
            {settings.tts?.provider === "google-cloud" && (
              <>
                <div>
                  <label className="text-sm mb-1 block">Google Cloud API Key</label>
                  <input
                    type="password"
                    value={settings.tts?.apiKey ?? ""}
                    onChange={(e) =>
                      update({
                        tts: { ...settings.tts, apiKey: e.target.value },
                      })
                    }
                    placeholder="Google Cloud API key"
                    className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                  />
                  <p className="text-xs text-zinc-400 mt-1">
                    Google Cloud Console &rarr; Enable Text-to-Speech API &rarr; Create API Key
                  </p>
                </div>

                <div>
                  <label className="text-sm mb-1 block">Voice</label>
                  <select
                    value={settings.tts?.voice ?? "en-US-Neural2-J"}
                    onChange={(e) =>
                      update({
                        tts: { ...settings.tts, voice: e.target.value },
                      })
                    }
                    className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                  >
                    <option value="en-US-Neural2-J">Neural2-J (Male, Natural)</option>
                    <option value="en-US-Neural2-F">Neural2-F (Female, Natural)</option>
                    <option value="en-US-Neural2-D">Neural2-D (Male, Deep)</option>
                    <option value="en-US-Neural2-C">Neural2-C (Female, Bright)</option>
                    <option value="en-US-Studio-O">Studio-O (Male, Premium)</option>
                    <option value="en-US-Studio-Q">Studio-Q (Male, News Anchor)</option>
                  </select>
                </div>
              </>
            )}

            {/* Speed */}
            <div>
              <label className="text-sm mb-1 block">
                Speed: {settings.ttsRate.toFixed(1)}x
              </label>
              <input
                type="range"
                min="0.5"
                max="2.0"
                step="0.1"
                value={settings.ttsRate}
                onChange={(e) =>
                  update({ ttsRate: parseFloat(e.target.value) })
                }
                className="w-full accent-blue-500"
              />
              <div className="flex justify-between text-xs text-zinc-400 mt-1">
                <span>0.5x</span>
                <span>1.0x</span>
                <span>2.0x</span>
              </div>
            </div>
          </div>
        </section>

        {/* Gmail Integration */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-3">
            Gmail Integration
          </h2>
          <div>
            <label className="text-sm mb-1 block">Google OAuth Client ID</label>
            <input
              type="text"
              value={settings.googleClientId ?? ""}
              onChange={(e) => update({ googleClientId: e.target.value })}
              placeholder="xxxx.apps.googleusercontent.com"
              className="w-full p-2.5 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
            />
            <p className="text-xs text-zinc-400 mt-1">
              Google Cloud Console &rarr; Create OAuth 2.0 Client ID (Web Application)
            </p>
          </div>
        </section>

        {/* Sender whitelist */}
        <section>
          <h2 className="text-sm font-semibold text-zinc-500 dark:text-zinc-400 mb-3">
            Sender Whitelist
          </h2>
          <div className="space-y-2">
            {settings.senderWhitelist.map((sender, i) => (
              <div key={i} className="flex items-center gap-2">
                <input
                  value={sender}
                  onChange={(e) => {
                    const list = [...settings.senderWhitelist];
                    list[i] = e.target.value;
                    update({ senderWhitelist: list });
                  }}
                  className="flex-1 p-2 rounded-lg border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-sm"
                />
                <button
                  onClick={() => {
                    const list = settings.senderWhitelist.filter(
                      (_, idx) => idx !== i
                    );
                    update({ senderWhitelist: list });
                  }}
                  className="p-2 text-red-500 hover:bg-red-50 dark:hover:bg-red-950 rounded-lg"
                >
                  <svg
                    className="w-4 h-4"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M6 18L18 6M6 6l12 12"
                    />
                  </svg>
                </button>
              </div>
            ))}
            <button
              onClick={() =>
                update({
                  senderWhitelist: [...settings.senderWhitelist, ""],
                })
              }
              className="w-full py-2 rounded-lg border border-dashed border-zinc-300 dark:border-zinc-700 text-zinc-500 text-sm hover:border-blue-400 hover:text-blue-500"
            >
              + Add Sender
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}
