import React from 'react';
import { Play, Copy, Check } from 'lucide-react';

export const SegmentItem = ({
  segment,
  isActive,
  onSeek,
  onTextChange,
  formatTime,
}) => {
  const [copied, setCopied] = React.useState(false);

  const handleCopy = () => {
    navigator.clipboard.writeText(segment.text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      style={{
        ...styles.card,
        ...(isActive ? styles.cardActive : {}),
      }}
    >
      <div style={styles.header}>
        <button
          type="button"
          onClick={() => onSeek(segment.start_time)}
          style={styles.timeBadge}
          title="Click to jump video to this segment"
        >
          <Play size={12} fill="#38bdf8" color="#38bdf8" />
          <span>{formatTime(segment.start_time)} ➔ {formatTime(segment.end_time)}</span>
        </button>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
          {isActive && (
            <span style={styles.liveIndicator}>
              <span style={styles.pulseDot}></span>
              SPEAKING
            </span>
          )}

          <button
            type="button"
            onClick={handleCopy}
            style={styles.copyBtn}
            title="Copy this segment"
          >
            {copied ? <Check size={13} color="#10b981" /> : <Copy size={13} />}
          </button>
        </div>
      </div>

      <textarea
        value={segment.text}
        onChange={(e) => onTextChange(segment.segment_index, e.target.value)}
        style={styles.textarea}
        rows={Math.max(2, Math.ceil(segment.text.length / 55))}
        placeholder="Segment transcript text..."
      />
    </div>
  );
};

const styles = {
  card: {
    backgroundColor: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '10px',
    padding: '0.9rem',
    marginBottom: '0.75rem',
    transition: 'all 0.15s ease',
  },
  cardActive: {
    borderColor: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.05)',
    boxShadow: '0 0 15px rgba(56, 189, 248, 0.12)',
  },
  header: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: '0.5rem',
  },
  timeBadge: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    backgroundColor: '#1f2937',
    color: '#38bdf8',
    padding: '0.25rem 0.6rem',
    borderRadius: '6px',
    fontSize: '0.775rem',
    fontFamily: 'monospace',
    fontWeight: 600,
    border: '1px solid #334155',
  },
  liveIndicator: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.675rem',
    fontWeight: 700,
    color: '#38bdf8',
    letterSpacing: '0.05em',
  },
  pulseDot: {
    width: '6px',
    height: '6px',
    borderRadius: '50%',
    backgroundColor: '#38bdf8',
  },
  copyBtn: {
    width: '26px',
    height: '26px',
    borderRadius: '4px',
    backgroundColor: '#1f2937',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  textarea: {
    width: '100%',
    backgroundColor: 'transparent',
    border: 'none',
    color: '#f3f4f6',
    fontSize: '0.925rem',
    fontFamily: 'inherit',
    lineHeight: 1.5,
    resize: 'none',
    outline: 'none',
    padding: '0.2rem 0',
  },
};

export default SegmentItem;
