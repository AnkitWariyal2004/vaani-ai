import React, { useEffect, useState } from 'react';
import { NavLink } from 'react-router-dom';
import { LayoutDashboard, UploadCloud, FileText, History, Info, ExternalLink, Activity, Sparkles } from 'lucide-react';
import api from '../services/api';

export const Sidebar = () => {
  const [healthy, setHealthy] = useState(null);

  useEffect(() => {
    api.getHealth()
      .then(() => setHealthy(true))
      .catch(() => setHealthy(false));
  }, []);

  const navItems = [
    { to: '/', label: 'Dashboard', icon: <LayoutDashboard size={19} /> },
    { to: '/upload', label: 'Upload Video', icon: <UploadCloud size={19} /> },
    { to: '/history', label: 'Transcript History', icon: <History size={19} /> },
    { to: '/about', label: 'About Project', icon: <Info size={19} /> },
  ];

  return (
    <aside style={styles.sidebar}>
      <div style={styles.brand}>
        <div style={styles.brandLogo}>
          <Sparkles size={20} color="#fff" />
        </div>
        <div>
          <h1 style={styles.brandTitle}>VAANI AI</h1>
          <p style={styles.brandSubtitle}>Multilingual STT Engine</p>
        </div>
      </div>

      <nav style={styles.nav}>
        {navItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            style={({ isActive }) => ({
              ...styles.navLink,
              ...(isActive ? styles.navLinkActive : {}),
            })}
          >
            {item.icon}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      <div style={styles.colabCard}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.4rem' }}>
          <span style={styles.colabDot}></span>
          <span style={{ fontSize: '0.8rem', fontWeight: 600, color: '#f59e0b' }}>Free Colab T4 Engine</span>
        </div>
        <p style={{ fontSize: '0.75rem', color: '#9ca3af', lineHeight: 1.4, marginBottom: '0.75rem' }}>
          AI speech recognition runs completely on Google Colab free GPU to protect your 8GB laptop RAM.
        </p>
        <a
          href="https://colab.research.google.com/"
          target="_blank"
          rel="noopener noreferrer"
          style={styles.colabBtn}
        >
          <span>Open Colab</span>
          <ExternalLink size={14} />
        </a>
      </div>

      <div style={styles.footer}>
        <div style={styles.healthStatus}>
          <Activity size={14} color={healthy === true ? '#10b981' : healthy === false ? '#ef4444' : '#f59e0b'} />
          <span style={{ fontSize: '0.75rem', color: '#9ca3af' }}>
            Backend: {healthy === true ? 'Online (SQLite)' : healthy === false ? 'Offline' : 'Connecting...'}
          </span>
        </div>
        <div style={{ fontSize: '0.7rem', color: '#6b7280', marginTop: '0.35rem' }}>
          Budget: Strictly ₹0.00
        </div>
      </div>
    </aside>
  );
};

const styles = {
  sidebar: {
    width: '260px',
    backgroundColor: '#0f172a',
    borderRight: '1px solid #1e293b',
    position: 'fixed',
    top: 0,
    bottom: 0,
    left: 0,
    display: 'flex',
    flexDirection: 'column',
    padding: '1.5rem 1.25rem',
    zIndex: 50,
  },
  brand: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.85rem',
    paddingBottom: '1.5rem',
    borderBottom: '1px solid #1e293b',
    marginBottom: '1.5rem',
  },
  brandLogo: {
    width: '38px',
    height: '38px',
    borderRadius: '10px',
    background: 'linear-gradient(135deg, #4f46e5 0%, #06b6d4 100%)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    boxShadow: '0 4px 12px rgba(79, 70, 229, 0.35)',
  },
  brandTitle: {
    fontSize: '1.25rem',
    fontWeight: 800,
    letterSpacing: '-0.02em',
    color: '#ffffff',
  },
  brandSubtitle: {
    fontSize: '0.725rem',
    color: '#94a3b8',
    fontWeight: 500,
  },
  nav: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.4rem',
    flex: 1,
  },
  navLink: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.75rem',
    padding: '0.7rem 0.9rem',
    borderRadius: '8px',
    fontSize: '0.9rem',
    fontWeight: 500,
    color: '#94a3b8',
    transition: 'all 0.2s ease',
  },
  navLinkActive: {
    backgroundColor: '#1e293b',
    color: '#38bdf8',
    fontWeight: 600,
    borderLeft: '3px solid #38bdf8',
  },
  colabCard: {
    backgroundColor: '#1e293b',
    border: '1px solid #334155',
    borderRadius: '10px',
    padding: '0.9rem',
    marginBottom: '1rem',
  },
  colabDot: {
    width: '8px',
    height: '8px',
    borderRadius: '50%',
    backgroundColor: '#f59e0b',
    display: 'inline-block',
  },
  colabBtn: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    backgroundColor: '#334155',
    color: '#f8fafc',
    fontSize: '0.775rem',
    fontWeight: 600,
    padding: '0.45rem',
    borderRadius: '6px',
    transition: 'background 0.2s',
  },
  footer: {
    borderTop: '1px solid #1e293b',
    paddingTop: '1rem',
  },
  healthStatus: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
};

export default Sidebar;
