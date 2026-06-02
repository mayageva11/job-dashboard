import { BrowserRouter, NavLink, Route, Routes } from 'react-router-dom';
import { Toaster } from 'react-hot-toast';
import Dashboard from './pages/Dashboard';
import Applied from './pages/Applied';

export default function App() {
  return (
    <BrowserRouter>
      <Toaster
        position="bottom-right"
        toastOptions={{
          style: {
            background: '#1a1a1a',
            color: '#f0f0f0',
            border: '1px solid #2a2a2a',
            fontFamily: 'Geist, sans-serif',
            fontSize: '13px',
            borderRadius: '10px',
          },
          success: { style: { borderLeft: '3px solid #16a34a' } },
          error:   { style: { borderLeft: '3px solid #dc2626' } },
        }}
      />

      <nav style={{
        position: 'sticky', top: 0, zIndex: 40,
        borderBottom: '1px solid #1a1a1a',
        background: 'rgba(10,10,10,0.85)',
        backdropFilter: 'blur(12px)',
        padding: '0 32px',
        display: 'flex',
        alignItems: 'center',
        gap: '4px',
        height: '56px',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginRight: '32px' }}>
          <div style={{
            width: '28px', height: '28px', borderRadius: '8px',
            background: 'linear-gradient(135deg, #7c3aed, #a855f7)',
            display: 'flex', alignItems: 'center', justifyContent: 'center',
            fontSize: '14px', fontWeight: 700, color: '#fff',
          }}>J</div>
          <span style={{ fontSize: '15px', fontWeight: 600, color: '#f0f0f0', letterSpacing: '-0.3px' }}>
            JobBoard
          </span>
        </div>

        <NavLink to="/" end style={({ isActive }) => ({
          fontSize: '13px', fontWeight: 500, color: isActive ? '#f0f0f0' : '#6b7280',
          textDecoration: 'none', padding: '6px 12px', borderRadius: '6px',
          background: isActive ? '#1a1a1a' : 'transparent',
          transition: 'all 120ms',
        })}>Dashboard</NavLink>

        <NavLink to="/applied" style={({ isActive }) => ({
          fontSize: '13px', fontWeight: 500, color: isActive ? '#f0f0f0' : '#6b7280',
          textDecoration: 'none', padding: '6px 12px', borderRadius: '6px',
          background: isActive ? '#1a1a1a' : 'transparent',
          transition: 'all 120ms',
        })}>Applied</NavLink>
      </nav>

      <main>
        <Routes>
          <Route path="/"        element={<Dashboard />} />
          <Route path="/applied" element={<Applied />} />
        </Routes>
      </main>
    </BrowserRouter>
  );
}
