import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { History as HistoryIcon, Video, Download, Trash2, ArrowRight, Search, FileText } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';
import ExportModal from '../components/ExportModal';

export const HistoryPage = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const [searchFilter, setSearchFilter] = useState('');
  const [exportModalJob, setExportModalJob] = useState(null);
  const navigate = useNavigate();

  const fetchJobs = async () => {
    try {
      const data = await api.getJobs();
      setJobs(data);
    } catch (err) {
      console.error('Failed to fetch history:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDelete = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Delete this transcript job? The video and subtitle records will be permanently removed.')) return;
    try {
      await api.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      alert('Delete failed: ' + err.message);
    }
  };

  const filteredJobs = jobs.filter((job) => {
    const filename = job.video_details?.original_filename || '';
    const lang = job.transcript?.detected_language || job.target_language || '';
    const q = searchFilter.toLowerCase();
    return filename.toLowerCase().includes(q) || lang.toLowerCase().includes(q);
  });

  return (
    <div>
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.75rem', flexWrap: 'wrap', gap: '1rem' }}>
        <div>
          <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc' }}>
            Transcript History
          </h1>
          <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.2rem' }}>
            Browse and manage all previous transcriptions, subtitles, and exported media files.
          </p>
        </div>

        <div style={styles.searchBox}>
          <Search size={16} color="#64748b" />
          <input
            type="text"
            value={searchFilter}
            onChange={(e) => setSearchFilter(e.target.value)}
            placeholder="Filter by filename or language..."
            style={styles.searchInput}
          />
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
          Loading history records...
        </div>
      ) : filteredJobs.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
          <HistoryIcon size={40} color="#475569" style={{ margin: '0 auto 1rem' }} />
          <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.35rem' }}>
            No records found
          </h3>
          <p style={{ fontSize: '0.85rem', color: '#94a3b8' }}>
            {searchFilter ? 'No jobs match your filter query.' : 'Upload your first video to start transcribing!'}
          </p>
        </div>
      ) : (
        <div style={styles.list}>
          {filteredJobs.map((job) => {
            const hasTranscript = job.status === 'COMPLETED' && !!job.transcript;

            return (
              <div
                key={job.id}
                className="card"
                onClick={() => navigate(`/workspace/${job.id}`)}
                style={styles.cardItem}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                  <div style={styles.iconBox}>
                    <Video size={22} color="#38bdf8" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                      <h4 style={styles.fileName}>
                        {job.video_details?.original_filename || 'Video'}
                      </h4>
                      <StatusBadge status={job.status} />
                    </div>
                    <div style={styles.metaRow}>
                      <span>Format: {job.video_details?.file_format?.toUpperCase()}</span>
                      <span>•</span>
                      <span>Size: {job.video_details?.formatted_size}</span>
                      <span>•</span>
                      <span>
                        Lang: <strong>{job.transcript?.detected_language?.toUpperCase() || job.target_language?.toUpperCase()}</strong>
                      </span>
                      <span>•</span>
                      <span>Date: {new Date(job.created_at).toLocaleString()}</span>
                    </div>

                    {hasTranscript && job.transcript.full_text && (
                      <p style={styles.previewText}>
                        "{job.transcript.full_text.slice(0, 120)}..."
                      </p>
                    )}
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
                  {hasTranscript && (
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        setExportModalJob(job);
                      }}
                      className="btn btn-secondary"
                      style={{ fontSize: '0.775rem', padding: '0.45rem 0.8rem' }}
                      title="Export Subtitles & Text"
                    >
                      <Download size={14} />
                      <span>Export</span>
                    </button>
                  )}

                  <button
                    type="button"
                    onClick={(e) => handleDelete(e, job.id)}
                    style={styles.deleteBtn}
                    title="Delete record and clean disk"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div style={styles.openBtn}>
                    <span>Open</span>
                    <ArrowRight size={14} />
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {exportModalJob && (
        <ExportModal
          isOpen={true}
          onClose={() => setExportModalJob(null)}
          jobId={exportModalJob.id}
          videoName={exportModalJob.video_details?.original_filename}
        />
      )}
    </div>
  );
};

const styles = {
  searchBox: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    padding: '0.5rem 0.85rem',
    minWidth: '280px',
  },
  searchInput: {
    backgroundColor: 'transparent',
    border: 'none',
    color: '#f8fafc',
    fontSize: '0.85rem',
    outline: 'none',
    width: '100%',
  },
  list: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.85rem',
  },
  cardItem: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.15rem 1.35rem',
    cursor: 'pointer',
  },
  iconBox: {
    width: '44px',
    height: '44px',
    borderRadius: '10px',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  fileName: {
    fontSize: '0.975rem',
    fontWeight: 600,
    color: '#f8fafc',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '380px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '0.2rem',
  },
  previewText: {
    fontSize: '0.8rem',
    color: '#94a3b8',
    fontStyle: 'italic',
    marginTop: '0.4rem',
    lineHeight: 1.4,
  },
  deleteBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: '#1e293b',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  openBtn: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.8rem',
    fontWeight: 600,
    color: '#38bdf8',
    padding: '0.45rem 0.75rem',
    borderRadius: '6px',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
};

export default HistoryPage;
