# 🎙️ VAANI AI — Multilingual AI Video Transcription System

> **Strictly ₹0 Budget • Zero Local ML Load • 100% Free Google Colab T4 GPU Engine**  
> Specially engineered to run effortlessly on low-spec laptops (**Intel i3, 8 GB RAM**) without local model inference or freezing.

---

## 🌟 Overview & Architecture

**VAANI AI** is a production-style, full-stack video transcription application supporting **Hindi in Devanagari**, **English**, **Gujarati**, **Punjabi**, **Bengali**, and **90+ Whisper languages**.

### Why Zero-Budget & Zero-Local-Inference?
- **Client Laptop (Intel i3 / 8 GB RAM):** Running AI models like Whisper locally consumes 4–12 GB of RAM, causing thermal throttling, system hanging, and OS crashes.
- **The VAANI AI Solution:** The local laptop only runs a lightweight **React** dashboard and a minimal **Django + SQLite** backend (under 50 MB total memory). Heavy acoustic speech recognition and Silero VAD filtering run entirely on **Google Colab's Free Tier NVIDIA T4 GPU (16 GB VRAM)**.
- **₹0 Cost:** No OpenAI API, no paid cloud servers, no paid GPUs, and no paid hosting.

```
+-------------------------------------------------------------------------------+
|                             CLIENT LAPTOP (₹0)                                |
|                                                                               |
|   +-----------------------+                    +--------------------------+   |
|   |   React.js + Vite     | <==== HTTP =====>  |   Django + DRF + SQLite  |   |
|   |   - Interactive UI    |                    |   - File Validation      |   |
|   |   - Video Player      |                    |   - Job Management       |   |
|   |   - Transcript Editor |                    |   - Auto File Cleanup    |   |
|   |   - Subtitle Preview  |                    |   - Multi-format Export  |   |
|   +-----------------------+                    +--------------------------+   |
+-------------------------------------------------------------^-----------------+
                                                              |
                                  Atomic JSON Result Payload  |
                                  (No Paid Tunneling Needed)  |
                                                              v
+-------------------------------------------------------------------------------+
|                   GOOGLE COLAB FREE RUNTIME (T4 GPU - ₹0)                     |
|                                                                               |
|   +-----------------------------------------------------------------------+   |
|   |   vaani_transcriber.ipynb / vaani_colab_runner.py                     |   |
|   |   - FFmpeg 16kHz mono audio extraction                                |   |
|   |   - Faster-Whisper (CTranslate2, 4x faster)                           |   |
|   |   - Silero VAD silence filtering                                      |   |
|   |   - Multilingual Devanagari Hindi / Regional language tokenization    |   |
|   |   - Precision timestamps (SRT / TXT / JSON)                           |   |
|   +-----------------------------------------------------------------------+   |
+-------------------------------------------------------------------------------+
```

---

## 🚀 Key Features

1. **Drag-and-Drop Video Upload:** Validates file size (up to 500 MB) and formats (`.mp4`, `.mov`, `.mkv`, `.avi`, `.webm`).
2. **Native Multilingual Speech Recognition:**
   - Hindi (Devanagari script: हिन्दी)
   - English
   - Gujarati (ગુજરાતી)
   - Punjabi (ਪੰਜਾਬੀ)
   - Bengali (বাংলা)
   - Marathi (मराठी), Tamil, Telugu, and 90+ languages.
3. **Dual Colab Integration Workflows:**
   - **Mode 1 (Primary / Zero-Friction):** Atomic JSON file download from Colab and 1-click import into React. Immune to Colab connection timeouts.
   - **Mode 2 (Automated Webhook):** Optional direct HTTP callback from Colab to Django if a tunnel (e.g., ngrok/localtunnel) is provided.
4. **Interactive Video & Transcript Workspace:**
   - HTML5 video player with speed controls (0.75x to 2x).
   - Real-time subtitle overlay rendered directly over the video.
   - Clickable timestamp timeline — click any segment to jump playback to that second!
   - Inline segment text editor with instant "Save Changes" API persistence.
   - Search filter to instantly highlight talking segments.
5. **Multi-Format Exports:**
   - **SRT (.srt):** Formatted SubRip subtitles with `HH:MM:SS,mmm` timestamps.
   - **DOCX (.docx):** Styled Microsoft Word report with metadata callout table and timestamped breakdown.
   - **TXT (.txt):** Plain text with optional timestamps.
   - **JSON (.json):** Machine-readable structured payload with language confidence score.
6. **Automatic Disk Cleanup:** Deleting a job or video automatically removes physical files from the media directory.

---

## 📁 Project Directory Structure

```
vaani-ai/
├── backend/
│   ├── manage.py
│   ├── requirements.txt
│   ├── config/
│   │   ├── settings.py           # CORS, DRF, Media roots, upload limits
│   │   ├── urls.py               # API routing & health check
│   │   ├── wsgi.py
│   │   └── asgi.py
│   ├── videos/
│   │   ├── models.py             # UploadedVideo with auto-cleanup signal
│   │   ├── views.py              # Video upload & list endpoints
│   │   ├── serializers.py        # File validation & formatted size
│   │   ├── validators.py         # Format & size limit checks
│   │   ├── urls.py
│   │   └── tests.py              # File upload & validation unit tests
│   ├── transcriptions/
│   │   ├── models.py             # TranscriptionJob, Transcript, TranscriptSegment
│   │   ├── views.py              # Colab import, webhook, and editor
│   │   ├── serializers.py        # Segment serializers & Colab import schema
│   │   ├── services.py           # VAD segment parsing, SRT/TXT formatting
│   │   ├── urls.py
│   │   └── tests.py              # Job creation & E2E workflow tests
│   └── exports/
│       ├── services.py           # python-docx & UTF-8 formatting
│       ├── views.py              # ExportDownloadView (SRT, DOCX, TXT, JSON)
│       ├── urls.py
│       └── tests.py              # Export download unit tests
├── frontend/
│   ├── index.html
│   ├── vite.config.js            # Vite config with React plugin & proxy
│   ├── package.json
│   └── src/
│       ├── main.jsx
│       ├── App.jsx
│       ├── index.css             # Obsidian & slate design system
│       ├── services/
│       │   └── api.js            # Centralized Axios API client
│       ├── components/
│       │   ├── Sidebar.jsx       # Navigation & health status
│       │   ├── Dropzone.jsx      # Drag-and-drop file upload with progress
│       │   ├── VideoPlayer.jsx   # Video player with dynamic subtitles & seeking
│       │   ├── TranscriptEditor.jsx # Segment list, search & editing
│       │   ├── SegmentItem.jsx   # Individual segment card with timestamps
│       │   ├── ExportModal.jsx   # SRT, DOCX, TXT, JSON download modal
│       │   ├── ColabGuideModal.jsx # Colab guide & 1-click Demo importer
│       │   └── StatusBadge.jsx   # Color-coded job states
│       └── pages/
│           ├── Dashboard.jsx     # System metrics & recent jobs table
│           ├── UploadPage.jsx    # Video upload & language selection
│           ├── WorkspacePage.jsx # Split video/editor workspace
│           ├── HistoryPage.jsx   # Full transcript history & management
│           └── AboutPage.jsx     # Zero-budget architecture guide
├── ai-engine/
│   ├── vaani_transcriber.ipynb   # Interactive Google Colab notebook
│   ├── vaani_colab_runner.py     # Standalone Faster-Whisper + VAD Python script
│   └── sample_transcript_output.json # Sample Hindi transcript for instant testing
└── README.md
```

---

## 🛠️ Step-by-Step Setup Instructions (Windows)

### Prerequisites
- Python 3.11+
- Node.js 18+ and npm

### 1. Backend Setup (Django)

Open a PowerShell terminal in the project directory:

```powershell
cd d:\GenAI\vaani-ai\backend

# Activate existing virtual environment (or create if not present)
.\venv\Scripts\Activate.ps1

# Verify dependencies are installed
pip install -r requirements.txt

# Run migrations
python manage.py migrate

# Run all 11 unit & E2E integration tests
python manage.py test

# Start the Django server
python manage.py runserver 8000
```

The Django server will run at: `http://127.0.0.1:8000`

---

### 2. Frontend Setup (React + Vite)

Open a second PowerShell terminal:

```powershell
cd d:\GenAI\vaani-ai\frontend

# Install dependencies (already cached)
npm install

# Build production bundle
npm run build

# Start the development server
npm run dev
```

Open your browser at: `http://localhost:5173`

---

### 3. AI Engine Setup (Google Colab Free Tier)

1. Open [Google Colab](https://colab.research.google.com/).
2. Click **File > Upload Notebook** and select `d:\GenAI\vaani-ai\ai-engine\vaani_transcriber.ipynb`.
3. In Colab's menu, select **Runtime > Change runtime type > T4 GPU**.
4. Run the cells in order:
   - Cell 1: Checks GPU (`!nvidia-smi`).
   - Cell 2: Installs `faster-whisper`, `ffmpeg-python`, and `ffmpeg`.
   - Cell 3: Sets `JOB_ID` (copied from the VAANI AI dashboard).
   - Cell 4: Uploads your video file.
   - Cell 5: Extracts 16kHz mono audio and runs speech recognition with Silero VAD.
   - Cell 6: Automatically downloads `vaani_transcript_<job_id>.json` to your laptop.
5. In the VAANI AI web app, open your job in the **Workspace** and click **Colab Engine & Import**. Drop the JSON file into the modal (or click **Try Demo Hindi Transcript** for an instant preview).

---

## 📡 REST API Documentation

| Method | Endpoint | Description |
|---|---|---|
| `GET` | `/api/health/` | Server health status & engine configuration |
| `POST` | `/api/videos/upload/` | Uploads and validates video (`multipart/form-data`) |
| `GET` | `/api/videos/` | Lists uploaded video metadata |
| `DELETE` | `/api/videos/{id}/` | Deletes video and removes file from disk |
| `POST` | `/api/transcriptions/` | Initializes a transcription job (`video_id`, `target_language`, `model_size`) |
| `GET` | `/api/transcriptions/{id}/` | Retrieves job status, video info, transcript, and segments |
| `POST` | `/api/transcriptions/{id}/import-colab/` | Imports Colab JSON result payload |
| `POST` | `/api/transcriptions/{id}/webhook/` | Optional direct webhook for Colab automated callback |
| `PATCH` | `/api/transcriptions/{id}/edit/` | Updates transcript full text or individual segments |
| `GET` | `/api/transcriptions/{id}/download/?format=srt` | Downloads SubRip subtitle file (.srt) |
| `GET` | `/api/transcriptions/{id}/download/?format=docx` | Downloads Microsoft Word document (.docx) |
| `GET` | `/api/transcriptions/{id}/download/?format=txt` | Downloads plain text transcript (.txt) |
| `GET` | `/api/transcriptions/{id}/download/?format=json` | Downloads structured JSON transcript (.json) |
| `DELETE` | `/api/transcriptions/{id}/` | Deletes transcription job and cascading segments |

---

## 🧪 Testing Results

All 11 unit and end-to-end integration tests pass cleanly:

```powershell
python manage.py test
Creating test database for alias 'default'...
...........
----------------------------------------------------------------------
Ran 11 tests in 0.558s

OK
Destroying test database for alias 'default'...
```

Covering:
- MP4, MOV, MKV, AVI, WEBM upload validation and unsupported extension rejection.
- Database cascading relations and physical file disk cleanup on record deletion.
- Multilingual Devanagari Hindi string preservation across DB boundaries.
- SRT timestamp generation (`HH:MM:SS,mmm`).
- Word document (.docx) binary streaming.
- Complete end-to-end user workflow: Upload ➔ Job Init ➔ Colab Result Import ➔ Detail Serializing ➔ Inline Edit ➔ Multi-format Export.

---

## 💡 Free-Tier Colab Limitations & Mitigations

| Limitation | Impact | VAANI AI Mitigation |
|---|---|---|
| **Ephemeral Session** | Colab disconnects after 60-90 min idle | VAANI AI does not rely on permanent Colab uptime. Once the JSON result is imported into Django SQLite, all editing and exports work forever locally. |
| **No Static IP** | Cannot host a persistent API on Colab | The system uses an atomic JSON payload exchange rather than bidirectional long-lived connections. |
| **Daily GPU Quota** | Colab limits continuous hours on GPU | Faster-Whisper (CTranslate2) transcribes a 10-minute video in under 45 seconds on a T4 GPU, using less than 1% of the daily free quota. |

---

**Developed with ❤️ for ₹0 budget creators, students, and engineers.**
