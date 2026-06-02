import { useState } from 'react';
import MatchBadge from './MatchBadge';
import { API_BASE_URL } from '../constants';
import toast from 'react-hot-toast';
import axios from 'axios';

const SOURCE_META = {
  adzuna:  { label: 'Adzuna',   color: '#2563eb' },
  linkedin:{ label: 'LinkedIn', color: '#0a66c2' },
  remote:  { label: 'Remote',   color: '#059669' },
};

function CompanyInitial({ company }) {
  const letter = (company || '?')[0].toUpperCase();
  const hue = (company || '').split('').reduce((a, c) => a + c.charCodeAt(0), 0) % 360;
  return (
    <div style={{
      width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0,
      background: `hsl(${hue},40%,18%)`,
      border: `1px solid hsl(${hue},40%,28%)`,
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      fontSize: '14px', fontWeight: 600,
      color: `hsl(${hue},60%,70%)`,
    }}>
      {letter}
    </div>
  );
}

export default function JobCard({ job, showDismissed, onDismiss, onUndismiss, onApplied }) {
  const [exiting, setExiting] = useState(false);
  const src = SOURCE_META[job.source] || { label: job.source, color: '#6b7280' };

  async function handleApply() {
    try {
      const { data } = await axios.post(`${API_BASE_URL}/api/apply/${job.id}`);
      window.open(data.url, '_blank', 'noopener');
      await navigator.clipboard.writeText(
        `Name: ${data.name}\nEmail: ${data.email}\nPhone: ${data.phone}\nLinkedIn: ${data.linkedin}`
      );
      toast.success('Applied! Job moved to Applied page.');
      setExiting(true);
      setTimeout(() => onApplied && onApplied(job.id), 150);
    } catch {
      toast.error('Could not open job.');
    }
  }

  function handleAction() {
    setExiting(true);
    setTimeout(() => {
      if (showDismissed) onUndismiss(job.id);
      else onDismiss(job.id);
    }, 150);
  }

  return (
    <div
      className={exiting ? 'card-exit' : 'card-enter'}
      style={{
        background: '#111',
        border: '1px solid #1e1e1e',
        borderRadius: '14px',
        padding: '20px',
        display: 'flex',
        flexDirection: 'column',
        gap: '14px',
        transition: 'border-color 150ms ease, box-shadow 150ms ease',
        position: 'relative',
        overflow: 'hidden',
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.borderColor = '#7c3aed40';
        e.currentTarget.style.boxShadow = '0 0 0 1px #7c3aed20, 0 8px 32px #7c3aed10';
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.borderColor = '#1e1e1e';
        e.currentTarget.style.boxShadow = 'none';
      }}
    >
      {/* Top row: company + badge */}
      <div style={{ display: 'flex', alignItems: 'flex-start', gap: '12px' }}>
        <CompanyInitial company={job.company} />
        <div style={{ flex: 1, minWidth: 0 }}>
          <div style={{ fontSize: '15px', fontWeight: 600, color: '#f0f0f0', lineHeight: 1.3, marginBottom: '3px', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
            {job.title}
          </div>
          <div style={{ fontSize: '13px', color: '#9ca3af' }}>
            {job.company}
          </div>
        </div>
        <MatchBadge score={job.match_score} />
      </div>

      {/* Location + source */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
        <span style={{ fontSize: '12px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px' }}>
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
          </svg>
          {job.location || 'Israel'}
        </span>
        <span style={{ color: '#2a2a2a' }}>·</span>
        <span style={{
          fontSize: '11px', fontWeight: 500, padding: '2px 7px',
          borderRadius: '999px',
          background: `${src.color}18`,
          border: `1px solid ${src.color}35`,
          color: src.color,
        }}>
          {src.label}
        </span>
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '8px', marginTop: 'auto' }}>
        <button
          onClick={handleApply}
          style={{
            flex: 1, background: 'linear-gradient(135deg, #7c3aed, #6d28d9)',
            color: '#fff', border: 'none', borderRadius: '8px',
            padding: '9px 16px', fontSize: '13px', fontWeight: 500,
            cursor: 'pointer', transition: 'opacity 100ms, transform 100ms',
            fontFamily: 'inherit', display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px',
          }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.97)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          Apply
          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
            <path d="M5 12h14M12 5l7 7-7 7"/>
          </svg>
        </button>

        <button
          onClick={handleAction}
          title={showDismissed ? 'Restore job' : 'Dismiss job'}
          style={{
            background: 'transparent',
            color: '#6b7280',
            border: '1px solid #1e1e1e',
            borderRadius: '8px',
            padding: '9px 12px',
            fontSize: '13px',
            cursor: 'pointer',
            transition: 'all 100ms ease',
            fontFamily: 'inherit',
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.borderColor = '#dc2626';
            e.currentTarget.style.color = '#dc2626';
            e.currentTarget.style.background = '#dc262610';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.borderColor = '#1e1e1e';
            e.currentTarget.style.color = '#6b7280';
            e.currentTarget.style.background = 'transparent';
          }}
          onMouseDown={(e) => (e.currentTarget.style.transform = 'scale(0.95)')}
          onMouseUp={(e) => (e.currentTarget.style.transform = 'scale(1)')}
        >
          {showDismissed ? (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M3 12h18M9 6l-6 6 6 6"/>
            </svg>
          ) : (
            <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
              <path d="M18 6L6 18M6 6l12 12"/>
            </svg>
          )}
        </button>
      </div>
    </div>
  );
}
