import React, { useState } from 'react';
import { X, Download, FileText, FileCode, File, Subtitles, Check } from 'lucide-react';
import api from '../services/api';

export const ExportModal = ({ isOpen, onClose, jobId, videoName }) => {
  const [includeTimestamps, setIncludeTimestamps] = useState(true);
  const [downloadingFormat, setDownloadingFormat] = useState(null);

  if (!isOpen) return null;

  const formats = [
    {
      id: 'srt',
      name: 'SRT Subtitles (.srt)',
      description: 'Standard subtitle format for YouTube, VLC, Premiere Pro, and video players.',
      icon: <Subtitles size={24} color="#38bdf8" />,
    },
    {
      id: 'docx',
      name: 'Word Document (.docx)',
      description: 'Professional styled report with metadata summary table and timestamped breakdown.',
      icon: <File size={24} color="#6366f1" />,
    },
    {
      id: 'txt',
      name: 'Plain Text (.txt)',
      description: 'Clean readable text transcript for notes, articles, or documentation.',
      icon: <FileText size={24} color="#10b981" />,
      hasTimestampToggle: true,
    },
    {
      id: 'json',
      name: 'Structured JSON (.json)',
      description: 'Complete data export with confidence score, detected language, and segment timestamps.',
      icon: <FileCode size={24} color="#f59e0b" />,
    },
  ];

  const handleDownload = async (formatId) => {
    setDownloadingFormat(formatId);
    try {
      const url = api.getDownloadUrl(jobId, formatId, includeTimestamps);
      const res = await fetch(url);
      if (res.ok) {
        const blob = await res.blob();
        const blobUrl = URL.createObjectURL(blob);
        const link = document.createElement('a');
        link.href = blobUrl;
        link.setAttribute('download', `${videoName || 'transcript'}.${formatId}`);
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(blobUrl);
      } else {
        throw new Error('Fallback to local export');
      }
    } catch {
      // In-browser client export fallback for standalone cloud deployment
      const currentJob = await api.getJob(jobId);
      const segments = currentJob.transcript?.segments || [];
      let content = '';
      let mimeType = 'text/plain;charset=utf-8';
      let extension = formatId;

      if (formatId === 'srt') {
        const formatSrtTime = (sec) => {
          const h = Math.floor(sec / 3600);
          const m = Math.floor((sec % 3600) / 60);
          const s = Math.floor(sec % 60);
          const ms = Math.floor((sec - Math.floor(sec)) * 1000);
          return `${String(h).padStart(2,'0')}:${String(m).padStart(2,'0')}:${String(s).padStart(2,'0')},${String(ms).padStart(3,'0')}`;
        };
        content = segments.map((s, i) => `${i + 1}\n${formatSrtTime(s.start_time)} --> ${formatSrtTime(s.end_time)}\n${s.text}\n`).join('\n');
      } else if (formatId === 'txt') {
        content = includeTimestamps
          ? segments.map((s) => `[${s.start_time.toFixed(1)}s - ${s.end_time.toFixed(1)}s] ${s.text}`).join('\n')
          : currentJob.transcript?.full_text || segments.map((s) => s.text).join(' ');
      } else if (formatId === 'json') {
        mimeType = 'application/json;charset=utf-8';
        content = JSON.stringify(currentJob.transcript, null, 2);
      } else {
        // Simple text document fallback for docx
        extension = 'txt';
        content = `VAANI AI TRANSCRIPTION REPORT\nVideo: ${videoName}\n\n${currentJob.transcript?.full_text}`;
      }

      const blob = new Blob([content], { type: mimeType });
      const blobUrl = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = blobUrl;
      link.setAttribute('download', `${videoName || 'transcript'}.${extension}`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(blobUrl);
    }

    setTimeout(() => {
      setDownloadingFormat(null);
    }, 1000);
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              Export Transcript
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8', marginTop: '0.2rem' }}>
              Source: {videoName || 'Current Video'}
            </p>
          </div>
          <button type="button" onClick={onClose} style={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        <div style={styles.body}>
          {formats.map((fmt) => (
            <div key={fmt.id} style={styles.formatCard}>
              <div style={styles.iconBox}>{fmt.icon}</div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <h4 style={{ fontSize: '0.95rem', fontWeight: 600, color: '#f1f5f9' }}>
                  {fmt.name}
                </h4>
                <p style={{ fontSize: '0.775rem', color: '#94a3b8', marginTop: '0.15rem' }}>
                  {fmt.description}
                </p>

                {fmt.hasTimestampToggle && (
                  <label style={styles.timestampToggle}>
                    <input
                      type="checkbox"
                      checked={includeTimestamps}
                      onChange={(e) => setIncludeTimestamps(e.target.checked)}
                      style={{ accentColor: '#4f46e5' }}
                    />
                    <span style={{ fontSize: '0.75rem', color: '#cbd5e1' }}>
                      Include timestamps in TXT
                    </span>
                  </label>
                )}
              </div>

              <button
                type="button"
                onClick={() => handleDownload(fmt.id)}
                className="btn btn-secondary"
                style={{ padding: '0.5rem 0.9rem', fontSize: '0.825rem' }}
                disabled={downloadingFormat === fmt.id}
              >
                {downloadingFormat === fmt.id ? (
                  <>
                    <Check size={14} color="#10b981" />
                    <span>Downloaded</span>
                  </>
                ) : (
                  <>
                    <Download size={14} />
                    <span>Download</span>
                  </>
                )}
              </button>
            </div>
          ))}
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
    zIndex: 100,
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
  body: {
    padding: '1.25rem 1.5rem',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  formatCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '0.9rem 1rem',
    backgroundColor: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '10px',
  },
  iconBox: {
    width: '42px',
    height: '42px',
    borderRadius: '8px',
    backgroundColor: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  timestampToggle: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    marginTop: '0.4rem',
    cursor: 'pointer',
  },
};

export default ExportModal;
