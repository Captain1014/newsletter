# Newsletter Reader

A PWA for reading English newsletters with AI-powered TTS and explanations. Designed for commuters who want to consume newsletters by listening rather than reading.

**Live:** https://captain1014.github.io/newsletter/

## Features

- **Paragraph Cards** — Newsletters split into swipeable cards, one paragraph at a time
- **Gemini TTS** — Natural AI voice reads paragraphs aloud (free with Gemini API key)
- **AI Explanations** — Get instant explanations in your language (Korean, Japanese, Chinese, etc.)
- **AI Summary** — Generate a bullet-point overview before reading
- **Gmail Integration** — Auto-fetch newsletters from your inbox via Google OAuth
- **Paste Input** — Paste any newsletter text or HTML as a fallback
- **Mobile PWA** — Install to home screen for native app-like experience
- **Dark Mode** — Follows system preference

## Tech Stack

- **Next.js 16** (App Router, static export)
- **Gemini API** — TTS + AI explanations (free tier)
- **Gmail API** — Newsletter fetching via OAuth
- **Zustand** — State management
- **Tailwind CSS** — Styling
- **GitHub Pages** — Hosting

## Setup

```bash
cd app
npm install
npm run dev
```

Open http://localhost:3000

### API Keys (Settings page)

1. **Gemini API Key** — Get one at [Google AI Studio](https://aistudio.google.com/apikey). Used for both AI explanations and TTS.
2. **Google OAuth Client ID** (optional) — For Gmail integration. Create at Google Cloud Console > APIs & Services > Credentials > OAuth 2.0 Client ID.

### Gmail OAuth Setup

1. Create a project in Google Cloud Console
2. Enable Gmail API
3. Create OAuth 2.0 Client ID (Web Application)
4. Add authorized redirect URIs:
   - `http://localhost:3000/` (development)
   - `https://captain1014.github.io/newsletter/` (production)
5. Add authorized JavaScript origins:
   - `http://localhost:3000`
   - `https://captain1014.github.io`
6. Enter the Client ID in the app's Settings page

## Deployment

Pushes to `main` auto-deploy to GitHub Pages via GitHub Actions.

```bash
git push origin main
```

## License

MIT
