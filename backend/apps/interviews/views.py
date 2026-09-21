from django.shortcuts import render

# Create your views here.
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.resumes.models import JobRole

from .serializers import InterviewSerializer


class JobRoleListView(APIView):
    permission_classes = [AllowAny]

    def get(self, request):
        job_roles = JobRole.objects.filter(is_active=True).values(
            "id", "name", "description"
        )
        return Response(list(job_roles))


class InterviewView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        serializer = InterviewSerializer(data=request.data)

        if serializer.is_valid():
            interview = serializer.save(
                user=request.user,
                status="in_progress",
            )

            return Response(
                {
                    "message": "Interview started successfully.",
                    "interview_id": interview.id,
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )