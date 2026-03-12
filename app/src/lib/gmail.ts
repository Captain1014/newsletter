import { Newsletter } from "@/types";
import { getSettings } from "./storage";
import { getOAuthToken, saveOAuthToken, clearOAuthToken } from "./storage";
import { htmlToParagraphs } from "./parser";

const GMAIL_API = "https://www.googleapis.com/gmail/v1/users/me";
const SCOPES = "https://www.googleapis.com/auth/gmail.readonly";

// --- OAuth ---

export function startOAuth() {
  const settings = getSettings();
  if (!settings.googleClientId) {
    throw new Error("Google Client ID is not set. Please enter it in Settings.");
  }

  const basePath = window.location.pathname.replace(/\/+$/, "").split("/").slice(0, 2).join("/");
  const redirectUri = window.location.origin + basePath + "/";
  const params = new URLSearchParams({
    client_id: settings.googleClientId,
    redirect_uri: redirectUri,
    response_type: "token",
    scope: SCOPES,
    prompt: "consent",
  });

  window.location.href = `https://accounts.google.com/o/oauth2/v2/auth?${params}`;
}

export function handleOAuthCallback(): boolean {
  const hash = window.location.hash;
  if (!hash.includes("access_token")) return false;

  const params = new URLSearchParams(hash.substring(1));
  const token = params.get("access_token");
  if (token) {
    saveOAuthToken(token);
    // Clean up URL
    window.history.replaceState(null, "", window.location.pathname);
    return true;
  }
  return false;
}

export function isLoggedIn(): boolean {
  return !!getOAuthToken();
}

export function logout() {
  clearOAuthToken();
}

// --- Gmail API ---

async function gmailFetch(path: string): Promise<Response> {
  const token = getOAuthToken();
  if (!token) throw new Error("Login required.");

  const res = await fetch(`${GMAIL_API}${path}`, {
    headers: { Authorization: `Bearer ${token}` },
  });

  if (res.status === 401) {
    clearOAuthToken();
    throw new Error("Token expired. Please log in again.");
  }

  if (!res.ok) {
    throw new Error(`Gmail API error: ${res.status}`);
  }

  return res;
}

export async function fetchNewsletters(): Promise<Newsletter[]> {
  const settings = getSettings();
  const whitelist = settings.senderWhitelist.filter((s) => s.trim());

  if (whitelist.length === 0) {
    throw new Error("Sender whitelist is empty. Please add senders in Settings.");
  }

  // Build Gmail search query: from sender whitelist, unread
  const fromQuery = whitelist.map((s) => `from:${s}`).join(" OR ");
  const query = `(${fromQuery}) is:unread`;

  const res = await gmailFetch(
    `/messages?q=${encodeURIComponent(query)}&maxResults=10`
  );
  const data = await res.json();

  if (!data.messages || data.messages.length === 0) {
    return [];
  }

  // Fetch each message in parallel
  const newsletters = await Promise.all(
    data.messages.map((msg: { id: string }) => fetchMessage(msg.id))
  );

  return newsletters.filter((nl): nl is Newsletter => nl !== null);
}

async function fetchMessage(messageId: string): Promise<Newsletter | null> {
  try {
    const res = await gmailFetch(`/messages/${messageId}?format=full`);
    const msg = await res.json();

    const headers = msg.payload?.headers ?? [];
    const subject =
      headers.find((h: { name: string }) => h.name === "Subject")?.value ??
      "No Subject";
    const from =
      headers.find((h: { name: string }) => h.name === "From")?.value ?? "";
    const date =
      headers.find((h: { name: string }) => h.name === "Date")?.value ?? "";

    // Extract HTML body
    const htmlBody = extractBody(msg.payload);
    if (!htmlBody) return null;

    const paragraphs = htmlToParagraphs(htmlBody);
    if (paragraphs.length === 0) return null;

    // Extract sender name/email
    const fromMatch = from.match(/(?:"?(.+?)"?\s)?<?([^>]+)>?/);
    const fromDisplay = fromMatch?.[1] || fromMatch?.[2] || from;

    return {
      id: messageId,
      subject,
      from: fromDisplay,
      date: new Date(date).toLocaleDateString(),
      paragraphs,
      snippet: msg.snippet,
    };
  } catch {
    return null;
  }
}

function extractBody(payload: GmailPayload): string | null {
  // Direct HTML body
  if (payload.mimeType === "text/html" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  // Multipart — search for text/html part
  if (payload.parts) {
    for (const part of payload.parts) {
      if (part.mimeType === "text/html" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
      // Nested multipart
      if (part.parts) {
        const nested = extractBody(part);
        if (nested) return nested;
      }
    }

    // Fallback to text/plain
    for (const part of payload.parts) {
      if (part.mimeType === "text/plain" && part.body?.data) {
        return decodeBase64Url(part.body.data);
      }
    }
  }

  // Direct plain text
  if (payload.mimeType === "text/plain" && payload.body?.data) {
    return decodeBase64Url(payload.body.data);
  }

  return null;
}

function decodeBase64Url(data: string): string {
  const base64 = data.replace(/-/g, "+").replace(/_/g, "/");
  return decodeURIComponent(
    atob(base64)
      .split("")
      .map((c) => "%" + ("00" + c.charCodeAt(0).toString(16)).slice(-2))
      .join("")
  );
}

// Gmail API types
interface GmailPayload {
  mimeType: string;
  body?: { data?: string };
  parts?: GmailPayload[];
}
