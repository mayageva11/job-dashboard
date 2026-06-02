function interpolateColor(score) {
  const stops = [
    { at: 70,  h: 25,  s: 90, l: 55 },
    { at: 80,  h: 45,  s: 90, l: 52 },
    { at: 90,  h: 90,  s: 80, l: 42 },
    { at: 100, h: 142, s: 70, l: 40 },
  ];
  if (score <= stops[0].at) return `hsl(${stops[0].h},${stops[0].s}%,${stops[0].l}%)`;
  const last = stops[stops.length - 1];
  if (score >= last.at) return `hsl(${last.h},${last.s}%,${last.l}%)`;
  for (let i = 0; i < stops.length - 1; i++) {
    const lo = stops[i], hi = stops[i + 1];
    if (score >= lo.at && score <= hi.at) {
      const t = (score - lo.at) / (hi.at - lo.at);
      return `hsl(${(lo.h + t * (hi.h - lo.h)).toFixed(1)},${(lo.s + t * (hi.s - lo.s)).toFixed(1)}%,${(lo.l + t * (hi.l - lo.l)).toFixed(1)}%)`;
    }
  }
  return `hsl(25,90%,55%)`;
}

export default function MatchBadge({ score }) {
  const color = interpolateColor(score);
  return (
    <span style={{
      color,
      border: `1px solid ${color}50`,
      background: `${color}18`,
      fontFamily: 'Geist Mono, monospace',
      fontSize: '11px',
      fontWeight: 600,
      padding: '3px 8px',
      borderRadius: '999px',
      whiteSpace: 'nowrap',
      letterSpacing: '0.02em',
    }}>
      {score}%
    </span>
  );
}
