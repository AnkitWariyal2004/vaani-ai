import logging
from rest_framework import status, viewsets
from rest_framework.decorators import action
from rest_framework.parsers import FormParser, MultiPartParser
from rest_framework.response import Response
from .models import UploadedVideo
from .serializers import UploadedVideoSerializer

logger = logging.getLogger(__name__)

class VideoViewSet(viewsets.ModelViewSet):
    """
    Handles video uploads, retrieval, listing, and cleanup.
    """
    queryset = UploadedVideo.objects.all().order_by("-uploaded_at")
    serializer_class = UploadedVideoSerializer
    parser_classes = (MultiPartParser, FormParser)

    @action(detail=False, methods=["post"], url_path="upload")
    def upload(self, request, *args, **kwargs):
        """
        POST /api/videos/upload/
        Validates and saves the incoming video file.
        """
        if "file" not in request.FILES:
            return Response(
                {"error": "No video file provided in 'file' form-data field."},
                status=status.HTTP_400_BAD_REQUEST,
            )

        serializer = self.get_serializer(data=request.data)
        if serializer.is_valid():
            video = serializer.save()
            return Response(
                {
                    "message": "Video uploaded successfully and ready for transcription.",
                    "video": serializer.data,
                },
                status=status.HTTP_201_CREATED,
            )
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
