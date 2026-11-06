import React, { useState, useRef } from 'react';
import { UploadCloud, FileVideo, CheckCircle, AlertCircle, X } from 'lucide-react';

const ALLOWED_EXTS = ['.mp4', '.mov', '.mkv', '.avi', '.webm'];
const MAX_BYTES = 500 * 1024 * 1024; // 500 MB

export const Dropzone = ({ onFileSelected, uploadProgress, isUploading, selectedFile, onClearFile }) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const fileInputRef = useRef(null);

  const validateAndSet = (file) => {
    setErrorMessage(null);
    if (!file) return;

    const ext = '.' + file.name.split('.').pop().toLowerCase();
    if (!ALLOWED_EXTS.includes(ext)) {
      setErrorMessage(`Unsupported file format '${ext}'. Allowed: MP4, MOV, MKV, AVI, WEBM.`);
      return;
    }

    if (file.size > MAX_BYTES) {
      setErrorMessage(`File exceeds 500 MB limit (${(file.size / (1024 * 1024)).toFixed(1)} MB).`);
      return;
    }

    if (file.size === 0) {
      setErrorMessage('Selected file is empty (0 bytes).');
      return;
    }

    onFileSelected(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragOver(true);
  };

  const handleDragLeave = () => {
    setIsDragOver(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragOver(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      validateAndSet(e.dataTransfer.files[0]);
    }
  };

  const handleInputChange = (e) => {
    if (e.target.files && e.target.files.length > 0) {
      validateAndSet(e.target.files[0]);
    }
  };

  return (
    <div style={{ width: '100%' }}>
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => !selectedFile && !isUploading && fileInputRef.current?.click()}
        style={{
          ...styles.dropzone,
          ...(isDragOver ? styles.dropzoneActive : {}),
          ...(selectedFile ? styles.dropzoneHasFile : {}),
        }}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".mp4,.mov,.mkv,.avi,.webm"
          style={{ display: 'none' }}
          onChange={handleInputChange}
          disabled={isUploading}
        />

        {!selectedFile ? (
          <div style={styles.emptyState}>
            <div style={styles.iconCircle}>
              <UploadCloud size={32} color="#6366f1" />
            </div>
            <h3 style={{ fontSize: '1.15rem', fontWeight: 600, marginBottom: '0.4rem' }}>
              Drag & Drop your video file here
            </h3>
            <p style={{ color: '#9ca3af', fontSize: '0.875rem', marginBottom: '1.25rem' }}>
              Supports MP4, MOV, MKV, AVI, WEBM up to 500 MB
            </p>
            <button type="button" className="btn btn-secondary" style={{ pointerEvents: 'none' }}>
              Browse Files from Computer
            </button>
          </div>
        ) : (
          <div style={styles.fileSelectedState}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', width: '100%' }}>
              <div style={styles.videoIconBox}>
                <FileVideo size={28} color="#38bdf8" />
              </div>
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  <p style={styles.fileName}>{selectedFile.name}</p>
                  <span style={styles.fileSizeBadge}>
                    {(selectedFile.size / (1024 * 1024)).toFixed(2)} MB
                  </span>
                </div>
                <p style={{ fontSize: '0.8rem', color: '#10b981', display: 'flex', alignItems: 'center', gap: '0.3rem', marginTop: '0.2rem' }}>
                  <CheckCircle size={14} /> Ready for upload & validation
                </p>
              </div>

              {!isUploading && onClearFile && (
                <button
                  type="button"
                  onClick={(e) => {
                    e.stopPropagation();
                    onClearFile();
                  }}
                  style={styles.removeBtn}
                  title="Remove selected video"
                >
                  <X size={18} />
                </button>
              )}
            </div>

            {isUploading && (
              <div style={styles.progressContainer}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.75rem', color: '#94a3b8', marginBottom: '0.35rem' }}>
                  <span>Uploading to Django backend...</span>
                  <span style={{ fontWeight: 600, color: '#38bdf8' }}>{uploadProgress}%</span>
                </div>
                <div style={styles.progressBarTrack}>
                  <div style={{ ...styles.progressBarFill, width: `${uploadProgress}%` }}></div>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      {errorMessage && (
        <div style={styles.errorAlert}>
          <AlertCircle size={16} />
          <span>{errorMessage}</span>
        </div>
      )}
    </div>
  );
};

const styles = {
  dropzone: {
    border: '2px dashed #334155',
    borderRadius: '14px',
    padding: '2.5rem 1.5rem',
    textAlign: 'center',
    cursor: 'pointer',
    backgroundColor: '#0f172a',
    transition: 'all 0.2s ease',
  },
  dropzoneActive: {
    borderColor: '#6366f1',
    backgroundColor: 'rgba(99, 102, 241, 0.05)',
  },
  dropzoneHasFile: {
    cursor: 'default',
    borderColor: '#10b981',
    padding: '1.5rem',
  },
  emptyState: {
    display: 'flex',
    flexDirection: 'column',
    alignItems: 'center',
  },
  iconCircle: {
    width: '64px',
    height: '64px',
    borderRadius: '50%',
    backgroundColor: 'rgba(99, 102, 241, 0.1)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: '1rem',
  },
  fileSelectedState: {
    display: 'flex',
    flexDirection: 'column',
    gap: '1rem',
  },
  videoIconBox: {
    width: '50px',
    height: '50px',
    borderRadius: '10px',
    backgroundColor: 'rgba(56, 189, 248, 0.12)',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  fileName: {
    fontSize: '0.975rem',
    fontWeight: 600,
    color: '#f8fafc',
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  fileSizeBadge: {
    fontSize: '0.75rem',
    backgroundColor: '#1e293b',
    color: '#94a3b8',
    padding: '0.15rem 0.5rem',
    borderRadius: '4px',
  },
  removeBtn: {
    width: '32px',
    height: '32px',
    borderRadius: '6px',
    backgroundColor: '#1e293b',
    color: '#9ca3af',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressContainer: {
    width: '100%',
    marginTop: '0.5rem',
  },
  progressBarTrack: {
    width: '100%',
    height: '6px',
    backgroundColor: '#1e293b',
    borderRadius: '3px',
    overflow: 'hidden',
  },
  progressBarFill: {
    height: '100%',
    background: 'linear-gradient(90deg, #6366f1 0%, #38bdf8 100%)',
    transition: 'width 0.2s ease',
  },
  errorAlert: {
    marginTop: '0.75rem',
    padding: '0.75rem 1rem',
    backgroundColor: 'rgba(239, 68, 68, 0.1)',
    border: '1px solid rgba(239, 68, 68, 0.25)',
    borderRadius: '8px',
    color: '#f87171',
    fontSize: '0.85rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
};

export default Dropzone;
