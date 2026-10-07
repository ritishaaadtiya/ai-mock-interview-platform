from django.urls import path

from .views import (
    InterviewDetailView,
    InterviewView,
    JobRoleListView,
    StartQuestionView,
    SubmitAnswerView,
)
from .voice_views import VoiceSessionTokenView

urlpatterns = [
    path("job-roles/", JobRoleListView.as_view(), name="job-role-list"),
    path("", InterviewView.as_view(), name="interview-start"),
    path("<int:pk>/", InterviewDetailView.as_view(), name="interview-detail"),
    path("<int:pk>/start/", StartQuestionView.as_view(), name="interview-start-question"),
    path("<int:pk>/submit-answer/", SubmitAnswerView.as_view(), name="interview-submit-answer"),
    path("voice/session-token/", VoiceSessionTokenView.as_view(), name="voice-session-token"),
]