import { useEffect, useRef, useState } from 'react';

function AnimatedNumber({ value }) {
  const [display, setDisplay] = useState(0);
  const raf = useRef(null);

  useEffect(() => {
    if (!value) { setDisplay(0); return; }
    const start = performance.now();
    const duration = 500;
    function step(now) {
      const t = Math.min((now - start) / duration, 1);
      const ease = 1 - Math.pow(1 - t, 3);
      setDisplay(Math.round(ease * value));
      if (t < 1) raf.current = requestAnimationFrame(step);
    }
    raf.current = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf.current);
  }, [value]);

  return <>{display}</>;
}

const STATS = [
  { key: 'total',          label: 'Total scraped',    icon: '⬡', color: '#7c3aed' },
  { key: 'matched',        label: 'Matched ≥70%',     icon: '◈', color: '#a855f7' },
  { key: 'appliedThisWeek',label: 'Applied this week',icon: '◎', color: '#ea580c' },
  { key: 'dismissed',      label: 'Dismissed',        icon: '○', color: '#6b7280' },
];

export default function StatsBar({ counts }) {
  if (!counts) return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px', marginBottom: '32px' }}>
      {STATS.map((s) => (
        <div key={s.key} className="skeleton" style={{ height: '80px', borderRadius: '12px' }} />
      ))}
    </div>
  );

  return (
    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(160px, 1fr))', gap: '12px', marginBottom: '32px' }}>
      {STATS.map((s) => (
        <div key={s.key} style={{
          background: '#111',
          border: '1px solid #1e1e1e',
          borderRadius: '12px',
          padding: '16px 20px',
          position: 'relative',
          overflow: 'hidden',
          transition: 'border-color 150ms',
        }}
          onMouseEnter={(e) => (e.currentTarget.style.borderColor = `${s.color}40`)}
          onMouseLeave={(e) => (e.currentTarget.style.borderColor = '#1e1e1e')}
        >
          <div style={{
            position: 'absolute', top: 0, left: 0, width: '3px', height: '100%',
            background: `linear-gradient(180deg, ${s.color}, ${s.color}60)`,
            borderRadius: '12px 0 0 12px',
          }} />
          <div style={{ fontSize: '24px', fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>
            <AnimatedNumber value={counts[s.key] ?? 0} />
          </div>
          <div style={{ fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>{s.label}</div>
        </div>
      ))}
    </div>
  );
}
