import axios from 'axios';

const API_BASE = '/api';

const client = axios.create({
  baseURL: API_BASE,
  timeout: 60000,
});

export const api = {
  // System Health
  getHealth: async () => {
    const res = await client.get('/health/');
    return res.data;
  },

  // Videos
  uploadVideo: async (file, onProgress) => {
    const formData = new FormData();
    formData.append('file', file);

    const res = await client.post('/videos/upload/', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
      onUploadProgress: (progressEvent) => {
        if (onProgress && progressEvent.total) {
          const percent = Math.round((progressEvent.loaded * 100) / progressEvent.total);
          onProgress(percent);
        }
      },
    });
    return res.data;
  },

  getVideos: async () => {
    const res = await client.get('/videos/');
    return res.data;
  },

  getVideo: async (id) => {
    const res = await client.get(`/videos/${id}/`);
    return res.data;
  },

  deleteVideo: async (id) => {
    const res = await client.delete(`/videos/${id}/`);
    return res.data;
  },

  // Transcriptions
  createJob: async (videoId, targetLanguage = 'auto', modelSize = 'small') => {
    const res = await client.post('/transcriptions/', {
      video_id: videoId,
      target_language: targetLanguage,
      model_size: modelSize,
    });
    return res.data;
  },

  getJobs: async () => {
    const res = await client.get('/transcriptions/');
    return res.data;
  },

  getJob: async (id) => {
    const res = await client.get(`/transcriptions/${id}/`);
    return res.data;
  },

  importColabResult: async (jobId, colabPayload) => {
    const res = await client.post(`/transcriptions/${jobId}/import-colab/`, colabPayload);
    return res.data;
  },

  editTranscript: async (jobId, updateData) => {
    const res = await client.patch(`/transcriptions/${jobId}/edit/`, updateData);
    return res.data;
  },

  deleteJob: async (id) => {
    const res = await client.delete(`/transcriptions/${id}/`);
    return res.data;
  },

  // Exports
  getDownloadUrl: (jobId, format = 'srt', timestamps = true) => {
    return `${API_BASE}/transcriptions/${jobId}/download/?format=${format}&timestamps=${timestamps}`;
  },
};

export default api;
