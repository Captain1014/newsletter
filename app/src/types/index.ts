export interface Newsletter {
  id: string;
  subject: string;
  from: string;
  date: string;
  paragraphs: string[];
  snippet?: string;
}

export interface ReadingProgress {
  newsletterId: string;
  currentIndex: number;
  totalParagraphs: number;
  completedAt?: string;
}

export interface AISettings {
  provider: "gemini" | "claude";
  apiKey: string;
  language: string;
  model: string;
}

export interface TTSSettings {
  provider: "browser" | "google-cloud" | "gemini";
  apiKey: string;
  voice: string;
}

export interface AppSettings {
  ai: AISettings;
  tts: TTSSettings;
  ttsRate: number;
  darkMode: "system" | "dark" | "light";
  senderWhitelist: string[];
  googleClientId: string;
}

export const DEFAULT_SETTINGS: AppSettings = {
  ai: {
    provider: "gemini",
    apiKey: "",
    language: "ko",
    model: "gemini-2.5-flash",
  },
  tts: {
    provider: "gemini",
    apiKey: "",
    voice: "Kore",
  },
  ttsRate: 1.0,
  darkMode: "system",
  googleClientId: "",
  senderWhitelist: [

    "dan@tldrnewsletter.com",
   
  ],
};
