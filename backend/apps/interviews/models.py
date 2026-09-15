from django.conf import settings
from django.db import models

from apps.resumes.models import JobRole, Resume


class Interview(models.Model):

    class ExperienceLevel(models.TextChoices):
        ZERO_TO_ONE = "0-1", "0–1 years"
        ONE_TO_TWO = "1-2", "1–2 years"
        TWO_TO_FIVE = "2-5", "2–5 years"
        FIVE_PLUS = "5+", "5+ years"

    class InterviewType(models.TextChoices):
        TECHNICAL = "technical", "Technical"
        BEHAVIORAL = "behavioral", "Behavioral"
        BOTH = "both", "Technical + Behavioral"

    class Difficulty(models.TextChoices):
        EASY = "easy", "Easy"
        MEDIUM = "medium", "Medium"
        HARD = "hard", "Hard"

    class Duration(models.IntegerChoices):
        FIFTEEN = 15, "15 minutes"
        THIRTY = 30, "30 minutes"
        FORTY_FIVE = 45, "45 minutes"

    class Status(models.TextChoices):
        NOT_STARTED = "not_started", "Not Started"
        IN_PROGRESS = "in_progress", "In Progress"
        COMPLETED = "completed", "Completed"
        CANCELLED = "cancelled", "Cancelled"

    user = models.ForeignKey(
        settings.AUTH_USER_MODEL,
        on_delete=models.CASCADE,
        related_name="interviews",
    )

    resume = models.ForeignKey(
        Resume,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name="interviews",
    )

    job_role = models.ForeignKey(
        JobRole,
        on_delete=models.PROTECT,
        related_name="interviews",
    )

    experience_level = models.CharField(
        max_length=10,
        choices=ExperienceLevel.choices,
    )

    interview_type = models.CharField(
        max_length=20,
        choices=InterviewType.choices,
    )

    difficulty = models.CharField(
        max_length=10,
        choices=Difficulty.choices,
    )

    duration = models.PositiveSmallIntegerField(
        choices=Duration.choices,
    )

    status = models.CharField(
        max_length=20,  
        choices=Status.choices,
        default=Status.NOT_STARTED,
    )

    started_at = models.DateTimeField(null=True, blank=True)
    completed_at = models.DateTimeField(null=True, blank=True)

    created_at = models.DateTimeField(auto_now_add=True)

    def __str__(self):
        return f"{self.user.email} - {self.job_role.name}"