import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { UploadCloud, Languages, Cpu, CheckCircle, AlertCircle, ArrowRight } from 'lucide-react';
import Dropzone from '../components/Dropzone';
import api from '../services/api';

const SUPPORTED_LANGUAGES = [
  { code: 'auto', name: 'Automatic Detection (Whisper VAD)', native: 'Auto Detect' },
  { code: 'hi', name: 'Hindi', native: 'हिन्दी (Devanagari)' },
  { code: 'en', name: 'English', native: 'English' },
  { code: 'gu', name: 'Gujarati', native: 'ગુજરાતી' },
  { code: 'pa', name: 'Punjabi', native: 'ਪੰਜਾਬੀ' },
  { code: 'bn', name: 'Bengali', native: 'বাংলা' },
  { code: 'mr', name: 'Marathi', native: 'मराठी' },
  { code: 'ta', name: 'Tamil', native: 'தமிழ்' },
  { code: 'te', name: 'Telugu', native: 'తెలుగు' },
  { code: 'kn', name: 'Kannada', native: 'ಕನ್ನಡ' },
  { code: 'ml', name: 'Malayalam', native: 'മലയാളം' },
  { code: 'ur', name: 'Urdu', native: 'اردو' },
];

const MODEL_SIZES = [
  { id: 'small', name: 'Small (Recommended)', desc: 'Optimal balance of speed & Devanagari accuracy (Free Colab T4)' },
  { id: 'base', name: 'Base', desc: 'Faster execution, suitable for clear English or Hindi speech' },
  { id: 'tiny', name: 'Tiny', desc: 'Smallest footprint, ultra fast' },
  { id: 'medium', name: 'Medium', desc: 'Highest accuracy for background noise, accents or technical jargon' },
];

export const UploadPage = () => {
  const [selectedFile, setSelectedFile] = useState(null);
  const [targetLanguage, setTargetLanguage] = useState('auto');
  const [modelSize, setModelSize] = useState('small');
  const [isUploading, setIsUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState(0);
  const [errorMessage, setErrorMessage] = useState(null);
  const navigate = useNavigate();

  const handleStartProcessing = async () => {
    if (!selectedFile) {
      setErrorMessage('Please select a video file first.');
      return;
    }

    setErrorMessage(null);
    setIsUploading(true);
    setUploadProgress(0);

    try {
      // 1. Upload video file to Django backend
      const uploadRes = await api.uploadVideo(selectedFile, (progress) => {
        setUploadProgress(progress);
      });

      const videoId = uploadRes.video.id;

      // 2. Initialize transcription job
      const jobRes = await api.createJob(videoId, targetLanguage, modelSize);
      const jobId = jobRes.job.id;

      // 3. Navigate directly to Workspace
      navigate(`/workspace/${jobId}`);
    } catch (err) {
      console.error('Upload failed:', err);
      setErrorMessage(
        err.response?.data?.error ||
        err.response?.data?.file?.[0] ||
        err.message ||
        'Failed to upload video.'
      );
      setIsUploading(false);
    }
  };

  return (
    <div style={{ maxWidth: '820px', margin: '0 auto' }}>
      <div style={{ marginBottom: '1.75rem' }}>
        <h1 style={{ fontSize: '1.75rem', fontWeight: 800, color: '#f8fafc' }}>
          Upload Video for Transcription
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.875rem', marginTop: '0.25rem' }}>
          Upload MP4, MOV, MKV, AVI, or WEBM. Video is validated and prepared for free Colab transcription.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Dropzone Card */}
        <div className="card">
          <Dropzone
            onFileSelected={(file) => setSelectedFile(file)}
            onClearFile={() => setSelectedFile(null)}
            selectedFile={selectedFile}
            isUploading={isUploading}
            uploadProgress={uploadProgress}
          />
        </div>

        {/* Configuration Card */}
        <div className="card">
          <h3 style={{ fontSize: '1rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '1.25rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Languages size={18} color="#38bdf8" />
            <span>Transcription Settings</span>
          </h3>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.25rem' }}>
            {/* Target Language */}
            <div>
              <label style={styles.label}>
                Speech Language:
              </label>
              <select
                value={targetLanguage}
                onChange={(e) => setTargetLanguage(e.target.value)}
                style={styles.select}
                disabled={isUploading}
              >
                {SUPPORTED_LANGUAGES.map((lang) => (
                  <option key={lang.code} value={lang.code}>
                    {lang.name} — {lang.native}
                  </option>
                ))}
              </select>
              <p style={styles.fieldHint}>
                Select 'Hindi' to force Devanagari output or 'Automatic' to auto-detect.
              </p>
            </div>

            {/* Model Size */}
            <div>
              <label style={styles.label}>
                Whisper Model Size:
              </label>
              <select
                value={modelSize}
                onChange={(e) => setModelSize(e.target.value)}
                style={styles.select}
                disabled={isUploading}
              >
                {MODEL_SIZES.map((model) => (
                  <option key={model.id} value={model.id}>
                    {model.name}
                  </option>
                ))}
              </select>
              <p style={styles.fieldHint}>
                Runs on Colab T4 GPU. 'Small' recommended for fast, precise Indian languages.
              </p>
            </div>
          </div>
        </div>

        {/* Error Alert */}
        {errorMessage && (
          <div style={styles.errorAlert}>
            <AlertCircle size={17} />
            <span>{errorMessage}</span>
          </div>
        )}

        {/* Action Button */}
        <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem' }}>
          <button
            type="button"
            onClick={handleStartProcessing}
            className="btn btn-primary"
            style={{ padding: '0.85rem 1.75rem', fontSize: '1rem', fontWeight: 600 }}
            disabled={!selectedFile || isUploading}
          >
            {isUploading ? (
              <span>Uploading Video ({uploadProgress}%)...</span>
            ) : (
              <>
                <span>Continue to Workspace</span>
                <ArrowRight size={18} />
              </>
            )}
          </button>
        </div>
      </div>
    </div>
  );
};

const styles = {
  label: {
    display: 'block',
    fontSize: '0.825rem',
    fontWeight: 600,
    color: '#cbd5e1',
    marginBottom: '0.4rem',
  },
  select: {
    width: '100%',
    padding: '0.65rem 0.85rem',
    backgroundColor: '#0f172a',
    border: '1px solid #334155',
    borderRadius: '8px',
    color: '#f8fafc',
    fontSize: '0.875rem',
    outline: 'none',
  },
  fieldHint: {
    fontSize: '0.725rem',
    color: '#64748b',
    marginTop: '0.35rem',
  },
  errorAlert: {
    padding: '0.85rem 1rem',
    backgroundColor: 'rgba(239, 68, 68, 0.12)',
    border: '1px solid rgba(239, 68, 68, 0.3)',
    borderRadius: '8px',
    color: '#f87171',
    fontSize: '0.875rem',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
  },
};

export default UploadPage;
