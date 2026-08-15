export const CATEGORIES = [
  "Food",
  "Transport",
  "Rent",
  "Utilities",
  "Entertainment",
  "Salary",
  "Other",
] as const;

export type Category = (typeof CATEGORIES)[number];
