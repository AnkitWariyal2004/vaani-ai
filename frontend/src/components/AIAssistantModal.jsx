import React, { useState } from 'react';
import { X, Sparkles, Languages, FileText, Key, Check, AlertCircle, RefreshCw, ExternalLink } from 'lucide-react';
import api from '../services/api';

const FREE_MODELS = [
  { id: 'google/gemini-2.0-flash-exp:free', name: 'Google Gemini 2.0 Flash (Free)', tag: 'Fast & Multilingual' },
  { id: 'meta-llama/llama-3.3-70b-instruct:free', name: 'Meta Llama 3.3 70B (Free)', tag: 'High Precision' },
  { id: 'qwen/qwen-2.5-72b-instruct:free', name: 'Qwen 2.5 72B (Free)', tag: 'Excellent Indian Languages' },
  { id: 'deepseek/deepseek-r1:free', name: 'DeepSeek R1 (Free)', tag: 'Deep Reasoning' },
];

const TARGET_LANGS = [
  { code: 'en', name: 'English' },
  { code: 'hi', name: 'Hindi (हिन्दी देवनागरी)' },
  { code: 'gu', name: 'Gujarati (ગુજરાતી)' },
  { code: 'bn', name: 'Bengali (বাংলা)' },
  { code: 'pa', name: 'Punjabi (ਪੰਜਾਬੀ)' },
  { code: 'mr', name: 'Marathi (मराठी)' },
  { code: 'ta', name: 'Tamil (தமிழ்)' },
  { code: 'es', name: 'Spanish' },
  { code: 'fr', name: 'French' },
  { code: 'de', name: 'German' },
];

export const AIAssistantModal = ({ isOpen, onClose, jobId, onUpdate }) => {
  const [activeTab, setActiveTab] = useState('polish'); // polish | translate | summary
  const [apiKey, setApiKey] = useState(localStorage.getItem('vaani_openrouter_key') || '');
  const [targetLang, setTargetLang] = useState('en');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [success, setSuccess] = useState(null);
  const [summaryData, setSummaryData] = useState(null);

  if (!isOpen) return null;

  const handleSaveKey = (k) => {
    setApiKey(k);
    localStorage.setItem('vaani_openrouter_key', k);
  };

  const handlePolish = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.aiEnhance(jobId, apiKey);
      setSuccess('Transcript successfully polished with proper punctuation and Devanagari grammar!');
      if (onUpdate) onUpdate(res.transcript);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Polish failed');
    } finally {
      setLoading(false);
    }
  };

  const handleTranslate = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.aiTranslate(jobId, targetLang, apiKey);
      setSuccess(`Subtitles translated to ${targetLang.toUpperCase()} successfully!`);
      if (onUpdate) onUpdate(res.transcript);
      setTimeout(() => setSuccess(null), 3000);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Translation failed');
    } finally {
      setLoading(false);
    }
  };

  const handleSummarize = async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await api.aiSummarize(jobId, apiKey);
      setSummaryData(res.summary);
      setSuccess('Summary generated!');
      setTimeout(() => setSuccess(null), 2500);
    } catch (err) {
      setError(err.response?.data?.error || err.message || 'Summary generation failed');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        {/* Header */}
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={styles.iconBox}>
              <Sparkles size={20} color="#38bdf8" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                OpenRouter AI Studio (100% Free)
              </h2>
              <p style={{ fontSize: '0.75rem', color: '#94a3b8' }}>
                Zero-cost intelligence via Gemini 2.0 Flash, Llama 3.3, and Qwen 2.5
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        {/* API Key Box */}
        <div style={styles.apiKeySection}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.35rem' }}>
            <label style={{ fontSize: '0.775rem', fontWeight: 600, color: '#cbd5e1', display: 'flex', alignItems: 'center', gap: '0.35rem' }}>
              <Key size={13} color="#f59e0b" />
              <span>OpenRouter Free API Key:</span>
            </label>
            <a
              href="https://openrouter.ai/keys"
              target="_blank"
              rel="noopener noreferrer"
              style={styles.keyLink}
            >
              <span>Get Free Key (openrouter.ai/keys)</span>
              <ExternalLink size={12} />
            </a>
          </div>
          <input
            type="password"
            value={apiKey}
            onChange={(e) => handleSaveKey(e.target.value)}
            placeholder="Paste your OpenRouter key here (sk-or-v1-...)"
            style={styles.keyInput}
          />
        </div>

        {/* Tabs */}
        <div style={styles.tabsRow}>
          <button
            type="button"
            onClick={() => setActiveTab('polish')}
            style={{ ...styles.tabBtn, ...(activeTab === 'polish' ? styles.tabBtnActive : {}) }}
          >
            <Sparkles size={14} />
            <span>AI Polish & Punctuate</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('translate')}
            style={{ ...styles.tabBtn, ...(activeTab === 'translate' ? styles.tabBtnActive : {}) }}
          >
            <Languages size={14} />
            <span>AI Translate</span>
          </button>

          <button
            type="button"
            onClick={() => setActiveTab('summary')}
            style={{ ...styles.tabBtn, ...(activeTab === 'summary' ? styles.tabBtnActive : {}) }}
          >
            <FileText size={14} />
            <span>AI Summary</span>
          </button>
        </div>

        {/* Tab Content */}
        <div style={styles.body}>
          {activeTab === 'polish' && (
            <div>
              <p style={styles.tabDesc}>
                Uses free OpenRouter LLMs to refine spoken speech, fix Devanagari grammar/spelling,
                and add standard commas and periods without changing segment timestamps.
              </p>
              <button
                type="button"
                onClick={handlePolish}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.75rem' }}
                disabled={loading}
              >
                {loading ? <RefreshCw size={15} className="spin" /> : <Sparkles size={15} />}
                <span>{loading ? 'Polishing Transcript...' : 'Polish & Fix Grammar (Free)'}</span>
              </button>
            </div>
          )}

          {activeTab === 'translate' && (
            <div>
              <p style={styles.tabDesc}>
                Translate the complete timestamped subtitles into your selected language.
                Maintains subtitle synchronization for video players and YouTube.
              </p>
              <div style={{ marginTop: '0.75rem' }}>
                <label style={{ fontSize: '0.8rem', color: '#cbd5e1', fontWeight: 600 }}>
                  Translate into:
                </label>
                <select
                  value={targetLang}
                  onChange={(e) => setTargetLang(e.target.value)}
                  style={styles.select}
                >
                  {TARGET_LANGS.map((l) => (
                    <option key={l.code} value={l.code}>
                      {l.name}
                    </option>
                  ))}
                </select>
              </div>
              <button
                type="button"
                onClick={handleTranslate}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '1rem' }}
                disabled={loading}
              >
                {loading ? <RefreshCw size={15} className="spin" /> : <Languages size={15} />}
                <span>{loading ? 'Translating Subtitles...' : 'Translate All Segments (Free)'}</span>
              </button>
            </div>
          )}

          {activeTab === 'summary' && (
            <div>
              <p style={styles.tabDesc}>
                Generate an executive overview, key insights, topics, and sentiment from the video content.
              </p>
              <button
                type="button"
                onClick={handleSummarize}
                className="btn btn-primary"
                style={{ width: '100%', marginTop: '0.75rem' }}
                disabled={loading}
              >
                {loading ? <RefreshCw size={15} className="spin" /> : <FileText size={15} />}
                <span>{loading ? 'Generating Insights...' : 'Generate AI Summary (Free)'}</span>
              </button>

              {summaryData && (
                <div style={styles.summaryCard}>
                  <h4 style={{ fontSize: '1rem', fontWeight: 700, color: '#38bdf8', marginBottom: '0.35rem' }}>
                    {summaryData.title || 'Summary'}
                  </h4>
                  <p style={{ fontSize: '0.85rem', color: '#cbd5e1', lineHeight: 1.5, marginBottom: '0.75rem' }}>
                    {summaryData.overview}
                  </p>
                  {summaryData.key_takeaways?.length > 0 && (
                    <div>
                      <strong style={{ fontSize: '0.8rem', color: '#f1f5f9' }}>Key Takeaways:</strong>
                      <ul style={{ paddingLeft: '1.25rem', marginTop: '0.25rem', fontSize: '0.8rem', color: '#94a3b8' }}>
                        {summaryData.key_takeaways.map((t, idx) => (
                          <li key={idx} style={{ marginBottom: '0.2rem' }}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  )}
                  {summaryData.sentiment && (
                    <div style={{ marginTop: '0.5rem', fontSize: '0.75rem', color: '#10b981' }}>
                      Tone: <strong>{summaryData.sentiment}</strong>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Feedback Alerts */}
          {error && (
            <div style={styles.errorAlert}>
              <AlertCircle size={15} />
              <span>{error}</span>
            </div>
          )}

          {success && (
            <div style={styles.successAlert}>
              <Check size={15} />
              <span>{success}</span>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const styles = {
  backdrop: {
    position: 'fixed',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.75)',
    backdropFilter: 'blur(4px)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 110,
    padding: '1rem',
  },
  modal: {
    backgroundColor: '#0f172a',
    border: '1px solid #1e293b',
    borderRadius: '14px',
    width: '100%',
    maxWidth: '560px',
    boxShadow: '0 20px 40px rgba(0, 0, 0, 0.6)',
    overflow: 'hidden',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem 1.5rem',
    borderBottom: '1px solid #1e293b',
  },
  iconBox: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  closeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  apiKeySection: {
    padding: '0.85rem 1.5rem',
    backgroundColor: '#111827',
    borderBottom: '1px solid #1e293b',
  },
  keyLink: {
    fontSize: '0.725rem',
    color: '#38bdf8',
    display: 'flex',
    alignItems: 'center',
    gap: '0.25rem',
  },
  keyInput: {
    width: '100%',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '6px',
    padding: '0.5rem 0.75rem',
    color: '#f8fafc',
    fontSize: '0.8rem',
    outline: 'none',
    boxSizing: 'border-box',
  },
  tabsRow: {
    display: 'flex',
    borderBottom: '1px solid #1e293b',
    backgroundColor: '#0f172a',
  },
  tabBtn: {
    flex: 1,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '0.4rem',
    padding: '0.75rem 0.5rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#94a3b8',
    borderBottom: '2px solid transparent',
  },
  tabBtnActive: {
    color: '#38bdf8',
    borderBottomColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
  },
  body: {
    padding: '1.25rem 1.5rem',
  },
  tabDesc: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    lineHeight: 1.5,
  },
  select: {
    width: '100%',
    marginTop: '0.35rem',
    padding: '0.55rem 0.75rem',
    backgroundColor: '#111827',
    border: '1px solid #334155',
    borderRadius: '6px',
    color: '#f8fafc',
    fontSize: '0.85rem',
    outline: 'none',
  },
  summaryCard: {
    marginTop: '1rem',
    padding: '1rem',
    backgroundColor: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '8px',
  },
  errorAlert: {
    marginTop: '0.85rem',
    padding: '0.65rem 0.9rem',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '6px',
    color: '#f87171',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
  successAlert: {
    marginTop: '0.85rem',
    padding: '0.65rem 0.9rem',
    backgroundColor: 'rgba(16, 185, 129, 0.1)',
    border: '1px solid rgba(16, 185, 129, 0.3)',
    borderRadius: '6px',
    color: '#34d399',
    fontSize: '0.8rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.4rem',
  },
};

export default AIAssistantModal;
