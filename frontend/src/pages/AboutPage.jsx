import React from 'react';
import { Cpu, ShieldCheck, IndianRupee, Layers, CheckCircle2, AlertTriangle, Zap } from 'lucide-react';

export const AboutPage = () => {
  return (
    <div style={{ maxWidth: '860px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <h1 style={{ fontSize: '2rem', fontWeight: 800, color: '#f8fafc' }}>
          About VAANI AI Architecture
        </h1>
        <p style={{ color: '#94a3b8', fontSize: '0.95rem', marginTop: '0.35rem' }}>
          Engineered for strict zero-cost operation and high responsiveness on everyday low-spec laptops.
        </p>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
        {/* Core Pillars */}
        <div className="card">
          <h2 style={styles.sectionHeading}>
            <IndianRupee size={22} color="#10b981" />
            <span>Strictly ₹0 Budget Guarantee</span>
          </h2>
          <p style={styles.paragraph}>
            VAANI AI was specifically designed to eliminate all recurring cloud costs. It uses:
          </p>
          <ul style={styles.featureList}>
            <li><CheckCircle2 size={16} color="#10b981" /> No paid OpenAI Whisper API ($0.006/min eliminated).</li>
            <li><CheckCircle2 size={16} color="#10b981" /> No paid Google Gemini or cloud speech endpoints.</li>
            <li><CheckCircle2 size={16} color="#10b981" /> No paid GPU servers (AWS EC2 / RunPod / Paperspace).</li>
            <li><CheckCircle2 size={16} color="#10b981" /> No paid cloud databases — lightweight SQLite keeps memory under 30 MB.</li>
          </ul>
        </div>

        {/* Low Spec Hardware Optimization */}
        <div className="card">
          <h2 style={styles.sectionHeading}>
            <Cpu size={22} color="#38bdf8" />
            <span>Hardware Optimization for 8 GB RAM / Intel i3</span>
          </h2>
          <p style={styles.paragraph}>
            Running high-precision AI speech recognition locally on an Intel i3 with 8 GB RAM causes severe thermal throttling, system freezes, and OOM crashes.
          </p>
          <p style={styles.paragraph}>
            <strong>VAANI AI Solution:</strong> The Django server and React UI handle only lightweight web tasks (file routing, SQLite queries, text formatting). The heavy AI computation (acoustic models, VAD silence filtering, Devanagari tokenization) is completely offloaded to <strong>Google Colab's Free Tier NVIDIA T4 GPU (16 GB VRAM)</strong>.
          </p>
        </div>

        {/* Faster-Whisper + VAD */}
        <div className="card">
          <h2 style={styles.sectionHeading}>
            <Zap size={22} color="#f59e0b" />
            <span>Faster-Whisper & Silero VAD Multilingual Engine</span>
          </h2>
          <p style={styles.paragraph}>
            Instead of vanilla Whisper, VAANI AI utilizes <strong>Faster-Whisper</strong> powered by <code>CTranslate2</code>:
          </p>
          <ul style={styles.featureList}>
            <li><CheckCircle2 size={16} color="#f59e0b" /> <strong>4x Faster Processing:</strong> Up to 4x faster than standard PyTorch Whisper implementation.</li>
            <li><CheckCircle2 size={16} color="#f59e0b" /> <strong>Silero VAD Filtering:</strong> Automatically detects speech segments and discards silent or background noise intervals, preventing hallucinated loops.</li>
            <li><CheckCircle2 size={16} color="#f59e0b" /> <strong>Native Devanagari & Indian Scripts:</strong> Hindi is transcribed directly in clean Devanagari script (e.g. <em>नमस्ते, वाणी एआई</em>) without phonetic corruption, alongside Gujarati, Bengali, Punjabi, and Marathi.</li>
          </ul>
        </div>

        {/* Free Tier Transparency */}
        <div className="card" style={{ borderLeft: '4px solid #f59e0b' }}>
          <h2 style={styles.sectionHeading}>
            <AlertTriangle size={22} color="#f59e0b" />
            <span>Free-Tier Colab Limitations & Strategy</span>
          </h2>
          <p style={styles.paragraph}>
            Google Colab's free runtime is ephemeral — it does not provide permanent static IP addresses, auto-disconnects after ~60-90 minutes of inactivity, and terminates running tunnels.
          </p>
          <p style={styles.paragraph}>
            <strong>How VAANI AI overcomes this realistically:</strong> Rather than relying on fragile, broken web tunnels, VAANI AI uses an atomic JSON payload exchange. You upload the video, run the Colab cell with 1 click, and drop the resulting lightweight <code>vaani_transcript_*.json</code> back into the app. Django validates and records the subtitles in SQLite, allowing permanent local editing, seeking, and downloads without needing Colab to stay alive!
          </p>
        </div>
      </div>
    </div>
  );
};

const styles = {
  sectionHeading: {
    fontSize: '1.2rem',
    fontWeight: 700,
    color: '#f8fafc',
    display: 'flex',
    alignItems: 'center',
    gap: '0.65rem',
    marginBottom: '0.85rem',
  },
  paragraph: {
    fontSize: '0.875rem',
    color: '#94a3b8',
    lineHeight: 1.6,
    marginBottom: '0.85rem',
  },
  featureList: {
    listStyle: 'none',
    display: 'flex',
    flexDirection: 'column',
    gap: '0.65rem',
    fontSize: '0.85rem',
    color: '#cbd5e1',
    marginTop: '0.5rem',
  },
};

export default AboutPage;
