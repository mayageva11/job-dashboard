import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import JobCard from '../components/JobCard';
import StatsBar from '../components/StatsBar';
import { API_BASE_URL } from '../constants';

function SkeletonCard() {
  return (
    <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', padding: '20px', display: 'flex', flexDirection: 'column', gap: '14px' }}>
      <div style={{ display: 'flex', gap: '12px', alignItems: 'center' }}>
        <div className="skeleton" style={{ width: '36px', height: '36px', borderRadius: '10px', flexShrink: 0 }} />
        <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '6px' }}>
          <div className="skeleton" style={{ height: '15px', width: '65%' }} />
          <div className="skeleton" style={{ height: '12px', width: '40%' }} />
        </div>
      </div>
      <div className="skeleton" style={{ height: '12px', width: '50%' }} />
      <div className="skeleton" style={{ height: '36px', width: '100%', borderRadius: '8px' }} />
    </div>
  );
}

function EmptyState({ showDismissed, onScrape, scraping }) {
  return (
    <div style={{ gridColumn: '1 / -1', display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '80px 0', color: '#6b7280' }}>
      <div style={{ width: '56px', height: '56px', borderRadius: '16px', background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
        <svg width="24" height="24" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
          <path strokeLinecap="round" strokeLinejoin="round" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
        </svg>
      </div>
      <div style={{ textAlign: 'center' }}>
        <div style={{ fontSize: '15px', fontWeight: 500, color: '#9ca3af', marginBottom: '6px' }}>
          {showDismissed ? 'No dismissed jobs' : 'No matching jobs yet'}
        </div>
        {!showDismissed && (
          <div style={{ fontSize: '13px', color: '#6b7280' }}>Click Scrape Now to fetch fresh listings</div>
        )}
      </div>
      {!showDismissed && (
        <button onClick={onScrape} disabled={scraping} style={{ marginTop: '8px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 500, cursor: scraping ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: scraping ? 0.6 : 1 }}>
          {scraping ? 'Scraping…' : 'Scrape Now'}
        </button>
      )}
    </div>
  );
}

function StatusDot({ counts }) {
  const [tooltip, setTooltip] = useState(null);
  const [visible, setVisible] = useState(false);
  const hasErrors = (counts?.lastScrapeErrorCount || 0) > 0;

  async function handleEnter() {
    setVisible(true);
    if (!hasErrors) return;
    if (tooltip !== null) return;
    try {
      const { data } = await axios.get(`${API_BASE_URL}/api/errors`);
      setTooltip(data[0]?.message || 'Unknown error');
    } catch { setTooltip('Could not fetch error details'); }
  }

  return (
    <div style={{ position: 'relative', display: 'inline-flex', alignItems: 'center' }} onMouseEnter={handleEnter} onMouseLeave={() => setVisible(false)}>
      <span style={{ display: 'inline-block', width: '8px', height: '8px', borderRadius: '50%', background: hasErrors ? '#dc2626' : '#16a34a', cursor: hasErrors ? 'help' : 'default', boxShadow: hasErrors ? '0 0 6px #dc262660' : '0 0 6px #16a34a60' }} />
      {visible && hasErrors && tooltip && (
        <div style={{ position: 'absolute', left: '14px', top: '-4px', background: '#1a1a1a', border: '1px solid #2a2a2a', borderLeft: '3px solid #dc2626', color: '#f0f0f0', fontSize: '12px', padding: '8px 12px', borderRadius: '8px', whiteSpace: 'nowrap', zIndex: 50, maxWidth: '340px', overflow: 'hidden', textOverflow: 'ellipsis', boxShadow: '0 4px 16px rgba(0,0,0,0.4)' }}>
          {tooltip}
        </div>
      )}
    </div>
  );
}

const FILTER_SOURCES = [
  { value: 'all',      label: 'All' },
  { value: 'linkedin', label: 'LinkedIn' },
  { value: 'remote',   label: 'Remote' },
  { value: 'adzuna',   label: 'Adzuna' },
];

export default function Dashboard() {
  const [allJobs, setAllJobs]       = useState([]);
  const [counts, setCounts]         = useState(null);
  const [loading, setLoading]       = useState(true);
  const [scraping, setScraping]     = useState(false);
  const [showDismissed, setShowDismissed] = useState(false);
  const [filterSource, setFilterSource]   = useState('all');
  const fetched = useRef(false);

  async function loadData(dismissed = showDismissed) {
    try {
      const [jobsRes, countsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/jobs`, { params: { showDismissed: dismissed ? '1' : '0' } }),
        axios.get(`${API_BASE_URL}/api/jobs/count`),
      ]);
      setAllJobs(jobsRes.data);
      setCounts(countsRes.data);
    } catch { toast.error('Failed to load jobs.'); }
    finally { setLoading(false); }
  }

  useEffect(() => {
    if (fetched.current) return;
    fetched.current = true;
    loadData(false);
  }, []);

  async function handleScrape() {
    setScraping(true);
    try {
      await axios.post(`${API_BASE_URL}/api/scrape`);
      toast.success('Scrape complete!');
      await loadData();
    } catch (err) {
      toast.error(err.response?.status === 429 ? 'Too many requests. Wait a few minutes.' : 'Scrape failed.');
    } finally { setScraping(false); }
  }

  async function handleDismiss(id) {
    try {
      await axios.post(`${API_BASE_URL}/api/jobs/${id}/dismiss`);
      setAllJobs((p) => p.filter((j) => j.id !== id));
      setCounts((p) => p ? { ...p, dismissed: p.dismissed + 1 } : p);
    } catch { toast.error('Could not dismiss job.'); }
  }

  async function handleUndismiss(id) {
    try {
      await axios.post(`${API_BASE_URL}/api/jobs/${id}/undismiss`);
      setAllJobs((p) => p.filter((j) => j.id !== id));
      setCounts((p) => p ? { ...p, dismissed: Math.max(0, p.dismissed - 1) } : p);
    } catch { toast.error('Could not restore job.'); }
  }

  async function toggleDismissed() {
    const next = !showDismissed;
    setShowDismissed(next);
    setLoading(true);
    await loadData(next);
  }

  const visible = allJobs.filter((j) => filterSource === 'all' || j.source === filterSource);
  const lastScraped = counts?.lastScrapedAt ? new Date(counts.lastScrapedAt).toLocaleString() : 'Never';

  return (
    <div style={{ padding: '32px', maxWidth: '1280px', margin: '0 auto' }}>

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', flexWrap: 'wrap', gap: '16px', marginBottom: '28px' }}>
        <div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
            <h1 style={{ fontSize: '26px', fontWeight: 700, color: '#f0f0f0', letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #f0f0f0, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Jobs for You
            </h1>
            <StatusDot counts={counts} />
          </div>
          <p style={{ fontSize: '13px', color: '#6b7280' }}>
            Last scraped: {lastScraped}
          </p>
        </div>

        <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
          <button
            onClick={toggleDismissed}
            style={{ background: 'transparent', border: `1px solid ${showDismissed ? '#7c3aed' : '#1e1e1e'}`, color: showDismissed ? '#a78bfa' : '#6b7280', borderRadius: '8px', padding: '8px 14px', fontSize: '13px', cursor: 'pointer', transition: 'all 120ms', fontFamily: 'inherit' }}
          >
            {showDismissed ? 'Hide Dismissed' : 'Dismissed'}
          </button>
          <button
            onClick={handleScrape}
            disabled={scraping}
            className={!scraping ? 'glow-pulse' : ''}
            style={{ background: scraping ? '#1e1e1e' : 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: scraping ? '#6b7280' : '#fff', border: 'none', borderRadius: '8px', padding: '8px 18px', fontSize: '13px', fontWeight: 500, cursor: scraping ? 'not-allowed' : 'pointer', transition: 'opacity 120ms', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
          >
            {scraping ? (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5" style={{ animation: 'spin 1s linear infinite' }}>
                  <path d="M21 12a9 9 0 11-18 0 9 9 0 0118 0z" opacity="0.25"/><path d="M21 12a9 9 0 00-9-9"/>
                </svg>
                Scraping…
              </>
            ) : (
              <>
                <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                  <path d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                </svg>
                Scrape Now
              </>
            )}
          </button>
        </div>
      </div>

      <StatsBar counts={counts} />

      {/* Filters */}
      <div style={{ display: 'flex', gap: '6px', marginBottom: '24px', flexWrap: 'wrap' }}>
        {FILTER_SOURCES.map((f) => (
          <button
            key={f.value}
            onClick={() => setFilterSource(f.value)}
            style={{
              background: filterSource === f.value ? '#7c3aed' : 'transparent',
              color: filterSource === f.value ? '#fff' : '#6b7280',
              border: `1px solid ${filterSource === f.value ? '#7c3aed' : '#1e1e1e'}`,
              borderRadius: '8px', padding: '6px 14px', fontSize: '13px', fontWeight: 500,
              cursor: 'pointer', transition: 'all 120ms', fontFamily: 'inherit',
            }}
          >
            {f.label}
            {f.value !== 'all' && (
              <span style={{ marginLeft: '6px', fontSize: '11px', opacity: 0.7 }}>
                {allJobs.filter((j) => j.source === f.value).length}
              </span>
            )}
          </button>
        ))}
        {visible.length > 0 && (
          <span style={{ marginLeft: 'auto', fontSize: '12px', color: '#6b7280', alignSelf: 'center' }}>
            {visible.length} job{visible.length !== 1 ? 's' : ''}
          </span>
        )}
      </div>

      {/* Grid */}
      {loading ? (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {[1,2,3,4,5,6].map((n) => <SkeletonCard key={n} />)}
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(300px, 1fr))', gap: '16px' }}>
          {visible.length === 0
            ? <EmptyState showDismissed={showDismissed} onScrape={handleScrape} scraping={scraping} />
            : visible.map((job) => (
                <JobCard key={job.id} job={job} showDismissed={showDismissed} onDismiss={handleDismiss} onUndismiss={handleUndismiss} />
              ))
          }
        </div>
      )}

      <style>{`@keyframes spin { to { transform: rotate(360deg); } }`}</style>
    </div>
  );
}
