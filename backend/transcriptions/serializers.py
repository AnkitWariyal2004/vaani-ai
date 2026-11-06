from rest_framework import serializers
from .models import TranscriptionJob, Transcript, TranscriptSegment
from videos.serializers import UploadedVideoSerializer

class TranscriptSegmentSerializer(serializers.ModelSerializer):
    formatted_start = serializers.SerializerMethodField()
    formatted_end = serializers.SerializerMethodField()

    class Meta:
        model = TranscriptSegment
        fields = [
            "id",
            "segment_index",
            "start_time",
            "end_time",
            "formatted_start",
            "formatted_end",
            "text",
        ]

    def get_formatted_start(self, obj):
        return TranscriptSegment.format_time(obj.start_time)

    def get_formatted_end(self, obj):
        return TranscriptSegment.format_time(obj.end_time)

class TranscriptSerializer(serializers.ModelSerializer):
    segments = TranscriptSegmentSerializer(many=True, read_only=True)
    segment_count = serializers.SerializerMethodField()

    class Meta:
        model = Transcript
        fields = [
            "id",
            "detected_language",
            "language_probability",
            "full_text",
            "duration",
            "created_at",
            "updated_at",
            "segment_count",
            "segments",
        ]

    def get_segment_count(self, obj):
        return obj.segments.count()

class TranscriptionJobSerializer(serializers.ModelSerializer):
    video_details = UploadedVideoSerializer(source="video", read_only=True)
    transcript = TranscriptSerializer(read_only=True)

    class Meta:
        model = TranscriptionJob
        fields = [
            "id",
            "video",
            "video_details",
            "status",
            "target_language",
            "model_size",
            "error_message",
            "created_at",
            "updated_at",
            "transcript",
        ]
        read_only_fields = ["id", "status", "created_at", "updated_at", "transcript"]

class ColabSegmentInputSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=False)
    start = serializers.FloatField(required=True)
    end = serializers.FloatField(required=True)
    text = serializers.CharField(required=True, allow_blank=True)

class ColabImportSerializer(serializers.Serializer):
    detected_language = serializers.CharField(required=False, allow_blank=True)
    language = serializers.CharField(required=False, allow_blank=True)
    language_probability = serializers.FloatField(required=False, allow_null=True)
    duration = serializers.FloatField(required=False, allow_null=True)
    text = serializers.CharField(required=False, allow_blank=True)
    segments = serializers.ListField(
        child=serializers.DictField(),
        required=False,
        default=list
    )

class TranscriptUpdateSegmentSerializer(serializers.Serializer):
    id = serializers.UUIDField(required=False)
    segment_index = serializers.IntegerField(required=True)
    start_time = serializers.FloatField(required=True)
    end_time = serializers.FloatField(required=True)
    text = serializers.CharField(required=True, allow_blank=True)

class TranscriptUpdateSerializer(serializers.Serializer):
    full_text = serializers.CharField(required=False, allow_blank=True)
    segments = serializers.ListField(
        child=TranscriptUpdateSegmentSerializer(),
        required=False
    )
