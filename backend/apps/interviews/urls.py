from django.urls import path

from .views import InterviewView, JobRoleListView


urlpatterns = [
    path("job-roles/", JobRoleListView.as_view(), name="job-role-list"),
    path("", InterviewView.as_view(), name="interview"),
]