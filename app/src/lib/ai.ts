import { AISettings } from "@/types";

export async function getSummary(
  fullText: string,
  settings: AISettings
): Promise<string> {
  if (!settings.apiKey) {
    return "API key is required for summary. Please set it in Settings.";
  }

  const systemPrompt = `You are a concise newsletter summarizer.
Summarize the following newsletter in English in 3-5 bullet points.
- Each bullet should be one clear sentence
- Focus on the key takeaways and news
- Use plain, accessible English
- Start each bullet with "•"`;

  if (settings.provider === "gemini") {
    return callGemini(fullText, systemPrompt, settings);
  } else {
    return callClaude(fullText, systemPrompt, settings);
  }
}

export async function getExplanation(
  paragraph: string,
  settings: AISettings
): Promise<string> {
  if (!settings.apiKey) {
    return "API 키가 설정되지 않았습니다. 설정에서 API 키를 입력해주세요.";
  }

  const systemPrompt = `You are a helpful assistant that explains English newsletter paragraphs.
Explain the following paragraph in ${getLanguageName(settings.language)}.
- Use simple, easy-to-understand language
- 친근한 반말 사용
- Explain technical terms in parentheses
- Focus on the key meaning and context`;

  if (settings.provider === "gemini") {
    return callGemini(paragraph, systemPrompt, settings);
  } else {
    return callClaude(paragraph, systemPrompt, settings);
  }
}

async function callGemini(
  paragraph: string,
  systemPrompt: string,
  settings: AISettings
): Promise<string> {
  const res = await fetch(
    `https://generativelanguage.googleapis.com/v1beta/models/${settings.model}:generateContent?key=${settings.apiKey}`,
    {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        system_instruction: { parts: [{ text: systemPrompt }] },
        contents: [{ parts: [{ text: paragraph }] }],
      }),
    }
  );

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Gemini API error: ${err}`);
  }

  const data = await res.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "해설을 생성할 수 없습니다.";
}

async function callClaude(
  paragraph: string,
  systemPrompt: string,
  settings: AISettings
): Promise<string> {
  const res = await fetch("https://api.anthropic.com/v1/messages", {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "x-api-key": settings.apiKey,
      "anthropic-version": "2023-06-01",
      "anthropic-dangerous-direct-browser-access": "true",
    },
    body: JSON.stringify({
      model: settings.model || "claude-haiku-4-5-20251001",
      max_tokens: 300,
      system: systemPrompt,
      messages: [{ role: "user", content: paragraph }],
    }),
  });

  if (!res.ok) {
    const err = await res.text();
    throw new Error(`Claude API error: ${err}`);
  }

  const data = await res.json();
  return data.content?.[0]?.text ?? "해설을 생성할 수 없습니다.";
}

function getLanguageName(code: string): string {
  const map: Record<string, string> = {
    ko: "Korean (한국어)",
    ja: "Japanese (日本語)",
    zh: "Chinese (中文)",
    es: "Spanish (Español)",
    fr: "French (Français)",
    de: "German (Deutsch)",
  };
  return map[code] ?? "Korean (한국어)";
}
