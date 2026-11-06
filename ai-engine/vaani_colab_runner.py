"""
VAANI AI — Google Colab Transcriber Engine (Python Script Runner)
Optimized for Google Colab Free Tier (T4 GPU or CPU INT8 Fallback)
Zero-Cost Multilingual Speech Recognition using Faster-Whisper & Silero VAD
"""

import os
import sys
import json
import subprocess
from pathlib import Path

def check_hardware():
    """Detects if CUDA GPU is available or falls back to CPU INT8."""
    try:
        import torch
        if torch.cuda.is_available():
            device_name = torch.cuda.get_device_name(0)
            print(f"[VAANI AI] CUDA GPU Detected: {device_name} (Using device='cuda', compute_type='float16')")
            return "cuda", "float16"
    except ImportError:
        pass
    print("[VAANI AI] Running on CPU (Using device='cpu', compute_type='int8' for low resource usage)")
    return "cpu", "int8"

def extract_audio_ffmpeg(video_path: str, output_wav_path: str = "extracted_audio.wav") -> str:
    """Extracts 16kHz mono audio stream from any video file (MP4, MKV, MOV, AVI, WEBM)."""
    print(f"[VAANI AI] Extracting 16kHz mono audio from {video_path} using FFmpeg...")
    cmd = [
        "ffmpeg", "-y",
        "-i", video_path,
        "-vn",
        "-acodec", "pcm_s16le",
        "-ar", "16000",
        "-ac", "1",
        output_wav_path
    ]
    result = subprocess.run(cmd, stdout=subprocess.PIPE, stderr=subprocess.PIPE)
    if result.returncode != 0:
        raise RuntimeError(f"FFmpeg audio extraction failed: {result.stderr.decode('utf-8', errors='ignore')}")
    print(f"[VAANI AI] Audio extracted successfully to: {output_wav_path}")
    return output_wav_path

def format_srt_timestamp(seconds: float) -> str:
    """Formats seconds to SRT timestamp: HH:MM:SS,mmm"""
    hours = int(seconds // 3600)
    minutes = int((seconds % 3600) // 60)
    secs = int(seconds % 60)
    millis = int(round((seconds - int(seconds)) * 1000))
    if millis >= 1000:
        millis = 999
    return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

def transcribe_video(
    video_path: str,
    job_id: str = "default_job",
    model_size: str = "small",
    target_language: str = "auto",
    output_dir: str = "./vaani_output"
) -> dict:
    """
    Main transcription pipeline:
    1. Extracts audio via FFmpeg
    2. Loads faster-whisper with VAD filter enabled
    3. Detects language (Hindi, English, Gujarati, etc.)
    4. Generates segment timestamps and text
    5. Saves output in JSON, SRT, and TXT formats
    """
    from faster_whisper import WhisperModel

    os.makedirs(output_dir, exist_ok=True)
    device, compute_type = check_hardware()

    # 1. Extract Audio
    wav_path = os.path.join(output_dir, f"{job_id}_temp.wav")
    extract_audio_ffmpeg(video_path, wav_path)

    # 2. Initialize Whisper Model
    print(f"[VAANI AI] Initializing Faster-Whisper model ('{model_size}', {device}, {compute_type})...")
    model = WhisperModel(model_size, device=device, compute_type=compute_type)

    # 3. Transcribe with VAD Filtering
    print(f"[VAANI AI] Transcribing audio with Silero VAD (Target language: {target_language})...")
    lang_param = None if (not target_language or target_language.lower() == "auto") else target_language

    segments_generator, info = model.transcribe(
        wav_path,
        beam_size=5,
        language=lang_param,
        vad_filter=True,
        vad_parameters=dict(min_silence_duration_ms=500),
    )

    detected_lang = info.language
    lang_prob = round(info.language_probability, 4)
    duration = round(info.duration, 2)
    print(f"[VAANI AI] Language Detected: '{detected_lang}' (Confidence: {lang_prob * 100:.1f}%), Duration: {duration}s")

    # 4. Collect segments
    segments_list = []
    full_text_pieces = []
    srt_lines = []

    for idx, seg in enumerate(segments_generator):
        seg_dict = {
            "id": idx,
            "start": round(seg.start, 2),
            "end": round(seg.end, 2),
            "text": seg.text.strip(),
        }
        segments_list.append(seg_dict)
        full_text_pieces.append(seg.text.strip())

        # Build SRT entry
        start_srt = format_srt_timestamp(seg.start)
        end_srt = format_srt_timestamp(seg.end)
        srt_lines.append(f"{idx + 1}\n{start_srt} --> {end_srt}\n{seg.text.strip()}\n")

    full_text = " ".join(full_text_pieces)

    # Clean up temp WAV
    if os.path.exists(wav_path):
        os.remove(wav_path)

    # 5. Build structured JSON payload
    result_payload = {
        "job_id": job_id,
        "detected_language": detected_lang,
        "language_probability": lang_prob,
        "duration": duration,
        "text": full_text,
        "segments": segments_list,
    }

    # Save outputs
    json_path = os.path.join(output_dir, f"vaani_transcript_{job_id}.json")
    srt_path = os.path.join(output_dir, f"vaani_transcript_{job_id}.srt")
    txt_path = os.path.join(output_dir, f"vaani_transcript_{job_id}.txt")

    with open(json_path, "w", encoding="utf-8") as f:
        json.dump(result_payload, f, ensure_ascii=False, indent=2)

    with open(srt_path, "w", encoding="utf-8") as f:
        f.write("\n".join(srt_lines))

    with open(txt_path, "w", encoding="utf-8") as f:
        f.write(full_text)

    print(f"\n[VAANI AI] Transcription complete!")
    print(f"[VAANI AI] JSON Export: {json_path}")
    print(f"[VAANI AI] SRT Subtitles: {srt_path}")
    print(f"[VAANI AI] Plain Text: {txt_path}")

    return result_payload

if __name__ == "__main__":
    if len(sys.argv) < 2:
        print("Usage: python vaani_colab_runner.py <path_to_video> [job_id] [model_size] [target_language]")
        sys.exit(1)

    video_input = sys.argv[1]
    job_id_input = sys.argv[2] if len(sys.argv) > 2 else "local_test"
    model_size_input = sys.argv[3] if len(sys.argv) > 3 else "small"
    lang_input = sys.argv[4] if len(sys.argv) > 4 else "auto"

    transcribe_video(
        video_path=video_input,
        job_id=job_id_input,
        model_size=model_size_input,
        target_language=lang_input
    )
