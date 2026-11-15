import logging
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.response import Response
from django.shortcuts import get_object_or_404
from django.db import transaction

from .models import TranscriptionJob, Transcript, TranscriptSegment
from .serializers import (
    TranscriptionJobSerializer,
    TranscriptSerializer,
    ColabImportSerializer,
    TranscriptUpdateSerializer,
)
from .services import TranscriptionService
from .ai_services import OpenRouterService
from videos.models import UploadedVideo

logger = logging.getLogger(__name__)

class TranscriptionJobViewSet(viewsets.ModelViewSet):
    """
    Manages transcription jobs lifecycle:
    - Creation
    - Colab instruction & payload retrieval
    - Colab JSON import
    - In-browser interactive editing
    """
    queryset = TranscriptionJob.objects.select_related("video", "transcript").all().order_by("-created_at")
    serializer_class = TranscriptionJobSerializer

    def create(self, request, *args, **kwargs):
        """
        POST /api/transcriptions/
        Body: { "video_id": "<uuid>", "target_language": "auto", "model_size": "small" }
        """
        video_id = request.data.get("video_id") or request.data.get("video")
        if not video_id:
            return Response(
                {"error": "Field 'video_id' is required to start a transcription job."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        video = get_object_or_404(UploadedVideo, id=video_id)
        target_language = request.data.get("target_language", "auto")
        model_size = request.data.get("model_size", "small")

        job = TranscriptionJob.objects.create(
            video=video,
            target_language=target_language,
            model_size=model_size,
            status="READY_FOR_COLAB",
        )

        serializer = self.get_serializer(job)
        return Response(
            {
                "message": "Transcription job created. Ready for Google Colab processing.",
                "job": serializer.data,
                "colab_instructions": {
                    "job_id": str(job.id),
                    "video_filename": video.original_filename,
                    "target_language": target_language,
                    "model_size": model_size,
                },
            },
            status=status.HTTP_201_CREATED,
        )

    @action(detail=True, methods=["post"], url_path="import-colab")
    def import_colab(self, request, pk=None):
        """
        POST /api/transcriptions/{id}/import-colab/
        Accepts the JSON output produced by the Google Colab Faster-Whisper notebook.
        Validates structure and stores segments atomically.
        """
        job = self.get_object()
        serializer = ColabImportSerializer(data=request.data)

        if not serializer.is_valid():
            return Response(
                {"error": "Invalid Colab transcription data format.", "details": serializer.errors},
                status=status.HTTP_400_BAD_REQUEST,
            )

        try:
            transcript = TranscriptionService.process_colab_result(job, serializer.validated_data)
            transcript_serializer = TranscriptSerializer(transcript, context={"request": request})
            return Response(
                {
                    "message": "Colab transcript successfully imported and synchronized.",
                    "transcript": transcript_serializer.data,
                },
                status=status.HTTP_200_OK,
            )
        except Exception as exc:
            logger.exception("Failed to process Colab result: %s", exc)
            job.status = "FAILED"
            job.error_message = str(exc)
            job.save()
            return Response(
                {"error": f"Failed to import transcript: {str(exc)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR,
            )

    @action(detail=True, methods=["post"], url_path="webhook")
    def colab_webhook(self, request, pk=None):
        """
        Direct webhook for automated Colab execution.
        Colab script can POST directly to this endpoint with transcription results.
        """
        return self.import_colab(request, pk)

    @action(detail=True, methods=["patch", "put"], url_path="edit")
    def edit_transcript(self, request, pk=None):
        """
        PATCH/PUT /api/transcriptions/{id}/edit/
        Allows updating full_text or individual segment text from the React editor.
        """
        job = self.get_object()
        if not hasattr(job, "transcript"):
            return Response(
                {"error": "No transcript exists yet for this job."},
                status=status.HTTP_404_NOT_FOUND,
            )

        transcript = job.transcript
        serializer = TranscriptUpdateSerializer(data=request.data)
        if not serializer.is_valid():
            return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

        with transaction.atomic():
            if "full_text" in serializer.validated_data:
                transcript.full_text = serializer.validated_data["full_text"]

            if "segments" in serializer.validated_data:
                # Reconstruct segments
                transcript.segments.all().delete()
                new_segments = [
                    TranscriptSegment(
                        transcript=transcript,
                        segment_index=seg["segment_index"],
                        start_time=seg["start_time"],
                        end_time=seg["end_time"],
                        text=seg["text"].strip(),
                    )
                    for seg in serializer.validated_data["segments"]
                ]
                TranscriptSegment.objects.bulk_create(new_segments)

                # If full text wasn't provided, reconstruct from segments
                if "full_text" not in serializer.validated_data:
                    transcript.full_text = " ".join(seg.text for seg in new_segments)

            transcript.save()

        response_serializer = TranscriptSerializer(transcript, context={"request": request})
        return Response(
            {
                "message": "Transcript saved successfully.",
                "transcript": response_serializer.data,
            },
            status=status.HTTP_200_OK,
        )

    @action(detail=True, methods=["post"], url_path="ai-enhance")
    def ai_enhance(self, request, pk=None):
        """
        POST /api/transcriptions/{id}/ai-enhance/
        Uses OpenRouter free LLM (gemini-2.0-flash-exp:free / llama-3.3-70b:free)
        to polish punctuation, spellings, and Devanagari grammar without affecting timing.
        """
        job = self.get_object()
        if not hasattr(job, "transcript"):
            return Response({"error": "No transcript exists yet for this job."}, status=status.HTTP_404_NOT_FOUND)

        api_key = request.data.get("openrouter_key") or request.headers.get("X-OpenRouter-Key")
        lang = job.transcript.detected_language or job.target_language or "hi"
        segments = [
            {"segment_index": s.segment_index, "start_time": s.start_time, "end_time": s.end_time, "text": s.text}
            for s in job.transcript.segments.all().order_by("segment_index", "start_time")
        ]

        try:
            polished_segments = OpenRouterService.polish_and_punctuate(segments, language=lang, api_key=api_key)
            with transaction.atomic():
                job.transcript.segments.all().delete()
                new_segs = [
                    TranscriptSegment(
                        transcript=job.transcript,
                        segment_index=s["segment_index"],
                        start_time=s["start_time"],
                        end_time=s["end_time"],
                        text=s["text"]
                    )
                    for s in polished_segments
                ]
                TranscriptSegment.objects.bulk_create(new_segs)
                job.transcript.full_text = " ".join(s.text for s in new_segs)
                job.transcript.save()

            serializer = TranscriptSerializer(job.transcript, context={"request": request})
            return Response({"message": "Transcript polished by OpenRouter AI.", "transcript": serializer.data})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="ai-translate")
    def ai_translate(self, request, pk=None):
        """
        POST /api/transcriptions/{id}/ai-translate/
        Uses OpenRouter free model to translate subtitle segments to another language.
        """
        job = self.get_object()
        if not hasattr(job, "transcript"):
            return Response({"error": "No transcript exists yet for this job."}, status=status.HTTP_404_NOT_FOUND)

        target_lang = request.data.get("target_language", "en")
        api_key = request.data.get("openrouter_key") or request.headers.get("X-OpenRouter-Key")
        segments = [
            {"segment_index": s.segment_index, "start_time": s.start_time, "end_time": s.end_time, "text": s.text}
            for s in job.transcript.segments.all().order_by("segment_index", "start_time")
        ]

        try:
            translated_segments = OpenRouterService.translate_segments(segments, target_language=target_lang, api_key=api_key)
            with transaction.atomic():
                job.transcript.segments.all().delete()
                new_segs = [
                    TranscriptSegment(
                        transcript=job.transcript,
                        segment_index=s["segment_index"],
                        start_time=s["start_time"],
                        end_time=s["end_time"],
                        text=s["text"]
                    )
                    for s in translated_segments
                ]
                TranscriptSegment.objects.bulk_create(new_segs)
                job.transcript.full_text = " ".join(s.text for s in new_segs)
                job.transcript.detected_language = target_lang
                job.transcript.save()

            serializer = TranscriptSerializer(job.transcript, context={"request": request})
            return Response({"message": f"Translated to {target_lang} via OpenRouter AI.", "transcript": serializer.data})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)

    @action(detail=True, methods=["post"], url_path="ai-summarize")
    def ai_summarize(self, request, pk=None):
        """
        POST /api/transcriptions/{id}/ai-summarize/
        Generates executive summary, bullet points, and key topics using OpenRouter free models.
        """
        job = self.get_object()
        if not hasattr(job, "transcript"):
            return Response({"error": "No transcript exists yet for this job."}, status=status.HTTP_404_NOT_FOUND)

        api_key = request.data.get("openrouter_key") or request.headers.get("X-OpenRouter-Key")
        lang = job.transcript.detected_language or job.target_language or "auto"
        text = job.transcript.full_text

        try:
            summary_data = OpenRouterService.generate_summary(text, language=lang, api_key=api_key)
            return Response({"summary": summary_data})
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_400_BAD_REQUEST)
