from django.contrib import admin
from django.urls import path, include
from django.conf import settings
from django.conf.urls.static import static
from django.http import JsonResponse
from exports.views import ExportDownloadView

def health_check(request):
    """
    GET /api/health/
    Verifies backend server health and low-spec footprint.
    """
    return JsonResponse({
        "status": "healthy",
        "service": "VAANI AI Backend",
        "version": "1.0.0",
        "inference_mode": "Google Colab Free Runtime (Detached Zero-Local GPU)",
        "database": "SQLite",
    })

urlpatterns = [
    path("admin/", admin.site.urls),
    path("api/health/", health_check, name="health-check"),
    path("api/videos/", include("videos.urls")),
    path("api/transcriptions/<uuid:pk>/download/", ExportDownloadView.as_view(), name="transcription-download"),
    path("api/transcriptions/", include("transcriptions.urls")),
    path("api/exports/", include("exports.urls")),
]

if settings.DEBUG:
    urlpatterns += static(settings.MEDIA_URL, document_root=settings.MEDIA_ROOT)
