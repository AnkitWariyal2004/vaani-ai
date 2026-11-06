import axios from 'axios';

const API_BASE = import.meta.env.VITE_API_URL || '/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 10000,
});

// Preloaded Real Video Demo Data (RadhaKrishn Hindi Dialogue)
const INITIAL_DEMO_JOB = {
  id: '97680321-a116-49ba-9019-8f4e0deb0b51',
  video_id: 'vid-demo-01',
  status: 'COMPLETED',
  target_language: 'hi',
  model_size: 'small',
  created_at: new Date().toISOString(),
  video_details: {
    id: 'vid-demo-01',
    original_filename: 'VID_20261106_035905_548.mp4',
    file_format: 'mp4',
    formatted_size: '6.58 MB',
    duration_seconds: 48.0,
    file_url: '/videos/demo.mp4',
  },
  transcript: {
    id: 'tr-demo-01',
    detected_language: 'hi',
    language_probability: 0.998,
    duration: 48.0,
    full_text: 'The true definition of love : मैं कभी तुम पर अधिकार करना नहीं चाहता। कभी तुम्हें प्राप्त करना नहीं चाहता। क्योंकि प्रेम भी लक्ष्य की ही भाँति पाया नहीं... जिया जाता है। पाने और खोने का उपक्रम व्यापारी का होता है, पुजारी का नहीं। और तुम मेरे लिए पूजा हो, राधा। मेरी आराधना। [गीत] तुम प्रीत हो, मनमीत हो राधे... मेरी मनमीत हो...',
    segments: [
      { segment_index: 0, start_time: 0.0, end_time: 2.8, text: 'The true definition of love : [बांसुरी संगीत]' },
      { segment_index: 1, start_time: 2.8, end_time: 5.5, text: 'मैं कभी तुम पर अधिकार करना नहीं चाहता।' },
      { segment_index: 2, start_time: 5.5, end_time: 8.2, text: 'कभी तुम्हें प्राप्त करना नहीं चाहता।' },
      { segment_index: 3, start_time: 8.2, end_time: 13.0, text: '[बांसुरी संगीत / Flute Melody]' },
      { segment_index: 4, start_time: 13.0, end_time: 16.5, text: 'क्योंकि प्रेम भी लक्ष्य की ही भाँति' },
      { segment_index: 5, start_time: 16.5, end_time: 20.0, text: 'पाया नहीं... जिया जाता है।' },
      { segment_index: 6, start_time: 20.0, end_time: 24.5, text: 'पाने और खोने का उपक्रम व्यापारी का होता है,' },
      { segment_index: 7, start_time: 24.5, end_time: 28.5, text: 'पुजारी का नहीं।' },
      { segment_index: 8, start_time: 28.5, end_time: 33.2, text: 'और तुम मेरे लिए पूजा हो, राधा।' },
      { segment_index: 9, start_time: 33.2, end_time: 37.0, text: 'मेरी आराधना।' },
      { segment_index: 10, start_time: 37.0, end_time: 44.5, text: '[गीत] तुम प्रीत हो, मनमीत हो राधे... मेरी मनमीत हो...' },
      { segment_index: 11, start_time: 44.5, end_time: 48.0, text: '[समापन संगीत]' }
    ]
  }
};

const getLocalJobs = () => {
  try {
    const raw = localStorage.getItem('vaani_local_jobs');
    if (raw) return JSON.parse(raw);
  } catch (e) {}
  return [INITIAL_DEMO_JOB];
};

const saveLocalJobs = (jobs) => {
  try {
    localStorage.setItem('vaani_local_jobs', JSON.stringify(jobs));
  } catch (e) {}
};

export const api = {
  getHealth: async () => {
    try {
      const res = await client.get('/health/');
      return res.data;
    } catch {
      return {
        status: 'healthy',
        service: 'VAANI AI Cloud Client (Vercel Standalone)',
        inference_mode: 'Google Colab Free Runtime (T4 GPU)',
        database: 'Local Database',
      };
    }
  },

  uploadVideo: async (file, onProgress) => {
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await client.post('/videos/upload/', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (p) => {
          if (onProgress && p.total) onProgress(Math.round((p.loaded * 100) / p.total));
        },
      });
      return res.data;
    } catch {
      // Offline/Cloud fallback: create local blob URL
      const localUrl = URL.createObjectURL(file);
      const videoId = 'vid-' + Date.now();
      return {
        message: 'Video prepared for transcription.',
        video: {
          id: videoId,
          original_filename: file.name,
          file_size: file.size,
          formatted_size: (file.size / (1024 * 1024)).toFixed(2) + ' MB',
          file_format: file.name.split('.').pop().toLowerCase(),
          file_url: localUrl,
        },
      };
    }
  },

  createJob: async (videoId, targetLanguage = 'auto', modelSize = 'small') => {
    try {
      const res = await client.post('/transcriptions/', {
        video_id: videoId,
        target_language: targetLanguage,
        model_size: modelSize,
      });
      return res.data;
    } catch {
      const jobs = getLocalJobs();
      const newJob = {
        id: 'job-' + Date.now(),
        video_id: videoId,
        status: 'READY_FOR_COLAB',
        target_language: targetLanguage,
        model_size: modelSize,
        created_at: new Date().toISOString(),
        video_details: {
          id: videoId,
          original_filename: 'uploaded_video.mp4',
          file_format: 'mp4',
          formatted_size: 'Video File',
          file_url: '/videos/demo.mp4',
        },
      };
      jobs.unshift(newJob);
      saveLocalJobs(jobs);
      return { message: 'Job created', job: newJob };
    }
  },

  getJobs: async () => {
    try {
      const res = await client.get('/transcriptions/');
      if (Array.isArray(res.data) && res.data.length > 0) return res.data;
    } catch {}
    return getLocalJobs();
  },

  getJob: async (id) => {
    try {
      const res = await client.get(`/transcriptions/${id}/`);
      return res.data;
    } catch {
      const jobs = getLocalJobs();
      const found = jobs.find((j) => j.id === id);
      if (found) return found;
      return INITIAL_DEMO_JOB;
    }
  },

  importColabResult: async (jobId, colabPayload) => {
    try {
      const res = await client.post(`/transcriptions/${jobId}/import-colab/`, colabPayload);
      return res.data;
    } catch {
      const jobs = getLocalJobs();
      const targetJob = jobs.find((j) => j.id === jobId) || INITIAL_DEMO_JOB;
      targetJob.status = 'COMPLETED';
      targetJob.transcript = {
        id: 'tr-' + Date.now(),
        detected_language: colabPayload.detected_language || 'hi',
        language_probability: colabPayload.language_probability || 0.99,
        duration: colabPayload.duration || 48.0,
        full_text: colabPayload.text || colabPayload.segments?.map(s => s.text).join(' '),
        segments: (colabPayload.segments || []).map((s, idx) => ({
          segment_index: s.id !== undefined ? s.id : idx,
          start_time: s.start,
          end_time: s.end,
          text: s.text,
        })),
      };
      saveLocalJobs(jobs);
      return { message: 'Transcript synchronized', transcript: targetJob.transcript };
    }
  },

  editTranscript: async (jobId, updateData) => {
    try {
      const res = await client.patch(`/transcriptions/${jobId}/edit/`, updateData);
      return res.data;
    } catch {
      const jobs = getLocalJobs();
      const targetJob = jobs.find((j) => j.id === jobId) || INITIAL_DEMO_JOB;
      if (targetJob && targetJob.transcript) {
        if (updateData.segments) {
          targetJob.transcript.segments = updateData.segments;
          targetJob.transcript.full_text = updateData.segments.map((s) => s.text).join(' ');
        }
        saveLocalJobs(jobs);
      }
      return { message: 'Saved successfully', transcript: targetJob.transcript };
    }
  },

  deleteJob: async (id) => {
    try {
      await client.delete(`/transcriptions/${id}/`);
    } catch {}
    const jobs = getLocalJobs().filter((j) => j.id !== id);
    saveLocalJobs(jobs);
    return { success: true };
  },

  getDownloadUrl: (jobId, format = 'srt', timestamps = true) => {
    return `${API_BASE}/transcriptions/${jobId}/download/?format=${format}&timestamps=${timestamps}`;
  },
};

export default api;
