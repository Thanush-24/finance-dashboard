// Tesseract.js is a large WASM bundle, so it's imported dynamically only
// when a receipt is actually scanned rather than on every page load.
export async function extractReceiptText(file: File): Promise<string> {
  const { createWorker } = await import("tesseract.js");
  const worker = await createWorker("eng");
  try {
    const {
      data: { text },
    } = await worker.recognize(file);
    return text;
  } finally {
    await worker.terminate();
  }
}

export interface ParsedReceipt {
  amount: number | null;
  date: string | null;
  category: string | null;
  description: string | null;
}

// Best-effort keyword categorization — a guess the user reviews and can
// freely override via the category field, never applied silently.
const CATEGORY_KEYWORDS: Array<{ category: string; keywords: string[] }> = [
  {
    category: "Food",
    keywords: [
      "restaurant",
      "cafe",
      "coffee",
      "diner",
      "food",
      "kitchen",
      "bakery",
      "pizza",
      "burger",
    ],
  },
  {
    category: "Transport",
    keywords: [
      "uber",
      "ola",
      "taxi",
      "cab",
      "fuel",
      "petrol",
      "diesel",
      "metro",
      "parking",
    ],
  },
  {
    category: "Utilities",
    keywords: [
      "electricity",
      "water bill",
      "broadband",
      "internet",
      "gas bill",
      "utility",
    ],
  },
  {
    category: "Entertainment",
    keywords: ["cinema", "movie", "theatre", "netflix", "spotify", "concert"],
  },
];

function guessCategory(text: string): string | null {
  const lower = text.toLowerCase();
  for (const { category, keywords } of CATEGORY_KEYWORDS) {
    if (keywords.some((keyword) => lower.includes(keyword))) {
      return category;
    }
  }
  return null;
}

const NUMBER_PATTERN = /[₹$]?\s?(\d{1,3}(?:,\d{2,3})*(?:\.\d{1,2})?)/g;

function guessAmount(text: string): number | null {
  const totalLinePattern = /total|grand total|amount due|balance due/i;
  let fromTotalLine: number | null = null;

  for (const line of text.split("\n")) {
    if (!totalLinePattern.test(line)) continue;
    const matches = [...line.matchAll(NUMBER_PATTERN)];
    if (matches.length === 0) continue;
    const value = parseFloat(matches[matches.length - 1][1].replace(/,/g, ""));
    if (!Number.isNaN(value) && value > 0) fromTotalLine = value;
  }
  if (fromTotalLine !== null) return fromTotalLine;

  // Fall back to the largest plausible currency-looking number anywhere
  // in the receipt (usually the grand total, even without a "Total" label).
  let largest: number | null = null;
  for (const match of text.matchAll(NUMBER_PATTERN)) {
    const value = parseFloat(match[1].replace(/,/g, ""));
    if (
      !Number.isNaN(value) &&
      value > 0 &&
      (largest === null || value > largest)
    ) {
      largest = value;
    }
  }
  return largest;
}

function guessDate(text: string): string | null {
  const dmy = text.match(/\b(\d{1,2})[/\-.](\d{1,2})[/\-.](\d{2,4})\b/);
  if (dmy) {
    const [, d, m, yRaw] = dmy;
    const y = yRaw.length === 2 ? `20${yRaw}` : yRaw;
    const month = Number(m);
    const day = Number(d);
    if (month >= 1 && month <= 12 && day >= 1 && day <= 31) {
      return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
    }
  }

  const ymd = text.match(/\b(20\d{2})[/\-.](\d{1,2})[/\-.](\d{1,2})\b/);
  if (ymd) {
    const [, y, m, d] = ymd;
    return `${y}-${m.padStart(2, "0")}-${d.padStart(2, "0")}`;
  }

  return null;
}

function guessDescription(text: string): string | null {
  const firstLine = text
    .split("\n")
    .map((line) => line.trim())
    .find((line) => line.length >= 3 && /[a-zA-Z]/.test(line));
  return firstLine ? firstLine.slice(0, 80) : null;
}

export function parseReceiptText(text: string): ParsedReceipt {
  return {
    amount: guessAmount(text),
    date: guessDate(text),
    category: guessCategory(text),
    description: guessDescription(text),
  };
}
