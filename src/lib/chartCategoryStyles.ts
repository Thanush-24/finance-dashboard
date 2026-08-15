// Category identity in the pie chart is encoded by color AND pattern, not
// color alone — each entry pairs a color with a distinct fill texture so
// the chart still communicates correctly for colorblind viewers or a
// grayscale printout. Pattern defs live in components/ChartPatternDefs.tsx.
export interface CategoryStyle {
  color: string;
  patternId: string;
}

export const CATEGORY_STYLE_SEQUENCE: CategoryStyle[] = [
  { color: "var(--color-chart-denim)", patternId: "pattern-solid-denim" },
  { color: "var(--color-chart-brass)", patternId: "pattern-dots-brass" },
  { color: "var(--color-chart-plum)", patternId: "pattern-diagonal-plum" },
  { color: "var(--color-chart-olive)", patternId: "pattern-cross-olive" },
  { color: "var(--color-ink-soft)", patternId: "pattern-horizontal-slate" },
  { color: "var(--color-chart-clay)", patternId: "pattern-diagonal2-clay" },
];

export function getCategoryStyle(index: number): CategoryStyle {
  return CATEGORY_STYLE_SEQUENCE[index % CATEGORY_STYLE_SEQUENCE.length];
}
