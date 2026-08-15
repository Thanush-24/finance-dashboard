// Rendered as its own zero-size <svg>, not nested inside Recharts' chart
// svg — url(#id) fill references resolve against the whole document's id
// namespace in all modern browsers, so the defs don't need to live inside
// the same <svg> element that consumes them.
function ChartPatternDefs() {
  return (
    <svg width={0} height={0} aria-hidden="true" className="absolute">
      <defs>
        {/* Solid — no texture overlay; "no pattern" is itself a distinct,
          recognizable encoding alongside the textured ones below. */}
        <pattern
          id="pattern-solid-denim"
          width={8}
          height={8}
          patternUnits="userSpaceOnUse"
        >
          <rect width={8} height={8} fill="var(--color-chart-denim)" />
        </pattern>

        <pattern
          id="pattern-dots-brass"
          width={8}
          height={8}
          patternUnits="userSpaceOnUse"
        >
          <rect width={8} height={8} fill="var(--color-chart-brass)" />
          <circle cx={2} cy={2} r={1.2} fill="white" fillOpacity={0.55} />
          <circle cx={6} cy={6} r={1.2} fill="white" fillOpacity={0.55} />
        </pattern>

        <pattern
          id="pattern-diagonal-plum"
          width={8}
          height={8}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(45)"
        >
          <rect width={8} height={8} fill="var(--color-chart-plum)" />
          <rect width={3} height={8} fill="white" fillOpacity={0.3} />
        </pattern>

        <pattern
          id="pattern-cross-olive"
          width={8}
          height={8}
          patternUnits="userSpaceOnUse"
        >
          <rect width={8} height={8} fill="var(--color-chart-olive)" />
          <rect width={8} height={1.4} fill="white" fillOpacity={0.35} />
          <rect width={1.4} height={8} fill="white" fillOpacity={0.35} />
        </pattern>

        <pattern
          id="pattern-horizontal-slate"
          width={8}
          height={8}
          patternUnits="userSpaceOnUse"
        >
          <rect width={8} height={8} fill="var(--color-ink-soft)" />
          <rect width={8} height={2} fill="white" fillOpacity={0.3} />
        </pattern>

        <pattern
          id="pattern-diagonal2-clay"
          width={8}
          height={8}
          patternUnits="userSpaceOnUse"
          patternTransform="rotate(-45)"
        >
          <rect width={8} height={8} fill="var(--color-chart-clay)" />
          <rect width={2} height={8} fill="white" fillOpacity={0.35} />
        </pattern>
      </defs>
    </svg>
  );
}

export default ChartPatternDefs;
