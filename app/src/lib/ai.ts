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
    return "API key is not set. Please enter your API key in Settings.";
  }

  const systemPrompt = `You are a helpful assistant that explains English newsletter paragraphs.
Explain the following paragraph in ${getLanguageName(settings.language)}.
- Use simple, easy-to-understand language
- Use a friendly, casual tone
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
  return data.candidates?.[0]?.content?.parts?.[0]?.text ?? "Failed to generate explanation.";
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
  return data.content?.[0]?.text ?? "Failed to generate explanation.";
}

export async function generatePodcastScript(
  paragraphs: string[],
  settings: AISettings
): Promise<string[]> {
  if (!settings.apiKey) {
    throw new Error("API key is required. Please set it in Settings.");
  }

  const fullText = paragraphs.join("\n\n");

  const systemPrompt = `You are a podcast host who makes tech newsletters easy to understand for non-experts.
Your job is to EXPLAIN the newsletter — not just rephrase it.

Rules:
- For every topic: first explain WHAT happened, then WHY it matters to the listener
- Replace jargon with plain words. If a technical term is unavoidable, immediately explain it (e.g., "LLM — that's basically an AI that generates text")
- Use short, spoken-style sentences. Avoid complex sentence structures
- Add real-world analogies to make abstract concepts click (e.g., "Think of it like...")
- Skip filler content, ads, and self-promotion from the original newsletter
- Do NOT add intro/outro greetings — jump straight into the content
- Each section should be 3-5 sentences for good audio pacing
- Separate each section with "---" on its own line
- Write in a warm, clear tone — like explaining the news to a smart friend who isn't in tech`;

  let result: string;
  if (settings.provider === "gemini") {
    result = await callGemini(fullText, systemPrompt, { ...settings, model: settings.model || "gemini-2.5-flash" });
  } else {
    result = await callClaude(fullText, systemPrompt, settings);
  }

  // Split by --- separator, filter empty
  return result
    .split(/\n---\n/)
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function getLanguageName(code: string): string {
  const map: Record<string, string> = {
    ko: "Korean",
    ja: "Japanese",
    zh: "Chinese",
    es: "Spanish",
    fr: "French",
    de: "German",
  };
  return map[code] ?? "Korean";
}
