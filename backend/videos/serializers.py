from rest_framework import serializers
from .models import UploadedVideo
from .validators import validate_video_file

class UploadedVideoSerializer(serializers.ModelSerializer):
    formatted_size = serializers.SerializerMethodField()
    file_url = serializers.SerializerMethodField()

    class Meta:
        model = UploadedVideo
        fields = [
            "id",
            "file",
            "original_filename",
            "file_size",
            "formatted_size",
            "file_format",
            "duration_seconds",
            "uploaded_at",
            "file_url",
        ]
        read_only_fields = ["id", "original_filename", "file_size", "formatted_size", "file_format", "uploaded_at", "file_url"]

    def get_formatted_size(self, obj):
        size = obj.file_size or 0
        if size < 1024:
            return f"{size} B"
        elif size < 1024 * 1024:
            return f"{size / 1024:.1f} KB"
        else:
            return f"{size / (1024 * 1024):.2f} MB"

    def get_file_url(self, obj):
        request = self.context.get("request")
        if obj.file:
            if request:
                return request.build_absolute_uri(obj.file.url)
            return obj.file.url
        return None

    def validate_file(self, value):
        return validate_video_file(value)

    def create(self, validated_data):
        file_obj = validated_data["file"]
        validated_data["original_filename"] = file_obj.name
        validated_data["file_size"] = file_obj.size
        return super().create(validated_data)
