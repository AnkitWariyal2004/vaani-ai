import os
import uuid
from pathlib import Path
from django.db import models
from django.db.models.signals import post_delete
from django.dispatch import receiver
from .validators import validate_video_file

def video_upload_path(instance, filename):
    """Generates unique file storage path."""
    ext = Path(filename).suffix.lower()
    return f"videos/{instance.id}{ext}"

class UploadedVideo(models.Model):
    id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False)
    file = models.FileField(upload_to=video_upload_path, validators=[validate_video_file])
    original_filename = models.CharField(max_length=255)
    file_size = models.BigIntegerField(default=0, help_text="File size in bytes")
    file_format = models.CharField(max_length=20, default="mp4")
    duration_seconds = models.FloatField(null=True, blank=True)
    uploaded_at = models.DateTimeField(auto_now_add=True)

    class Meta:
        ordering = ["-uploaded_at"]

    def __str__(self):
        return f"{self.original_filename} ({self.file_format.upper()}) - {self.id}"

    def save(self, *args, **kwargs):
        if self.file and not self.original_filename:
            self.original_filename = self.file.name
        if self.original_filename and not self.file_format:
            ext = Path(self.original_filename).suffix.lower().lstrip(".")
            self.file_format = ext or "mp4"
        if self.file and hasattr(self.file, "size") and self.file.size:
            self.file_size = self.file.size
        super().save(*args, **kwargs)

@receiver(post_delete, sender=UploadedVideo)
def cleanup_video_file_on_delete(sender, instance, **kwargs):
    """Automatically cleans up physical file from disk on deletion."""
    if instance.file:
        try:
            if os.path.isfile(instance.file.path):
                os.remove(instance.file.path)
        except Exception:
            pass
