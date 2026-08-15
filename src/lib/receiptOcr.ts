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

// Matches comma-grouped numbers ("38,026.00", Indian lakh-style "1,23,456")
// OR a plain digit run of any length ("38026.00") — the previous version
// capped the integer part at 3 digits unless comma-grouped, so a plain
// "38026.00" got truncated to "380" with the leftover "26.00" spuriously
// picked up as an unrelated second match.
const NUMBER_PATTERN =
  /[₹$]?\s?(\d{1,3}(?:,\d{2,3})+(?:\.\d{1,2})?|\d+(?:\.\d{1,2})?)/g;

// Line items and GST/quantity subtotals both contain the word "total" or a
// currency-looking number, so a naive "last line matching /total/" search
// can grab a line item's unit price instead of the actual grand total on a
// dense invoice. These phrases are ranked from most to least specific — the
// first rank with any match wins — and sub-total/tax-total lines are
// excluded outright since they're never the amount actually paid.
const EXCLUDE_TOTAL_LINE =
  /sub[\s-]?total|total\s*(qty|quantity|gst|tax|cgst|sgst|igst)/i;
const STRONG_TOTAL_PHRASES = [
  /grand\s*total/i,
  /total\s*amount/i,
  /net\s*amount/i,
  /amount\s*payable/i,
  /balance\s*due/i,
  /amount\s*due/i,
];
// Numbers on these lines are identifiers (tax IDs, phone/account numbers,
// invoice/vehicle numbers), not amounts — excluded from the last-resort
// fallback so a GSTIN digit run never gets mistaken for the total.
const IDENTIFIER_LINE =
  /gstin|phone|contact|mobile|account|a\/c|ifsc|hsn|invoice\s*no|inv\.?\s*no|vehicle|pin\s*code/i;

interface LineNumber {
  value: number;
  // Whether the matched text included a decimal point ("x.xx"). OCR
  // losing a comma or decimal point tends to merge unrelated digits into
  // one large decimal-less integer (e.g. "14,145.84" misread as
  // "1414588") — that shape is a strong signal the number is corrupted
  // rather than a genuine amount, since every real total on these
  // receipts is written with exactly two decimal places.
  hasDecimal: boolean;
}

function numbersOnLine(line: string): LineNumber[] {
  return [...line.matchAll(NUMBER_PATTERN)]
    .map((match) => ({
      value: parseFloat(match[1].replace(/,/g, "")),
      hasDecimal: match[1].includes("."),
    }))
    .filter((n) => !Number.isNaN(n.value) && n.value > 0);
}

// Prefers the largest decimal-bearing candidate; only falls back to a
// decimal-less integer if nothing decimal-bearing is available.
function bestNumber(numbers: LineNumber[]): number | null {
  const decimals = numbers.filter((n) => n.hasDecimal);
  const pool = decimals.length > 0 ? decimals : numbers;
  return pool.reduce<number | null>(
    (best, n) => (best === null || n.value > best ? n.value : best),
    null,
  );
}

function largestOnQualifyingLines(
  lines: string[],
  qualifies: (line: string) => boolean,
): number | null {
  let best: number | null = null;
  for (const line of lines) {
    if (EXCLUDE_TOTAL_LINE.test(line) || !qualifies(line)) continue;
    const candidate = bestNumber(numbersOnLine(line));
    if (candidate !== null && (best === null || candidate > best)) {
      best = candidate;
    }
  }
  return best;
}

// Real bills on this app rarely exceed this; only applied to the riskiest
// last-resort tier below, where a corrupted OCR digit-merge is most
// likely to masquerade as a plausible-looking huge total.
const MAX_PLAUSIBLE_FALLBACK_AMOUNT = 10_000_000;

function guessAmount(text: string): number | null {
  const lines = text.split("\n");

  for (const phrase of STRONG_TOTAL_PHRASES) {
    const match = largestOnQualifyingLines(lines, (line) => phrase.test(line));
    if (match !== null) return match;
  }

  const looseMatch = largestOnQualifyingLines(lines, (line) =>
    /total/i.test(line),
  );
  if (looseMatch !== null) return looseMatch;

  // Last resort: largest plausible currency-looking number anywhere,
  // skipping identifier lines and implausibly large candidates.
  const candidates: LineNumber[] = [];
  for (const line of lines) {
    if (IDENTIFIER_LINE.test(line)) continue;
    for (const n of numbersOnLine(line)) {
      if (n.value <= MAX_PLAUSIBLE_FALLBACK_AMOUNT) candidates.push(n);
    }
  }
  return bestNumber(candidates);
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
