import json
from typing import Dict, Any, List
from django.db import transaction
from .models import TranscriptionJob, Transcript, TranscriptSegment

class TranscriptionService:
    """
    Handles transcription imports from Google Colab, segment parsing,
    and format conversions.
    """

    @classmethod
    @transaction.atomic
    def process_colab_result(cls, job: TranscriptionJob, data: Dict[str, Any]) -> Transcript:
        """
        Parses Colab output JSON payload and stores Transcript + TranscriptSegments.
        Data format expected from Colab:
        {
            "detected_language": "hi",
            "language_probability": 0.98,
            "duration": 42.5,
            "text": "Full text...",
            "segments": [
                {
                    "id": 0,
                    "start": 0.0,
                    "end": 2.5,
                    "text": "नमस्ते दोस्तों"
                },
                ...
            ]
        }
        """
        detected_language = data.get("detected_language") or data.get("language") or "auto"
        language_prob = data.get("language_probability")
        duration = data.get("duration")
        raw_segments = data.get("segments", [])
        
        # If full text isn't provided, reconstruct from segments
        full_text = data.get("text")
        if not full_text and raw_segments:
            full_text = " ".join(seg.get("text", "").strip() for seg in raw_segments if seg.get("text"))
        elif not full_text:
            full_text = ""

        # Update or create Transcript
        transcript, _ = Transcript.objects.update_or_create(
            job=job,
            defaults={
                "detected_language": detected_language,
                "language_probability": language_prob,
                "full_text": full_text.strip(),
                "duration": duration,
            },
        )

        # Clear any prior segments and recreate from payload
        transcript.segments.all().delete()

        segment_objects = []
        for idx, seg in enumerate(raw_segments):
            start = float(seg.get("start", 0.0))
            end = float(seg.get("end", start))
            text = str(seg.get("text", "")).strip()
            
            segment_objects.append(
                TranscriptSegment(
                    transcript=transcript,
                    segment_index=seg.get("id", idx),
                    start_time=start,
                    end_time=end,
                    text=text,
                )
            )

        if segment_objects:
            TranscriptSegment.objects.bulk_create(segment_objects)

        # Mark job as COMPLETED
        job.status = "COMPLETED"
        job.error_message = None
        job.save()

        return transcript

    @staticmethod
    def format_srt_time(seconds: float) -> str:
        """Format seconds into SRT timestamp format: HH:MM:SS,mmm"""
        if seconds is None or seconds < 0:
            seconds = 0.0
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = int(seconds % 60)
        millis = int(round((seconds - int(seconds)) * 1000))
        if millis >= 1000:
            millis = 999
        return f"{hours:02d}:{minutes:02d}:{secs:02d},{millis:03d}"

    @classmethod
    def generate_srt(cls, transcript: Transcript) -> str:
        """Generates standard SubRip (.srt) subtitle string with UTF-8 support."""
        segments = transcript.segments.all().order_by("segment_index", "start_time")
        srt_lines = []

        for index, seg in enumerate(segments, start=1):
            start_fmt = cls.format_srt_time(seg.start_time)
            end_fmt = cls.format_srt_time(seg.end_time)
            text = seg.text.strip()
            srt_lines.append(f"{index}\n{start_fmt} --> {end_fmt}\n{text}\n")

        return "\n".join(srt_lines)

    @classmethod
    def generate_txt(cls, transcript: Transcript, include_timestamps: bool = False) -> str:
        """Generates clean plain text transcript."""
        if not include_timestamps:
            return transcript.full_text or ""

        segments = transcript.segments.all().order_by("segment_index", "start_time")
        lines = []
        for seg in segments:
            start_fmt = cls.format_srt_time(seg.start_time).replace(",", ".")
            end_fmt = cls.format_srt_time(seg.end_time).replace(",", ".")
            lines.append(f"[{start_fmt} - {end_fmt}] {seg.text.strip()}")
        return "\n".join(lines)

    @classmethod
    def generate_json_export(cls, transcript: Transcript) -> Dict[str, Any]:
        """Generates structured JSON transcript export."""
        segments = transcript.segments.all().order_by("segment_index", "start_time")
        return {
            "job_id": str(transcript.job.id),
            "video_filename": transcript.job.video.original_filename,
            "detected_language": transcript.detected_language,
            "language_probability": transcript.language_probability,
            "duration": transcript.duration,
            "full_text": transcript.full_text,
            "segments": [
                {
                    "id": seg.segment_index,
                    "start": seg.start_time,
                    "end": seg.end_time,
                    "text": seg.text,
                }
                for seg in segments
            ],
        }
