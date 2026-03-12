import { parseDocument } from "htmlparser2";
import type { Document, Element, Text } from "domhandler";

function getTextContent(node: Element | Document): string {
  let text = "";
  for (const child of node.children) {
    if (child.type === "text") {
      text += (child as Text).data;
    } else if (child.type === "tag") {
      const el = child as Element;
      const tag = el.tagName.toLowerCase();

      // Skip non-content elements
      if (["script", "style", "head", "img", "svg"].includes(tag)) continue;

      // Block elements get line breaks
      if (["div", "p", "br", "tr", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"].includes(tag)) {
        text += "\n";
      }

      text += getTextContent(el);

      if (["div", "p", "tr", "li", "h1", "h2", "h3", "h4", "h5", "h6", "blockquote"].includes(tag)) {
        text += "\n";
      }
    }
  }
  return text;
}

const MIN_PARAGRAPH_LENGTH = 200;

function mergeShorParagraphs(paragraphs: string[]): string[] {
  const merged: string[] = [];
  let buffer = "";

  for (const p of paragraphs) {
    if (buffer) {
      buffer += " " + p;
    } else {
      buffer = p;
    }

    if (buffer.length >= MIN_PARAGRAPH_LENGTH) {
      merged.push(buffer);
      buffer = "";
    }
  }

  if (buffer) {
    if (merged.length > 0 && buffer.length < 100) {
      merged[merged.length - 1] += " " + buffer;
    } else {
      merged.push(buffer);
    }
  }

  return merged;
}

export function htmlToParagraphs(html: string): string[] {
  const doc = parseDocument(html);
  const raw = getTextContent(doc);

  const paragraphs = raw
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 20) // Filter out very short fragments (ads, footers)
    .filter((p) => !isBoilerplate(p));

  return mergeShorParagraphs(paragraphs);
}

const BOILERPLATE_PATTERNS = [
  /\bSign\s*Up\b/i,
  /\bAdvertise\b/i,
  /\bView\s*Online\b/i,
  /\bUnsubscribe\b/i,
  /\bManage\s*Preferences\b/i,
  /\bPrivacy\s*Policy\b/i,
  /\bTerms\s*of\s*Service\b/i,
];

function isBoilerplate(text: string): boolean {
  return BOILERPLATE_PATTERNS.some((pattern) => pattern.test(text)) && text.length < 150;
}

export function plainTextToParagraphs(text: string): string[] {
  const paragraphs = text
    .split(/\n{2,}/)
    .map((p) => p.replace(/\s+/g, " ").trim())
    .filter((p) => p.length > 20)
    .filter((p) => !isBoilerplate(p));

  return mergeShorParagraphs(paragraphs);
}
