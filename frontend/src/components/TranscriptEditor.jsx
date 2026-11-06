import React, { useState, useMemo } from 'react';
import { Search, Copy, Check, Save, Download, Sparkles, Filter } from 'lucide-react';
import SegmentItem from './SegmentItem';

export const TranscriptEditor = ({
  transcript,
  currentTime,
  onSeek,
  onSave,
  onOpenExport,
  onOpenColabGuide,
  isSaving,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [segments, setSegments] = useState(transcript?.segments || []);
  const [copied, setCopied] = useState(false);
  const [hasUnsavedChanges, setHasUnsavedChanges] = useState(false);

  // Sync internal state when transcript prop updates
  React.useEffect(() => {
    if (transcript?.segments) {
      setSegments(transcript.segments);
      setHasUnsavedChanges(false);
    }
  }, [transcript]);

  const handleTextChange = (segmentIndex, newText) => {
    setSegments((prev) =>
      prev.map((s) => (s.segment_index === segmentIndex ? { ...s, text: newText } : s))
    );
    setHasUnsavedChanges(true);
  };

  const handleSave = () => {
    if (onSave) {
      onSave(segments);
      setHasUnsavedChanges(false);
    }
  };

  const handleCopyFull = (includeTimestamps = false) => {
    let text = '';
    if (includeTimestamps) {
      text = segments
        .map((s) => `[${formatTime(s.start_time)} - ${formatTime(s.end_time)}] ${s.text}`)
        .join('\n');
    } else {
      text = segments.map((s) => s.text).join(' ');
    }
    navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const formatTime = (sec) => {
    if (sec === undefined || sec === null) return '00:00.0';
    const m = Math.floor(sec / 60);
    const s = Math.floor(sec % 60);
    const ms = Math.floor((sec - Math.floor(sec)) * 10);
    return `${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}.${ms}`;
  };

  // Filter segments by search query
  const filteredSegments = useMemo(() => {
    if (!searchQuery.trim()) return segments;
    const q = searchQuery.toLowerCase();
    return segments.filter((s) => s.text.toLowerCase().includes(q));
  }, [segments, searchQuery]);

  // Determine current active talking segment index
  const activeSegmentIndex = useMemo(() => {
    const active = segments.find(
      (s) => currentTime >= s.start_time && currentTime <= s.end_time
    );
    return active ? active.segment_index : -1;
  }, [segments, currentTime]);

  if (!transcript || !segments.length) {
    return (
      <div style={styles.emptyContainer}>
        <div style={styles.emptyIconBox}>
          <Sparkles size={32} color="#f59e0b" />
        </div>
        <h3 style={{ fontSize: '1.15rem', fontWeight: 600, color: '#f8fafc', marginBottom: '0.4rem' }}>
          No Transcript Loaded Yet
        </h3>
        <p style={{ color: '#94a3b8', fontSize: '0.85rem', maxWidth: '380px', marginBottom: '1.25rem' }}>
          This video hasn't been transcribed yet. Run the speech-to-text model on Google Colab or import results.
        </p>
        <button
          type="button"
          onClick={onOpenColabGuide}
          className="btn btn-primary"
        >
          <span>Run or Import Colab Transcript</span>
        </button>
      </div>
    );
  }

  return (
    <div style={styles.container}>
      {/* Action Bar */}
      <div style={styles.topBar}>
        <div style={styles.searchBox}>
          <Search size={15} color="#6b7280" />
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search transcript..."
            style={styles.searchInput}
          />
          {searchQuery && (
            <span style={styles.searchCountBadge}>
              {filteredSegments.length} hits
            </span>
          )}
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
          <button
            type="button"
            onClick={() => handleCopyFull(false)}
            style={styles.iconBtn}
            title="Copy plain text"
          >
            {copied ? <Check size={14} color="#10b981" /> : <Copy size={14} />}
            <span style={{ fontSize: '0.775rem' }}>{copied ? 'Copied' : 'Copy'}</span>
          </button>

          <button
            type="button"
            onClick={handleSave}
            className="btn btn-secondary"
            style={{
              padding: '0.45rem 0.8rem',
              fontSize: '0.8rem',
              borderColor: hasUnsavedChanges ? '#38bdf8' : undefined,
              color: hasUnsavedChanges ? '#38bdf8' : undefined,
            }}
            disabled={isSaving || !hasUnsavedChanges}
          >
            <Save size={14} />
            <span>{isSaving ? 'Saving...' : hasUnsavedChanges ? 'Save Changes' : 'Saved'}</span>
          </button>

          <button
            type="button"
            onClick={onOpenExport}
            className="btn btn-primary"
            style={{ padding: '0.45rem 0.85rem', fontSize: '0.8rem' }}
          >
            <Download size={14} />
            <span>Export</span>
          </button>
        </div>
      </div>

      {/* Segments List Scroll Area */}
      <div style={styles.segmentsList}>
        {filteredSegments.map((seg) => (
          <SegmentItem
            key={seg.id || seg.segment_index}
            segment={seg}
            isActive={seg.segment_index === activeSegmentIndex}
            onSeek={onSeek}
            onTextChange={handleTextChange}
            formatTime={formatTime}
          />
        ))}

        {filteredSegments.length === 0 && (
          <div style={{ textAlign: 'center', padding: '2rem', color: '#6b7280', fontSize: '0.85rem' }}>
            No segments match your search query '{searchQuery}'.
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  container: {
    display: 'flex',
    flexDirection: 'column',
    height: '100%',
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    border: '1px solid #1e293b',
    overflow: 'hidden',
  },
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '0.75rem 1rem',
    backgroundColor: '#111827',
    borderBottom: '1px solid #1e293b',
    gap: '0.75rem',
    flexWrap: 'wrap',
  },
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#1e293b',
    padding: '0.35rem 0.75rem',
    borderRadius: '6px',
    flex: 1,
    minWidth: '180px',
  },
  searchInput: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#f8fafc',
    fontSize: '0.825rem',
    outline: 'none',
    width: '100%',
  },
  searchCountBadge: {
    fontSize: '0.7rem',
    color: '#38bdf8',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    padding: '0.1rem 0.4rem',
    borderRadius: '4px',
    whiteSpace: 'nowrap',
  },
  iconBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    backgroundColor: '#1e293b',
    color: '#cbd5e1',
    padding: '0.45rem 0.75rem',
    borderRadius: '6px',
    fontSize: '0.8rem',
  },
  segmentsList: {
    flex: 1,
    overflowY: 'auto',
    padding: '1rem',
    maxHeight: '520px',
  },
  emptyContainer: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
    justifyContent: 'center',
    padding: '3rem 1.5rem',
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    border: '1px solid #1e293b',
    textAlign: 'center',
    height: '100%',
  },
  emptyIconBox: {
    width: '60px',
    height: '60px',
    borderRadius: '14px',
    backgroundColor: 'rgba(245, 158, 11, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
};

export default TranscriptEditor;
