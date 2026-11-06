import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { UploadCloud, Video, Sparkles, Cpu, Clock, Trash2, ArrowRight, ExternalLink } from 'lucide-react';
import api from '../services/api';
import StatusBadge from '../components/StatusBadge';

export const Dashboard = () => {
  const [jobs, setJobs] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const fetchJobs = async () => {
    try {
      const data = await api.getJobs();
      setJobs(data);
    } catch (err) {
      console.error('Failed to load transcription jobs:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJobs();
  }, []);

  const handleDeleteJob = async (e, id) => {
    e.stopPropagation();
    if (!window.confirm('Are you sure you want to delete this transcription job?')) return;
    try {
      await api.deleteJob(id);
      setJobs((prev) => prev.filter((j) => j.id !== id));
    } catch (err) {
      alert('Failed to delete job: ' + err.message);
    }
  };

  return (
    <div>
      {/* Hero Banner */}
      <div style={styles.heroBanner}>
        <div style={{ maxWidth: '640px' }}>
          <div style={styles.badgePill}>
            <Sparkles size={14} color="#38bdf8" />
            <span>100% Free • ₹0 Budget • Zero Local GPU Load</span>
          </div>
          <h1 style={styles.heroTitle}>
            Multilingual Video Transcription <span className="gradient-text">for Everyone</span>
          </h1>
          <p style={styles.heroSubtitle}>
            Transcribe Hindi in Devanagari, English, Gujarati, Punjabi, Bengali, and 90+ languages.
            High performance without hanging your low-spec laptop by offloading AI to Google Colab.
          </p>

          <div style={{ display: 'flex', gap: '0.85rem', marginTop: '1.5rem', flexWrap: 'wrap' }}>
            <Link to="/upload" className="btn btn-primary">
              <UploadCloud size={17} />
              <span>Upload Video Now</span>
            </Link>
            <a
              href="https://colab.research.google.com/"
              target="_blank"
              rel="noopener noreferrer"
              className="btn btn-secondary"
            >
              <span>Launch Colab Engine</span>
              <ExternalLink size={15} />
            </a>
          </div>
        </div>
      </div>

      {/* Metrics Row */}
      <div style={styles.metricsGrid}>
        <div className="card" style={styles.metricCard}>
          <div style={styles.metricIconBox}>
            <Video size={22} color="#38bdf8" />
          </div>
          <div>
            <div style={styles.metricValue}>{jobs.length}</div>
            <div style={styles.metricLabel}>Total Transcription Jobs</div>
          </div>
        </div>

        <div className="card" style={styles.metricCard}>
          <div style={{ ...styles.metricIconBox, backgroundColor: 'rgba(16, 185, 129, 0.12)' }}>
            <Sparkles size={22} color="#10b981" />
          </div>
          <div>
            <div style={styles.metricValue}>
              {jobs.filter((j) => j.status === 'COMPLETED').length}
            </div>
            <div style={styles.metricLabel}>Completed Transcripts</div>
          </div>
        </div>

        <div className="card" style={styles.metricCard}>
          <div style={{ ...styles.metricIconBox, backgroundColor: 'rgba(245, 158, 11, 0.12)' }}>
            <Cpu size={22} color="#f59e0b" />
          </div>
          <div>
            <div style={styles.metricValue}>Google Colab</div>
            <div style={styles.metricLabel}>AI Inference: Free T4 GPU</div>
          </div>
        </div>

        <div className="card" style={styles.metricCard}>
          <div style={{ ...styles.metricIconBox, backgroundColor: 'rgba(99, 102, 241, 0.12)' }}>
            <Clock size={22} color="#6366f1" />
          </div>
          <div>
            <div style={styles.metricValue}>₹0.00</div>
            <div style={styles.metricLabel}>Strict Zero Cost</div>
          </div>
        </div>
      </div>

      {/* Recent Jobs Section */}
      <div style={{ marginTop: '2.5rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
          <div>
            <h2 style={{ fontSize: '1.25rem', fontWeight: 700, color: '#f8fafc' }}>
              Recent Transcription Jobs
            </h2>
            <p style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
              Select a job to view synchronized subtitles or import results from Colab
            </p>
          </div>
          <Link to="/upload" className="btn btn-secondary" style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}>
            <span>+ New Upload</span>
          </Link>
        </div>

        {loading ? (
          <div style={{ textAlign: 'center', padding: '3rem', color: '#94a3b8' }}>
            Loading jobs...
          </div>
        ) : jobs.length === 0 ? (
          <div className="card" style={{ textAlign: 'center', padding: '3.5rem 1.5rem' }}>
            <Video size={42} color="#475569" style={{ margin: '0 auto 1rem' }} />
            <h3 style={{ fontSize: '1.1rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.35rem' }}>
              No videos uploaded yet
            </h3>
            <p style={{ fontSize: '0.85rem', color: '#94a3b8', maxWidth: '380px', margin: '0 auto 1.5rem' }}>
              Get started by uploading an MP4, MOV, MKV, AVI, or WEBM video.
            </p>
            <Link to="/upload" className="btn btn-primary">
              <UploadCloud size={16} />
              <span>Upload Video</span>
            </Link>
          </div>
        ) : (
          <div style={styles.jobsList}>
            {jobs.map((job) => (
              <div
                key={job.id}
                className="card"
                onClick={() => navigate(`/workspace/${job.id}`)}
                style={styles.jobRow}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', flex: 1, minWidth: 0 }}>
                  <div style={styles.videoThumbnailBox}>
                    <Video size={20} color="#38bdf8" />
                  </div>
                  <div style={{ minWidth: 0 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem', flexWrap: 'wrap' }}>
                      <h4 style={styles.jobFileName}>
                        {job.video_details?.original_filename || 'Video File'}
                      </h4>
                      <StatusBadge status={job.status} />
                    </div>
                    <div style={styles.jobMeta}>
                      <span>Format: {job.video_details?.file_format?.toUpperCase() || 'MP4'}</span>
                      <span>•</span>
                      <span>Size: {job.video_details?.formatted_size || 'N/A'}</span>
                      <span>•</span>
                      <span>Lang: {job.transcript?.detected_language?.toUpperCase() || job.target_language?.toUpperCase()}</span>
                      <span>•</span>
                      <span>{new Date(job.created_at).toLocaleDateString()}</span>
                    </div>
                  </div>
                </div>

                <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
                  <button
                    type="button"
                    onClick={(e) => handleDeleteJob(e, job.id)}
                    style={styles.deleteBtn}
                    title="Delete Job"
                  >
                    <Trash2 size={16} />
                  </button>

                  <div style={styles.openBtn}>
                    <span>Workspace</span>
                    <ArrowRight size={15} />
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

const styles = {
  heroBanner: {
    padding: '2.5rem',
    borderRadius: '16px',
    background: 'radial-gradient(ellipse at top left, rgba(79, 70, 229, 0.18) 0%, rgba(15, 23, 42, 0.8) 70%)',
    border: '1px solid #1e293b',
    marginBottom: '2rem',
  },
  badgePill: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.4rem',
    padding: '0.3rem 0.75rem',
    borderRadius: '9999px',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
    border: '1px solid rgba(56, 189, 248, 0.25)',
    color: '#38bdf8',
    fontSize: '0.775rem',
    fontWeight: 600,
    marginBottom: '1rem',
  },
  heroTitle: {
    fontSize: '2.25rem',
    fontWeight: 800,
    lineHeight: 1.2,
    color: '#f8fafc',
    letterSpacing: '-0.025em',
    marginBottom: '0.75rem',
  },
  heroSubtitle: {
    fontSize: '1rem',
    color: '#94a3b8',
    lineHeight: 1.6,
  },
  metricsGrid: {
    display: 'grid',
    gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
    gap: '1rem',
  },
  metricCard: {
    display: 'flex',
    alignItems: 'center',
    gap: '1rem',
    padding: '1.25rem',
  },
  metricIconBox: {
    width: '46px',
    height: '46px',
    borderRadius: '10px',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  metricValue: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#f8fafc',
  },
  metricLabel: {
    fontSize: '0.775rem',
    color: '#94a3b8',
    marginTop: '0.1rem',
  },
  jobsList: {
    display: 'flex',
    flexDirection: 'column',
    gap: '0.75rem',
  },
  jobRow: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    cursor: 'pointer',
  },
  videoThumbnailBox: {
    width: '42px',
    height: '42px',
    borderRadius: '8px',
    backgroundColor: '#1e293b',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  jobFileName: {
    fontSize: '0.95rem',
    fontWeight: 600,
    color: '#f8fafc',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '320px',
  },
  jobMeta: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    fontSize: '0.75rem',
    color: '#64748b',
    marginTop: '0.2rem',
  },
  deleteBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: '#1e293b',
    color: '#94a3b8',
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
    padding: '0.4rem 0.75rem',
    borderRadius: '6px',
    backgroundColor: 'rgba(56, 189, 248, 0.1)',
  },
};

export default Dashboard;
