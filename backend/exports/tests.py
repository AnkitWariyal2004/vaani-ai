from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from videos.models import UploadedVideo
from transcriptions.models import TranscriptionJob, Transcript, TranscriptSegment
from transcriptions.services import TranscriptionService

class ExportDownloadTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.video = UploadedVideo.objects.create(
            file=SimpleUploadedFile("speech_hi.mp4", b"dummy video bytes", content_type="video/mp4"),
            original_filename="speech_hi.mp4",
            file_size=17,
            file_format="mp4",
        )
        self.job = TranscriptionJob.objects.create(
            video=self.video,
            status="COMPLETED"
        )
        self.transcript = Transcript.objects.create(
            job=self.job,
            detected_language="hi",
            language_probability=0.98,
            full_text="नमस्ते दोस्तों। वाणी एआई में आपका स्वागत है।",
            duration=4.2
        )
        TranscriptSegment.objects.create(
            transcript=self.transcript,
            segment_index=0,
            start_time=0.0,
            end_time=1.8,
            text="नमस्ते दोस्तों।"
        )
        TranscriptSegment.objects.create(
            transcript=self.transcript,
            segment_index=1,
            start_time=1.8,
            end_time=4.2,
            text="वाणी एआई में आपका स्वागत है।"
        )

    def tearDown(self):
        if self.video and self.video.file:
            self.video.delete()

    def test_export_srt(self):
        response = self.client.get(f"/api/transcriptions/{self.job.id}/download/?format=srt")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("text/plain", response.headers["Content-Type"])
        content = response.content.decode("utf-8")
        self.assertIn("00:00:00,000 --> 00:00:01,800", content)
        self.assertIn("नमस्ते दोस्तों।", content)
        self.assertIn("00:00:01,800 --> 00:00:04,200", content)

    def test_export_txt(self):
        response = self.client.get(f"/api/transcriptions/{self.job.id}/download/?format=txt")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        content = response.content.decode("utf-8")
        self.assertIn("नमस्ते दोस्तों।", content)

    def test_export_json(self):
        response = self.client.get(f"/api/transcriptions/{self.job.id}/download/?format=json")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("application/json", response.headers["Content-Type"])
        data = response.json()
        self.assertEqual(data["detected_language"], "hi")
        self.assertEqual(len(data["segments"]), 2)

    def test_export_docx(self):
        response = self.client.get(f"/api/transcriptions/{self.job.id}/download/?format=docx")
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("wordprocessingml", response.headers["Content-Type"])
        self.assertGreater(len(response.content), 100)
