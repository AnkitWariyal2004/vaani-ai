import io
import os
from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from .models import UploadedVideo

class VideoUploadTests(TestCase):
    def setUp(self):
        self.client = APIClient()

    def test_upload_valid_mp4_video(self):
        # Create a dummy MP4 file
        video_content = b"fake video content bytes representing an mp4"
        file = SimpleUploadedFile("sample_clip.mp4", video_content, content_type="video/mp4")
        response = self.client.post("/api/videos/upload/", {"file": file}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("video", response.data)
        self.assertEqual(response.data["video"]["original_filename"], "sample_clip.mp4")
        self.assertEqual(response.data["video"]["file_format"], "mp4")

        # Verify DB entry
        video_id = response.data["video"]["id"]
        db_video = UploadedVideo.objects.get(id=video_id)
        self.assertTrue(os.path.exists(db_video.file.path))

        # Cleanup
        db_video.delete()
        self.assertFalse(os.path.exists(db_video.file.path))

    def test_upload_invalid_file_extension(self):
        file = SimpleUploadedFile("malicious.exe", b"binary", content_type="application/octet-stream")
        response = self.client.post("/api/videos/upload/", {"file": file}, format="multipart")

        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertIn("file", response.data)
        self.assertTrue(any("Unsupported file format" in err for err in response.data["file"]))

    def test_upload_empty_request(self):
        response = self.client.post("/api/videos/upload/", {}, format="multipart")
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
