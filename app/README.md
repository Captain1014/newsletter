# 출퇴근 뉴스레터 리더

A mobile-first PWA for listening to English newsletters on your commute. Connects to Gmail, splits content into paragraph cards, reads them aloud with TTS, and offers AI-powered explanations — all free to run.

## Features

- **Gmail integration** — OAuth login, auto-detects newsletters from a sender whitelist
- **Paragraph card reader** — one paragraph at a time, swipe left/right to navigate
- **TTS playback** — browser built-in, Gemini TTS, or Google Cloud TTS with word highlight sync
- **AI Explain** — tap to get an AI explanation of the current paragraph in your language
- **Podcast mode** — converts the full newsletter into a spoken podcast script
- **User profile personalization** — set your background in Settings so AI explanations and podcast scripts are tailored to you
- **Dark mode** — system, light, or dark
- **PWA** — add to home screen, runs like a native app

## Tech Stack

| | |
|---|---|
| Framework | Next.js 16 (App Router, Turbopack) |
| TTS | Web Speech API / Gemini TTS / Google Cloud TTS |
| AI | Google Gemini or Anthropic Claude (bring your own API key) |
| Gmail | Gmail API + Google OAuth |
| Storage | localStorage / IndexedDB |
| Deploy | Vercel (free) |

## Getting Started

```bash
cd app
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Settings

Go to **Settings** to configure:

| Setting | Notes |
|---|---|
| AI Provider | Gemini (free tier) or Claude |
| API Key | Your Gemini or Claude API key |
| About Me | Describe your background — AI will tailor explanations to you |
| Explanation Language | Korean, Japanese, Chinese, Spanish, French, German |
| Voice Engine | Gemini TTS (shares AI key), Google Cloud TTS, or Browser built-in |
| TTS Speed | 0.5x – 2.0x |
| Google OAuth Client ID | For Gmail integration |
| Sender Whitelist | Email addresses to pull newsletters from |

## Deploy

Push to GitHub and connect to [Vercel](https://vercel.com). No environment variables needed — all keys are stored client-side in localStorage.

## Cost

**$0** for personal use — Gemini free tier covers AI explanations and TTS, Vercel free tier covers hosting.
