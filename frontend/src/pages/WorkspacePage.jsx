import React, { useEffect, useState, useRef } from 'react';
import { useParams, Link } from 'react-router-dom';
import { Video, Cpu, Download, ArrowLeft, RefreshCw, AlertCircle, Sparkles } from 'lucide-react';
import api from '../services/api';
import VideoPlayer from '../components/VideoPlayer';
import TranscriptEditor from '../components/TranscriptEditor';
import StatusBadge from '../components/StatusBadge';
import ExportModal from '../components/ExportModal';
import ColabGuideModal from '../components/ColabGuideModal';

export const WorkspacePage = () => {
  const { id } = useParams();
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [currentTime, setCurrentTime] = useState(0);
  const [isExportOpen, setIsExportOpen] = useState(false);
  const [isColabGuideOpen, setIsColabGuideOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const videoPlayerRef = useRef(null);

  const fetchJob = async () => {
    try {
      const data = await api.getJob(id);
      setJob(data);
      setError(null);
    } catch (err) {
      console.error('Failed to fetch job:', err);
      setError('Could not load transcription job. Check if backend is running.');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchJob();
  }, [id]);

  const handleSeek = (timeInSeconds) => {
    if (videoPlayerRef.current) {
      videoPlayerRef.current.seekTo(timeInSeconds);
    }
  };

  const handleSaveSegments = async (updatedSegments) => {
    setIsSaving(true);
    try {
      const formattedSegments = updatedSegments.map((s, idx) => ({
        segment_index: s.segment_index !== undefined ? s.segment_index : idx,
        start_time: s.start_time,
        end_time: s.end_time,
        text: s.text,
      }));

      const res = await api.editTranscript(id, {
        segments: formattedSegments,
      });

      setJob((prev) => ({
        ...prev,
        transcript: res.transcript,
      }));
    } catch (err) {
      alert('Failed to save changes: ' + err.message);
    } finally {
      setIsSaving(false);
    }
  };

  if (loading) {
    return (
      <div style={{ textAlign: 'center', padding: '4rem', color: '#94a3b8' }}>
        <RefreshCw size={24} className="spin" style={{ margin: '0 auto 1rem' }} />
        <p>Loading transcription workspace...</p>
      </div>
    );
  }

  if (error || !job) {
    return (
      <div className="card" style={{ maxWidth: '600px', margin: '2rem auto', textAlign: 'center' }}>
        <AlertCircle size={36} color="#ef4444" style={{ margin: '0 auto 1rem' }} />
        <h2 style={{ fontSize: '1.25rem', fontWeight: 700, marginBottom: '0.5rem' }}>Job Not Found</h2>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginBottom: '1.5rem' }}>{error}</p>
        <Link to="/" className="btn btn-secondary">
          <ArrowLeft size={16} />
          <span>Back to Dashboard</span>
        </Link>
      </div>
    );
  }

  const isCompleted = job.status === 'COMPLETED' && !!job.transcript;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Top Header Bar */}
      <div style={styles.topBar}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem' }}>
          <Link to="/" style={styles.backBtn} title="Back to Dashboard">
            <ArrowLeft size={18} />
          </Link>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
              <h1 style={styles.title}>
                {job.video_details?.original_filename || 'Video File'}
              </h1>
              <StatusBadge status={job.status} />
            </div>
            <div style={styles.metaRow}>
              <span>Language: <strong>{job.transcript?.detected_language?.toUpperCase() || job.target_language?.toUpperCase()}</strong></span>
              <span>•</span>
              <span>Model: <strong>Whisper {job.model_size}</strong></span>
              {job.transcript?.duration && (
                <>
                  <span>•</span>
                  <span>Duration: <strong>{job.transcript.duration.toFixed(1)}s</strong></span>
                </>
              )}
            </div>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem', flexWrap: 'wrap' }}>
          <button
            type="button"
            onClick={() => setIsColabGuideOpen(true)}
            className="btn btn-secondary"
            style={{ fontSize: '0.825rem' }}
          >
            <Cpu size={15} color="#f59e0b" />
            <span>Colab Engine & Import</span>
          </button>

          {isCompleted && (
            <button
              type="button"
              onClick={() => setIsExportOpen(true)}
              className="btn btn-primary"
              style={{ fontSize: '0.825rem' }}
            >
              <Download size={15} />
              <span>Export Options</span>
            </button>
          )}
        </div>
      </div>

      {/* Colab Pending Banner */}
      {!isCompleted && (
        <div style={styles.pendingBanner}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
            <div style={styles.pendingIconBox}>
              <Sparkles size={20} color="#f59e0b" />
            </div>
            <div>
              <h4 style={{ fontSize: '0.925rem', fontWeight: 600, color: '#fef3c7' }}>
                Ready for Google Colab Multilingual Inference
              </h4>
              <p style={{ fontSize: '0.8rem', color: '#cbd5e1', marginTop: '0.15rem' }}>
                Your video is uploaded to Django. To run zero-cost AI transcription without laptop freeze,
                open Colab or click below to load a demo multilingual transcript.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={() => setIsColabGuideOpen(true)}
            className="btn btn-primary"
            style={{ fontSize: '0.825rem', padding: '0.5rem 1rem', whiteSpace: 'nowrap' }}
          >
            <span>Run or Import Colab Transcript</span>
          </button>
        </div>
      )}

      {/* Main Split Grid */}
      <div style={styles.workspaceGrid}>
        {/* Left Column: Synchronized Video Player */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <VideoPlayer
            ref={videoPlayerRef}
            videoUrl={job.video_details?.file_url}
            segments={job.transcript?.segments || []}
            onTimeUpdate={(t) => setCurrentTime(t)}
          />

          <div className="card" style={{ padding: '1rem' }}>
            <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0', marginBottom: '0.4rem' }}>
              Synchronized Subtitle Playback
            </h4>
            <p style={{ fontSize: '0.775rem', color: '#94a3b8', lineHeight: 1.5 }}>
              Click on any timestamp in the transcript to jump playback to that second. Subtitles render dynamically in real-time.
            </p>
          </div>
        </div>

        {/* Right Column: Transcript Editor & Exporter */}
        <div style={{ minHeight: '480px' }}>
          <TranscriptEditor
            transcript={job.transcript}
            currentTime={currentTime}
            onSeek={handleSeek}
            onSave={handleSaveSegments}
            onOpenExport={() => setIsExportOpen(true)}
            onOpenColabGuide={() => setIsColabGuideOpen(true)}
            isSaving={isSaving}
          />
        </div>
      </div>

      {/* Modals */}
      <ExportModal
        isOpen={isExportOpen}
        onClose={() => setIsExportOpen(false)}
        jobId={job.id}
        videoName={job.video_details?.original_filename}
      />

      <ColabGuideModal
        isOpen={isColabGuideOpen}
        onClose={() => setIsColabGuideOpen(false)}
        job={job}
        onTranscriptImported={fetchJob}
      />
    </div>
  );
};

const styles = {
  topBar: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1.25rem 1.5rem',
    backgroundColor: '#0f172a',
    borderRadius: '12px',
    border: '1px solid #1e293b',
    flexWrap: 'wrap',
    gap: '1rem',
  },
  backBtn: {
    width: '36px',
    height: '36px',
    borderRadius: '8px',
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  title: {
    fontSize: '1.25rem',
    fontWeight: 700,
    color: '#f8fafc',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
    maxWidth: '420px',
  },
  metaRow: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    fontSize: '0.775rem',
    color: '#94a3b8',
    marginTop: '0.2rem',
  },
  pendingBanner: {
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: '1rem 1.25rem',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.3)',
    borderRadius: '10px',
    gap: '1rem',
    flexWrap: 'wrap',
  },
  pendingIconBox: {
    width: '38px',
    height: '38px',
    borderRadius: '8px',
    backgroundColor: 'rgba(245, 158, 11, 0.18)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    flexShrink: 0,
  },
  workspaceGrid: {
    display: 'grid',
    gridTemplateColumns: 'minmax(320px, 1.15fr) minmax(340px, 1.35fr)',
    gap: '1.5rem',
  },
};

export default WorkspacePage;
