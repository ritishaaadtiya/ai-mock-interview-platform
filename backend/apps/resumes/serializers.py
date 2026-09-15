from rest_framework import serializers

from .models import Resume


class ResumeSerializer(serializers.ModelSerializer):
    class Meta:
        model = Resume
        fields = [
            "id",
            "file",
            "original_filename",
            "uploaded_at",
            "updated_at",
        ]
        read_only_fields = [
            "id",
            "original_filename",
            "uploaded_at",
            "updated_at",
        ]