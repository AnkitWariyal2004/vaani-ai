import React, { useState } from 'react';
import { X, ExternalLink, UploadCloud, Cpu, Sparkles, Check, AlertCircle } from 'lucide-react';
import api from '../services/api';

const SAMPLE_DEMO_PAYLOAD = {
  detected_language: 'hi',
  language_probability: 0.985,
  duration: 28.5,
  text: 'नमस्ते और वाणी एआई में आपका स्वागत है। यह एक संपूर्ण शून्य बजट एआई वीडियो ट्रांसक्रिप्शन सिस्टम है। यह आपके लैपटॉप के रिसोर्सेज को सुरक्षित रखते हुए गूगल कोलाब पर तेजी से काम करता है। इसमें आप हिंदी, अंग्रेजी और क्षेत्रीय भारतीय भाषाओं में सटीक उपशीर्षक प्राप्त कर सकते हैं। धन्यवाद।',
  segments: [
    {
      id: 0,
      start: 0.0,
      end: 3.8,
      text: 'नमस्ते और वाणी एआई में आपका स्वागत है।'
    },
    {
      id: 1,
      start: 3.8,
      end: 9.4,
      text: 'यह एक संपूर्ण शून्य बजट एआई वीडियो ट्रांसक्रिप्शन सिस्टम है।'
    },
    {
      id: 2,
      start: 9.4,
      end: 16.2,
      text: 'यह आपके लैपटॉप के रिसोर्सेज को सुरक्षित रखते हुए गूगल कोलाब पर तेजी से काम करता है।'
    },
    {
      id: 3,
      start: 16.2,
      end: 24.1,
      text: 'इसमें आप हिंदी, अंग्रेजी और क्षेत्रीय भारतीय भाषाओं में सटीक उपशीर्षक प्राप्त कर सकते हैं।'
    },
    {
      id: 4,
      start: 24.1,
      end: 28.5,
      text: 'वाणी एआई का उपयोग करने के लिए धन्यवाद।'
    }
  ]
};

export const ColabGuideModal = ({ isOpen, onClose, job, onTranscriptImported }) => {
  const [jsonInput, setJsonInput] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState(null);
  const [successMessage, setSuccessMessage] = useState(null);

  if (!isOpen || !job) return null;

  const handleFileUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (event) => {
      try {
        const text = event.target?.result;
        setJsonInput(text);
      } catch (err) {
        setErrorMessage('Failed to read file contents: ' + err.message);
      }
    };
    reader.readAsText(file);
  };

  const submitColabPayload = async (payloadToUse) => {
    setIsSubmitting(true);
    setErrorMessage(null);
    setSuccessMessage(null);

    try {
      let parsed = payloadToUse;
      if (typeof payloadToUse === 'string') {
        parsed = JSON.parse(payloadToUse);
      }

      await api.importColabResult(job.id, parsed);
      setSuccessMessage('Transcript imported and synchronized successfully!');
      setTimeout(() => {
        if (onTranscriptImported) onTranscriptImported();
        onClose();
      }, 1000);
    } catch (err) {
      setErrorMessage(
        err.response?.data?.error ||
        err.response?.data?.details ||
        err.message ||
        'Failed to import Colab transcript.'
      );
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLoadDemo = () => {
    submitColabPayload(SAMPLE_DEMO_PAYLOAD);
  };

  return (
    <div style={styles.backdrop} onClick={onClose}>
      <div style={styles.modal} onClick={(e) => e.stopPropagation()}>
        <div style={styles.header}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.65rem' }}>
            <div style={styles.iconBox}>
              <Cpu size={20} color="#f59e0b" />
            </div>
            <div>
              <h2 style={{ fontSize: '1.2rem', fontWeight: 700, color: '#f8fafc' }}>
                Google Colab Free AI Processing
              </h2>
              <p style={{ fontSize: '0.775rem', color: '#94a3b8' }}>
                Job ID: <code style={{ color: '#38bdf8' }}>{job.id}</code>
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} style={styles.closeBtn}>
            <X size={18} />
          </button>
        </div>

        <div style={styles.body}>
          {/* Instructions Box */}
          <div style={styles.stepsBox}>
            <h4 style={{ fontSize: '0.875rem', fontWeight: 600, color: '#f1f5f9', marginBottom: '0.5rem' }}>
              How to transcribe with ₹0 budget:
            </h4>
            <ol style={styles.stepsList}>
              <li>
                Open the <strong>VAANI Transcriber</strong> notebook in Google Colab (Free T4 GPU).
              </li>
              <li>
                Set <code>JOB_ID = "{job.id}"</code> and upload the video in Colab.
              </li>
              <li>
                Run all cells. Colab will download <code>vaani_transcript_{job.id}.json</code>.
              </li>
              <li>
                Drop that JSON file below or click <strong>Load Demo Multilingual Transcript</strong> to test immediately!
              </li>
            </ol>
            <div style={{ display: 'flex', gap: '0.75rem', marginTop: '0.75rem' }}>
              <a
                href="https://colab.research.google.com/"
                target="_blank"
                rel="noopener noreferrer"
                className="btn btn-secondary"
                style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
              >
                <span>Open Google Colab</span>
                <ExternalLink size={14} />
              </a>

              {job.video_details?.file_url && (
                <a
                  href={job.video_details.file_url}
                  download
                  className="btn btn-secondary"
                  style={{ fontSize: '0.8rem', padding: '0.45rem 0.85rem' }}
                >
                  <span>Download Video File</span>
                </a>
              )}
            </div>
          </div>

          {/* Import Dropzone / Textarea */}
          <div style={{ marginTop: '1rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '0.4rem' }}>
              <label style={{ fontSize: '0.85rem', fontWeight: 600, color: '#e2e8f0' }}>
                Import Colab JSON Output:
              </label>
              <button
                type="button"
                onClick={handleLoadDemo}
                style={styles.demoBtn}
                title="Loads sample Hindi/Devanagari transcript with timestamps"
              >
                <Sparkles size={13} color="#f59e0b" />
                <span>Try Demo Hindi Transcript</span>
              </button>
            </div>

            <div style={styles.fileDropArea}>
              <UploadCloud size={20} color="#94a3b8" />
              <span style={{ fontSize: '0.8rem', color: '#94a3b8' }}>
                Drop <code>.json</code> output file or
              </span>
              <label style={styles.browseLabel}>
                browse
                <input
                  type="file"
                  accept=".json"
                  onChange={handleFileUpload}
                  style={{ display: 'none' }}
                />
              </label>
            </div>

            <textarea
              value={jsonInput}
              onChange={(e) => setJsonInput(e.target.value)}
              placeholder="Or paste the generated Colab JSON transcript payload here..."
              rows={4}
              style={styles.jsonTextarea}
            />
          </div>

          {errorMessage && (
            <div style={styles.errorAlert}>
              <AlertCircle size={15} />
              <span>{errorMessage}</span>
            </div>
          )}

          {successMessage && (
            <div style={styles.successAlert}>
              <Check size={15} />
              <span>{successMessage}</span>
            </div>
          )}

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.25rem' }}>
            <button type="button" onClick={onClose} className="btn btn-secondary">
              Cancel
            </button>
            <button
              type="button"
              onClick={() => submitColabPayload(jsonInput)}
              className="btn btn-primary"
              disabled={!jsonInput.trim() || isSubmitting}
            >
              {isSubmitting ? 'Importing...' : 'Sync Transcript'}
            </button>
          </div>
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
    maxWidth: '620px',
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
    backgroundColor: 'rgba(245, 158, 11, 0.15)',
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
  body: {
    padding: '1.25rem 1.5rem',
  },
  stepsBox: {
    backgroundColor: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '10px',
    padding: '1rem',
  },
  stepsList: {
    paddingLeft: '1.2rem',
    fontSize: '0.8rem',
    color: '#94a3b8',
    lineHeight: 1.6,
  },
  demoBtn: {
    display: 'inline-flex',
    alignItems: 'center',
    gap: '0.35rem',
    fontSize: '0.75rem',
    color: '#f59e0b',
    backgroundColor: 'rgba(245, 158, 11, 0.1)',
    border: '1px solid rgba(245, 158, 11, 0.25)',
    padding: '0.2rem 0.55rem',
    borderRadius: '4px',
    fontWeight: 600,
  },
  fileDropArea: {
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    padding: '0.65rem 1rem',
    backgroundColor: '#111827',
    border: '1px dashed #334155',
    borderRadius: '8px',
    marginBottom: '0.5rem',
  },
  browseLabel: {
    color: '#38bdf8',
    textDecoration: 'underline',
    cursor: 'pointer',
    fontSize: '0.8rem',
    fontWeight: 500,
  },
  jsonTextarea: {
    width: '100%',
    backgroundColor: '#111827',
    border: '1px solid #1f2937',
    borderRadius: '8px',
    padding: '0.75rem',
    color: '#f1f5f9',
    fontSize: '0.8rem',
    fontFamily: 'monospace',
    outline: 'none',
    boxSizing: 'border-box',
    resize: 'vertical',
  },
  errorAlert: {
    marginTop: '0.75rem',
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
    marginTop: '0.75rem',
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

export default ColabGuideModal;
