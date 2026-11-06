from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from videos.models import UploadedVideo
from .models import TranscriptionJob, Transcript, TranscriptSegment

class TranscriptionJobTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.video = UploadedVideo.objects.create(
            file=SimpleUploadedFile("speech.mp4", b"dummy video bytes", content_type="video/mp4"),
            original_filename="speech.mp4",
            file_size=17,
            file_format="mp4",
        )

    def tearDown(self):
        if self.video and self.video.file:
            self.video.delete()

    def test_create_transcription_job(self):
        response = self.client.post("/api/transcriptions/", {
            "video_id": str(self.video.id),
            "target_language": "hi",
            "model_size": "small"
        })
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertIn("job", response.data)
        self.assertEqual(response.data["job"]["status"], "READY_FOR_COLAB")
        self.assertEqual(response.data["job"]["target_language"], "hi")

    def test_import_colab_multilingual_result(self):
        job = TranscriptionJob.objects.create(
            video=self.video,
            target_language="hi",
            model_size="small",
            status="READY_FOR_COLAB"
        )

        colab_payload = {
            "detected_language": "hi",
            "language_probability": 0.99,
            "duration": 5.4,
            "text": "नमस्ते, वाणी एआई में आपका स्वागत है।",
            "segments": [
                {
                    "id": 0,
                    "start": 0.0,
                    "end": 2.5,
                    "text": "नमस्ते,"
                },
                {
                    "id": 1,
                    "start": 2.5,
                    "end": 5.4,
                    "text": "वाणी एआई में आपका स्वागत है।"
                }
            ]
        }

        response = self.client.post(
            f"/api/transcriptions/{job.id}/import-colab/",
            colab_payload,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)

        job.refresh_from_db()
        self.assertEqual(job.status, "COMPLETED")
        self.assertTrue(hasattr(job, "transcript"))
        self.assertEqual(job.transcript.detected_language, "hi")
        self.assertEqual(job.transcript.segments.count(), 2)

        first_seg = job.transcript.segments.first()
        self.assertEqual(first_seg.text, "नमस्ते,")
        self.assertEqual(first_seg.start_time, 0.0)
        self.assertEqual(first_seg.end_time, 2.5)

    def test_edit_transcript(self):
        job = TranscriptionJob.objects.create(
            video=self.video,
            status="COMPLETED"
        )
        transcript = Transcript.objects.create(
            job=job,
            detected_language="en",
            full_text="Old text",
            duration=3.0
        )
        TranscriptSegment.objects.create(
            transcript=transcript,
            segment_index=0,
            start_time=0.0,
            end_time=3.0,
            text="Old text"
        )

        update_payload = {
            "full_text": "Updated correct text",
            "segments": [
                {
                    "segment_index": 0,
                    "start_time": 0.0,
                    "end_time": 3.0,
                    "text": "Updated correct text"
                }
            ]
        }
        response = self.client.patch(
            f"/api/transcriptions/{job.id}/edit/",
            update_payload,
            format="json"
        )
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        transcript.refresh_from_db()
        self.assertEqual(transcript.full_text, "Updated correct text")

    def test_full_lifecycle_e2e_workflow(self):
        """
        Tests the entire end-to-end user workflow:
        Upload -> Job Creation -> Colab Result Import -> Details View -> Edit -> Multi-format Exports -> Health Check
        """
        # 1. Video upload
        fake_video = SimpleUploadedFile("interview_hindi.mp4", b"video frame bytes", content_type="video/mp4")
        upload_resp = self.client.post("/api/videos/upload/", {"file": fake_video}, format="multipart")
        self.assertEqual(upload_resp.status_code, status.HTTP_201_CREATED)
        video_id = upload_resp.data["video"]["id"]

        # 2. Transcription job creation
        job_resp = self.client.post("/api/transcriptions/", {
            "video_id": video_id,
            "target_language": "hi",
            "model_size": "small"
        })
        self.assertEqual(job_resp.status_code, status.HTTP_201_CREATED)
        job_id = job_resp.data["job"]["id"]

        # 3. Simulate Colab Faster-Whisper inference output import
        colab_output = {
            "job_id": job_id,
            "detected_language": "hi",
            "language_probability": 0.995,
            "duration": 12.8,
            "text": "वाणी एआई शून्य बजट वीडियो ट्रांसक्रिप्शन का समर्थन करता है।",
            "segments": [
                {"id": 0, "start": 0.0, "end": 6.2, "text": "वाणी एआई शून्य बजट"},
                {"id": 1, "start": 6.2, "end": 12.8, "text": "वीडियो ट्रांसक्रिप्शन का समर्थन करता है।"}
            ]
        }
        import_resp = self.client.post(f"/api/transcriptions/{job_id}/import-colab/", colab_output, format="json")
        self.assertEqual(import_resp.status_code, status.HTTP_200_OK)

        # 4. Retrieve job details with serialized segments
        get_resp = self.client.get(f"/api/transcriptions/{job_id}/")
        self.assertEqual(get_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(get_resp.data["status"], "COMPLETED")
        self.assertEqual(len(get_resp.data["transcript"]["segments"]), 2)

        # 5. Interactive edit in workspace
        edit_payload = {
            "full_text": "वाणी एआई पूर्ण शून्य बजट वीडियो ट्रांसक्रिप्शन का समर्थन करता है।",
            "segments": [
                {"segment_index": 0, "start_time": 0.0, "end_time": 6.2, "text": "वाणी एआई पूर्ण शून्य बजट"},
                {"segment_index": 1, "start_time": 6.2, "end_time": 12.8, "text": "वीडियो ट्रांसक्रिप्शन का समर्थन करता है।"}
            ]
        }
        edit_resp = self.client.patch(f"/api/transcriptions/{job_id}/edit/", edit_payload, format="json")
        self.assertEqual(edit_resp.status_code, status.HTTP_200_OK)

        # 6. Verify Exports (SRT, TXT, JSON, DOCX)
        srt_resp = self.client.get(f"/api/transcriptions/{job_id}/download/?format=srt")
        self.assertEqual(srt_resp.status_code, status.HTTP_200_OK)
        self.assertIn("वाणी एआई पूर्ण शून्य बजट", srt_resp.content.decode("utf-8"))

        txt_resp = self.client.get(f"/api/transcriptions/{job_id}/download/?format=txt")
        self.assertEqual(txt_resp.status_code, status.HTTP_200_OK)

        json_resp = self.client.get(f"/api/transcriptions/{job_id}/download/?format=json")
        self.assertEqual(json_resp.status_code, status.HTTP_200_OK)
        self.assertEqual(json_resp.json()["detected_language"], "hi")

        docx_resp = self.client.get(f"/api/transcriptions/{job_id}/download/?format=docx")
        self.assertEqual(docx_resp.status_code, status.HTTP_200_OK)

        # 7. Health check
        health_resp = self.client.get("/api/health/")
        self.assertEqual(health_resp.status_code, 200)
        self.assertEqual(health_resp.json()["status"], "healthy")

        # Cleanup video from disk
        vid_obj = UploadedVideo.objects.get(id=video_id)
        vid_obj.delete()

