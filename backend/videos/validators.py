from pathlib import Path
from django.core.exceptions import ValidationError

ALLOWED_EXTENSIONS = {".mp4", ".mov", ".mkv", ".avi", ".webm"}
MAX_FILE_SIZE_BYTES = 500 * 1024 * 1024  # 500 MB

def validate_video_file(file_obj):
    """
    Validates uploaded video file size and extension.
    """
    if not file_obj:
        raise ValidationError("No video file was uploaded.")

    filename = getattr(file_obj, "name", "")
    extension = Path(filename).suffix.lower()

    if extension not in ALLOWED_EXTENSIONS:
        raise ValidationError(
            f"Unsupported file format '{extension}'. Supported formats: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
        )

    file_size = getattr(file_obj, "size", 0)
    if file_size > MAX_FILE_SIZE_BYTES:
        max_mb = MAX_FILE_SIZE_BYTES // (1024 * 1024)
        raise ValidationError(
            f"File size ({file_size / (1024*1024):.1f} MB) exceeds maximum allowed limit of {max_mb} MB."
        )

    if file_size == 0:
        raise ValidationError("Uploaded file is empty (0 bytes).")

    return file_obj
