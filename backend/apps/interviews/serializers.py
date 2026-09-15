from rest_framework import serializers

from .models import Interview


class InterviewSerializer(serializers.ModelSerializer):
    class Meta:
        model = Interview
        fields = [
            "id",
            "user",
            "resume",
            "job_role",
            "experience_level",
            "interview_type",
            "difficulty",
            "duration",
            "status",
            "started_at",
            "completed_at",
            "created_at",
        ]
        read_only_fields = [
            "id",
            "user",
            "status",
            "started_at",
            "completed_at",
            "created_at",
        ]