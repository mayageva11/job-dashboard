import { useEffect, useRef, useState } from 'react';
import axios from 'axios';
import toast from 'react-hot-toast';
import { API_BASE_URL } from '../constants';

const STATUSES = ['applied', 'interview', 'rejected', 'accepted'];
const STATUS_META = {
  applied:   { label: 'Applied',   color: '#7c3aed', bg: '#7c3aed18' },
  interview: { label: 'Interview', color: '#ea580c', bg: '#ea580c18' },
  rejected:  { label: 'Rejected',  color: '#dc2626', bg: '#dc262618' },
  accepted:  { label: 'Accepted',  color: '#16a34a', bg: '#16a34a18' },
};

/* ── Shared modal shell ─────────────────────────────────── */
function ModalShell({ onClose, children }) {
  useEffect(() => {
    const esc = (e) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', esc);
    return () => window.removeEventListener('keydown', esc);
  }, [onClose]);

  return (
    <div
      className="modal-backdrop"
      onClick={(e) => { if (e.target === e.currentTarget) onClose(); }}
      style={{ position: 'fixed', inset: 0, background: 'rgba(0,0,0,0.75)', backdropFilter: 'blur(4px)', display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '24px' }}
    >
      <div
        className="modal-panel"
        style={{ background: '#111', border: '1px solid #2a2a2a', borderRadius: '16px', width: '100%', maxWidth: '480px', maxHeight: '85vh', display: 'flex', flexDirection: 'column', boxShadow: '0 24px 64px rgba(0,0,0,0.6)' }}
      >
        {children}
      </div>
    </div>
  );
}

/* ── Add Application modal ──────────────────────────────── */
function AddModal({ onClose, onSave }) {
  const [form, setForm] = useState({ title: '', company: '', url: '', location: '', status: 'applied' });
  const [saving, setSaving] = useState(false);
  const firstRef = useRef(null);

  useEffect(() => { firstRef.current?.focus(); }, []);

  const set = (k, v) => setForm((f) => ({ ...f, [k]: v }));

  async function submit(e) {
    e.preventDefault();
    if (!form.title.trim() || !form.company.trim()) { toast.error('Title and company are required.'); return; }
    setSaving(true);
    try {
      await axios.post(`${API_BASE_URL}/api/applied/manual`, form);
      toast.success('Application added.');
      onSave();
      onClose();
    } catch { toast.error('Failed to add application.'); }
    finally { setSaving(false); }
  }

  const inp = { width: '100%', background: '#0d0d0d', border: '1px solid #2a2a2a', borderRadius: '8px', padding: '9px 12px', color: '#f0f0f0', fontSize: '14px', fontFamily: 'inherit', outline: 'none', transition: 'border-color 120ms' };
  const lbl = { fontSize: '12px', color: '#6b7280', marginBottom: '6px', display: 'block', fontWeight: 500 };

  return (
    <ModalShell onClose={onClose}>
      {/* Header */}
      <div style={{ padding: '24px 24px 0', display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexShrink: 0 }}>
        <h2 style={{ fontSize: '17px', fontWeight: 600, color: '#f0f0f0' }}>Add Application</h2>
        <button onClick={onClose} style={{ background: 'transparent', border: 'none', color: '#6b7280', cursor: 'pointer', padding: '4px', borderRadius: '6px', display: 'flex' }}
          onMouseEnter={(e) => (e.currentTarget.style.color = '#f0f0f0')}
          onMouseLeave={(e) => (e.currentTarget.style.color = '#6b7280')}
        >
          <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M18 6L6 18M6 6l12 12"/></svg>
        </button>
      </div>

      {/* Scrollable body */}
      <form onSubmit={submit} style={{ display: 'flex', flexDirection: 'column', flex: 1, minHeight: 0 }}>
        <div style={{ padding: '20px 24px', display: 'flex', flexDirection: 'column', gap: '16px', overflowY: 'auto', flex: 1 }}>
          {[
            { key: 'title',    label: 'Job Title *',   placeholder: 'QA Automation Engineer' },
            { key: 'company',  label: 'Company *',     placeholder: 'Acme Ltd' },
            { key: 'url',      label: 'Job URL',       placeholder: 'https://...' },
            { key: 'location', label: 'Location',      placeholder: 'Tel Aviv, Israel' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label style={lbl}>{label}</label>
              <input
                ref={key === 'title' ? firstRef : null}
                style={inp}
                value={form[key]}
                placeholder={placeholder}
                onChange={(e) => set(key, e.target.value)}
                onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
                onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
              />
            </div>
          ))}
          <div>
            <label style={lbl}>Status</label>
            <select style={{ ...inp, cursor: 'pointer' }} value={form.status} onChange={(e) => set('status', e.target.value)}
              onFocus={(e) => (e.target.style.borderColor = '#7c3aed')}
              onBlur={(e) => (e.target.style.borderColor = '#2a2a2a')}
            >
              {STATUSES.map((s) => <option key={s} value={s}>{STATUS_META[s].label}</option>)}
            </select>
          </div>
        </div>

        {/* Footer */}
        <div style={{ padding: '16px 24px 24px', display: 'flex', gap: '8px', flexShrink: 0, borderTop: '1px solid #1e1e1e' }}>
          <button type="submit" disabled={saving} style={{ flex: 1, background: 'linear-gradient(135deg,#7c3aed,#6d28d9)', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px 16px', fontSize: '14px', fontWeight: 500, cursor: saving ? 'not-allowed' : 'pointer', fontFamily: 'inherit', opacity: saving ? 0.7 : 1 }}>
            {saving ? 'Saving…' : 'Save Application'}
          </button>
          <button type="button" onClick={onClose} style={{ flex: 1, background: 'transparent', color: '#9ca3af', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '10px 16px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
        </div>
      </form>
    </ModalShell>
  );
}

/* ── Delete confirm modal ───────────────────────────────── */
function DeleteModal({ app, onClose, onConfirm }) {
  return (
    <ModalShell onClose={onClose}>
      <div style={{ padding: '32px 28px', display: 'flex', flexDirection: 'column', gap: '20px' }}>
        <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: '#dc262618', border: '1px solid #dc262635', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
          <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="#dc2626" strokeWidth="2">
            <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
          </svg>
        </div>
        <div>
          <h2 style={{ fontSize: '16px', fontWeight: 600, color: '#f0f0f0', marginBottom: '6px' }}>Remove application?</h2>
          <p style={{ fontSize: '13px', color: '#6b7280', lineHeight: 1.5 }}>
            This will permanently remove <strong style={{ color: '#9ca3af' }}>{app.title}</strong> at <strong style={{ color: '#9ca3af' }}>{app.company}</strong> from your tracker.
          </p>
        </div>
        <div style={{ display: 'flex', gap: '8px' }}>
          <button onClick={onConfirm} style={{ flex: 1, background: '#dc2626', color: '#fff', border: 'none', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
            onMouseEnter={(e) => (e.currentTarget.style.background = '#b91c1c')}
            onMouseLeave={(e) => (e.currentTarget.style.background = '#dc2626')}
          >Remove</button>
          <button onClick={onClose} style={{ flex: 1, background: 'transparent', color: '#9ca3af', border: '1px solid #1e1e1e', borderRadius: '8px', padding: '10px', fontSize: '14px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Cancel
          </button>
        </div>
      </div>
    </ModalShell>
  );
}

/* ── Status dropdown ────────────────────────────────────── */
function StatusChip({ app, activeDropdown, setActiveDropdown, onChange }) {
  const isOpen = activeDropdown === app.id;
  const ref = useRef(null);
  const meta = STATUS_META[app.status] || STATUS_META.applied;

  useEffect(() => {
    if (!isOpen) return;
    function handleClick(e) { if (ref.current && !ref.current.contains(e.target)) setActiveDropdown(null); }
    document.addEventListener('mousedown', handleClick);
    return () => document.removeEventListener('mousedown', handleClick);
  }, [isOpen, setActiveDropdown]);

  return (
    <div ref={ref} style={{ position: 'relative', display: 'inline-block' }}>
      <button
        onClick={() => setActiveDropdown(isOpen ? null : app.id)}
        style={{ fontSize: '11px', fontWeight: 600, padding: '4px 10px', borderRadius: '999px', border: `1px solid ${meta.color}40`, background: meta.bg, color: meta.color, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '4px', transition: 'opacity 120ms' }}
        onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.8')}
        onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
      >
        {meta.label}
        <svg width="9" height="9" viewBox="0 0 10 10" fill="currentColor">
          <path d="M5 7L1 3h8z"/>
        </svg>
      </button>

      {isOpen && (
        <div style={{ position: 'absolute', top: 'calc(100% + 6px)', left: 0, background: '#161616', border: '1px solid #2a2a2a', borderRadius: '10px', overflow: 'hidden', zIndex: 30, minWidth: '130px', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
          {STATUSES.map((s) => {
            const m = STATUS_META[s];
            return (
              <button key={s} onClick={() => { onChange(app.id, s); setActiveDropdown(null); }}
                style={{ display: 'flex', alignItems: 'center', gap: '8px', width: '100%', padding: '9px 14px', background: s === app.status ? '#1e1e1e' : 'transparent', color: m.color, border: 'none', textAlign: 'left', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}
                onMouseEnter={(e) => (e.currentTarget.style.background = '#1e1e1e')}
                onMouseLeave={(e) => (e.currentTarget.style.background = s === app.status ? '#1e1e1e' : 'transparent')}
              >
                <span style={{ width: '7px', height: '7px', borderRadius: '50%', background: m.color, flexShrink: 0 }} />
                {m.label}
                {s === app.status && (
                  <svg style={{ marginLeft: 'auto' }} width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                    <path d="M20 6L9 17l-5-5"/>
                  </svg>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

/* ── Stat card ──────────────────────────────────────────── */
function StatCard({ label, value, color, active, onClick }) {
  return (
    <button onClick={onClick} style={{ background: active ? `${color}15` : '#111', border: `1px solid ${active ? color + '50' : '#1e1e1e'}`, borderRadius: '12px', padding: '16px 20px', textAlign: 'left', cursor: 'pointer', fontFamily: 'inherit', transition: 'all 150ms', flex: 1, minWidth: '120px', position: 'relative', overflow: 'hidden' }}
      onMouseEnter={(e) => { if (!active) e.currentTarget.style.borderColor = `${color}40`; }}
      onMouseLeave={(e) => { if (!active) e.currentTarget.style.borderColor = '#1e1e1e'; }}
    >
      {active && <div style={{ position: 'absolute', top: 0, left: 0, width: '3px', height: '100%', background: color }} />}
      <div style={{ fontSize: '22px', fontWeight: 700, color: active ? color : '#f0f0f0', letterSpacing: '-0.5px', fontVariantNumeric: 'tabular-nums' }}>{value}</div>
      <div style={{ fontSize: '11px', color: '#6b7280', marginTop: '2px', fontWeight: 500 }}>{label}</div>
    </button>
  );
}

/* ── Main page ──────────────────────────────────────────── */
export default function Applied() {
  const [applications, setApplications] = useState([]);
  const [counts, setCounts]             = useState({});
  const [activeTab, setActiveTab]       = useState('all');
  const [loading, setLoading]           = useState(true);
  const [modal, setModal]               = useState(null); // 'add' | { type: 'delete', app }
  const [activeDropdown, setActiveDropdown] = useState(null);

  function openModal(m) { setActiveDropdown(null); setModal(m); }
  function closeModal() { setModal(null); }

  async function loadData() {
    try {
      const [appsRes, countsRes] = await Promise.all([
        axios.get(`${API_BASE_URL}/api/applied`),
        axios.get(`${API_BASE_URL}/api/applied/counts`),
      ]);
      setApplications(appsRes.data);
      setCounts(countsRes.data);
    } catch { toast.error('Failed to load applications.'); }
    finally { setLoading(false); }
  }

  useEffect(() => { loadData(); }, []);

  function openDropdown(id) { setModal(null); setActiveDropdown(id); }

  async function handleStatusChange(id, status) {
    try {
      await axios.patch(`${API_BASE_URL}/api/applied/${id}/status`, { status });
      setApplications((p) => p.map((a) => a.id === id ? { ...a, status } : a));
      const { data } = await axios.get(`${API_BASE_URL}/api/applied/counts`);
      setCounts(data);
    } catch { toast.error('Could not update status.'); }
  }

  async function handleDelete(id) {
    try {
      await axios.delete(`${API_BASE_URL}/api/applied/${id}`);
      setApplications((p) => p.filter((a) => a.id !== id));
      const { data } = await axios.get(`${API_BASE_URL}/api/applied/counts`);
      setCounts(data);
      toast.success('Application removed.');
      closeModal();
    } catch { toast.error('Could not remove application.'); }
  }

  const visible = activeTab === 'all' ? applications : applications.filter((a) => a.status === activeTab);

  const tabs = [
    { key: 'all',       label: 'All',       count: counts.total     || 0, color: '#7c3aed' },
    { key: 'applied',   label: 'Applied',   count: counts.applied   || 0, color: '#7c3aed' },
    { key: 'interview', label: 'Interview', count: counts.interview || 0, color: '#ea580c' },
    { key: 'rejected',  label: 'Rejected',  count: counts.rejected  || 0, color: '#dc2626' },
    { key: 'accepted',  label: 'Accepted',  count: counts.accepted  || 0, color: '#16a34a' },
  ];

  return (
    <div style={{ padding: '32px', maxWidth: '1200px', margin: '0 auto' }}>

      {/* Modals — only one renders at a time */}
      {modal === 'add' && <AddModal onClose={closeModal} onSave={loadData} />}
      {modal?.type === 'delete' && <DeleteModal app={modal.app} onClose={closeModal} onConfirm={() => handleDelete(modal.app.id)} />}

      {/* Header */}
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '24px', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <h1 style={{ fontSize: '26px', fontWeight: 700, letterSpacing: '-0.5px', background: 'linear-gradient(135deg, #f0f0f0, #9ca3af)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
            Applications
          </h1>
          <p style={{ fontSize: '13px', color: '#6b7280', marginTop: '2px' }}>
            Track every role you&apos;ve applied to
          </p>
        </div>
        <button onClick={() => openModal('add')}
          style={{ background: 'linear-gradient(135deg, #7c3aed, #6d28d9)', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 18px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit', display: 'flex', alignItems: 'center', gap: '6px' }}
          onMouseEnter={(e) => (e.currentTarget.style.opacity = '0.9')}
          onMouseLeave={(e) => (e.currentTarget.style.opacity = '1')}
        >
          <svg width="13" height="13" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5"><path d="M12 5v14M5 12h14"/></svg>
          Add Application
        </button>
      </div>

      {/* Stat cards */}
      <div style={{ display: 'flex', gap: '10px', flexWrap: 'wrap', marginBottom: '28px' }}>
        {tabs.map((t) => (
          <StatCard key={t.key} label={t.label} value={t.count} color={t.color} active={activeTab === t.key} onClick={() => setActiveTab(t.key)} />
        ))}
      </div>

      {/* Table */}
      {loading ? (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
          {[1,2,3].map((n) => <div key={n} className="skeleton" style={{ height: '60px', borderRadius: '10px' }} />)}
        </div>
      ) : visible.length === 0 ? (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: '16px', padding: '80px 0', color: '#6b7280' }}>
          <div style={{ width: '52px', height: '52px', borderRadius: '14px', background: '#1a1a1a', border: '1px solid #2a2a2a', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <svg width="22" height="22" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={1.5}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '15px', fontWeight: 500, color: '#9ca3af', marginBottom: '4px' }}>Nothing here yet</div>
            <div style={{ fontSize: '13px' }}>Your applications will appear here</div>
          </div>
          <button onClick={() => openModal('add')} style={{ marginTop: '8px', background: '#7c3aed', color: '#fff', border: 'none', borderRadius: '8px', padding: '9px 20px', fontSize: '13px', fontWeight: 500, cursor: 'pointer', fontFamily: 'inherit' }}>
            Add your first application
          </button>
        </div>
      ) : (
        <div style={{ background: '#111', border: '1px solid #1e1e1e', borderRadius: '14px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px' }}>
            <thead>
              <tr style={{ borderBottom: '1px solid #1a1a1a' }}>
                {['Role', 'Company', 'Location', 'Date', 'Status', ''].map((h) => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '11px', fontWeight: 600, color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.06em', whiteSpace: 'nowrap' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {visible.map((a, i) => (
                <tr key={a.id}
                  style={{ borderBottom: i < visible.length - 1 ? '1px solid #161616' : 'none', transition: 'background 100ms' }}
                  onMouseEnter={(e) => (e.currentTarget.style.background = '#161616')}
                  onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
                >
                  <td style={{ padding: '14px 16px', maxWidth: '220px' }}>
                    <div style={{ fontWeight: 500, color: '#f0f0f0', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                      {a.title || '—'}
                    </div>
                  </td>
                  <td style={{ padding: '14px 16px', color: '#9ca3af', whiteSpace: 'nowrap' }}>{a.company || '—'}</td>
                  <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '12px', whiteSpace: 'nowrap' }}>{a.location || '—'}</td>
                  <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '12px', whiteSpace: 'nowrap' }}>
                    {new Date(a.applied_at).toLocaleDateString('en-GB', { day: '2-digit', month: 'short', year: 'numeric' })}
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <StatusChip app={a} activeDropdown={activeDropdown} setActiveDropdown={openDropdown} onChange={handleStatusChange} />
                  </td>
                  <td style={{ padding: '14px 16px' }}>
                    <div style={{ display: 'flex', gap: '6px', justifyContent: 'flex-end' }}>
                      {a.url && (
                        <a href={a.url} target="_blank" rel="noopener noreferrer"
                          style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', border: '1px solid #1e1e1e', color: '#6b7280', textDecoration: 'none', transition: 'all 100ms' }}
                          onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#7c3aed'; e.currentTarget.style.color = '#a78bfa'; }}
                          onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#6b7280'; }}
                          title="Open job"
                        >
                          <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                            <path d="M18 13v6a2 2 0 01-2 2H5a2 2 0 01-2-2V8a2 2 0 012-2h6M15 3h6v6M10 14L21 3"/>
                          </svg>
                        </a>
                      )}
                      <button
                        onClick={() => openModal({ type: 'delete', app: a })}
                        style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', width: '30px', height: '30px', borderRadius: '7px', border: '1px solid #1e1e1e', background: 'transparent', color: '#6b7280', cursor: 'pointer', transition: 'all 100ms' }}
                        onMouseEnter={(e) => { e.currentTarget.style.borderColor = '#dc2626'; e.currentTarget.style.color = '#dc2626'; e.currentTarget.style.background = '#dc262610'; }}
                        onMouseLeave={(e) => { e.currentTarget.style.borderColor = '#1e1e1e'; e.currentTarget.style.color = '#6b7280'; e.currentTarget.style.background = 'transparent'; }}
                        title="Remove application"
                      >
                        <svg width="12" height="12" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2.5">
                          <path d="M3 6h18M19 6l-1 14H6L5 6M10 11v6M14 11v6M9 6V4h6v2"/>
                        </svg>
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
