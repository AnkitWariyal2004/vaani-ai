from django.urls import path, include
from rest_framework.routers import DefaultRouter
from .views import TranscriptionJobViewSet

router = DefaultRouter()
router.register(r"", TranscriptionJobViewSet, basename="transcription")

urlpatterns = [
    path("", include(router.urls)),
]
