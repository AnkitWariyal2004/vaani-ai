import uuid
from django.db import models
from videos.models import UploadedVideo

class TranscriptionJob(models.Model):
    STATUS_CHOICES = [
        ("PENDING", "Pending"),
        ("READY_FOR_COLAB", "Ready for Colab"),
        ("PROCESSING", "Processing in Colab"),
        ("COMPLETED", "Completed"),
        ("FAILED", "Failed"),
    ]

    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    video = models.ForeignKey(
        UploadedVideo, on_delete=models.CASCADE, related_name="transcription_jobs"
    )
    status = models.CharField(max_length=30, choices=STATUS_CHOICES, default="READY_FOR_COLAB")
    target_language = models.CharField(max_length=30, default="auto", help_text="Language code or 'auto'")
    model_size = models.CharField(max_length=20, default="small", help_text="Whisper model size")
    error_message = models.TextField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Job {self.id} [{self.status}] - {self.video.original_filename}"

class Transcript(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    job = models.OneToOneField(
        TranscriptionJob, on_delete=models.CASCADE, related_name="transcript"
    )
    detected_language = models.CharField(max_length=50, blank=True, null=True)
    language_probability = models.FloatField(null=True, blank=True)
    full_text = models.TextField(blank=True)
    duration = models.FloatField(null=True, blank=True)
    created_at = models.DateTimeField(auto_now_add=True)
    updated_at = models.DateTimeField(auto_now=True)

    class Meta:
        ordering = ["-created_at"]

    def __str__(self):
        return f"Transcript for Job {self.job.id} ({self.detected_language or 'unknown'})"

class TranscriptSegment(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    transcript = models.ForeignKey(
        Transcript, on_delete=models.CASCADE, related_name="segments"
    )
    segment_index = models.PositiveIntegerField(default=0)
    start_time = models.FloatField(help_text="Start time in seconds")
    end_time = models.FloatField(help_text="End time in seconds")
    text = models.TextField()

    class Meta:
        ordering = ["segment_index", "start_time"]

    def __str__(self):
        return f"[{self.format_time(self.start_time)} --> {self.format_time(self.end_time)}] {self.text[:30]}"

    @staticmethod
    def format_time(seconds: float) -> str:
        """Converts seconds float to HH:MM:SS.mmm format."""
        if seconds is None:
            return "00:00:00.000"
        hours = int(seconds // 3600)
        minutes = int((seconds % 3600) // 60)
        secs = seconds % 60
        return f"{hours:02d}:{minutes:02d}:{secs:06.3f}"
