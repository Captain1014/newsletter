import { AppSettings, DEFAULT_SETTINGS, ReadingProgress } from "@/types";

const KEYS = {
  SETTINGS: "nl-settings",
  PROGRESS: "nl-progress",
  OAUTH_TOKEN: "nl-oauth-token",
} as const;

export function getSettings(): AppSettings {
  if (typeof window === "undefined") return DEFAULT_SETTINGS;
  const raw = localStorage.getItem(KEYS.SETTINGS);
  if (!raw) return DEFAULT_SETTINGS;
  return { ...DEFAULT_SETTINGS, ...JSON.parse(raw) };
}

export function saveSettings(settings: Partial<AppSettings>) {
  const current = getSettings();
  localStorage.setItem(
    KEYS.SETTINGS,
    JSON.stringify({ ...current, ...settings })
  );
}

export function getProgress(newsletterId: string): ReadingProgress | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(KEYS.PROGRESS);
  if (!raw) return null;
  const all: Record<string, ReadingProgress> = JSON.parse(raw);
  return all[newsletterId] ?? null;
}

export function saveProgress(progress: ReadingProgress) {
  const raw = localStorage.getItem(KEYS.PROGRESS);
  const all: Record<string, ReadingProgress> = raw ? JSON.parse(raw) : {};
  all[progress.newsletterId] = progress;
  localStorage.setItem(KEYS.PROGRESS, JSON.stringify(all));
}

export function getOAuthToken(): string | null {
  if (typeof window === "undefined") return null;
  return localStorage.getItem(KEYS.OAUTH_TOKEN);
}

export function saveOAuthToken(token: string) {
  localStorage.setItem(KEYS.OAUTH_TOKEN, token);
}

export function clearOAuthToken() {
  localStorage.removeItem(KEYS.OAUTH_TOKEN);
}
