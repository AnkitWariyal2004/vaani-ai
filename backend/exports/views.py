import json
from pathlib import Path
from django.http import HttpResponse, JsonResponse
from django.shortcuts import get_object_or_404
from django.views import View

from transcriptions.models import TranscriptionJob
from transcriptions.services import TranscriptionService
from .services import ExportService

class ExportDownloadView(View):
    """
    GET /api/transcriptions/{id}/download/?format=srt|txt|json|docx
    Exports transcript in requested format with proper MIME types and headers.
    Uses standard Django View to prevent DRF content negotiation conflicts on ?format=.
    """

    def get(self, request, pk=None, *args, **kwargs):
        job = get_object_or_404(TranscriptionJob, id=pk)

        if not hasattr(job, "transcript"):
            return JsonResponse(
                {"error": "No transcript exists yet for this job. Import or run Colab first."},
                status=404,
            )

        transcript = job.transcript
        export_format = request.GET.get("format", "txt").lower().strip()
        include_timestamps = request.GET.get("timestamps", "true").lower() in ("true", "1")

        base_name = "transcript"
        if job.video and job.video.original_filename:
            base_name = Path(job.video.original_filename).stem

        if export_format == "srt":
            content = TranscriptionService.generate_srt(transcript)
            response = HttpResponse(content, content_type="text/plain; charset=utf-8")
            response["Content-Disposition"] = f'attachment; filename="{base_name}.srt"'
            return response

        elif export_format == "txt":
            content = TranscriptionService.generate_txt(transcript, include_timestamps=include_timestamps)
            response = HttpResponse(content, content_type="text/plain; charset=utf-8")
            response["Content-Disposition"] = f'attachment; filename="{base_name}.txt"'
            return response

        elif export_format == "json":
            data = TranscriptionService.generate_json_export(transcript)
            response = HttpResponse(
                json.dumps(data, ensure_ascii=False, indent=2),
                content_type="application/json; charset=utf-8",
            )
            response["Content-Disposition"] = f'attachment; filename="{base_name}.json"'
            return response

        elif export_format == "docx":
            buffer = ExportService.generate_docx(transcript)
            response = HttpResponse(
                buffer.getvalue(),
                content_type="application/vnd.openxmlformats-officedocument.wordprocessingml.document",
            )
            response["Content-Disposition"] = f'attachment; filename="{base_name}.docx"'
            return response

        else:
            return JsonResponse(
                {
                    "error": f"Unsupported format '{export_format}'. Supported formats: srt, txt, json, docx."
                },
                status=400,
            )
