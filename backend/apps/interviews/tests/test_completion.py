from datetime import timedelta
from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.test import TestCase
from django.utils import timezone
from rest_framework.test import APIClient

from apps.interviews.models import Interview, InterviewQuestion
from apps.resumes.models import JobRole

User = get_user_model()

class InterviewCompletionTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.user = User.objects.create_user(username="testuser", email="test@test.com", password="pwd")
        self.role = JobRole.objects.create(name="Backend Developer")
        self.interview = Interview.objects.create(
            user=self.user,
            job_role=self.role,
            experience_level=Interview.ExperienceLevel.TWO_TO_FIVE,
            interview_type=Interview.InterviewType.TECHNICAL,
            difficulty=Interview.Difficulty.MEDIUM,
            duration=30,
            status=Interview.Status.IN_PROGRESS,
            started_at=timezone.now()
        )
        self.question = InterviewQuestion.objects.create(
            interview=self.interview,
            question_number=1,
            question_text="First question?"
        )
        self.client.force_authenticate(user=self.user)
        self.url = f"/api/interviews/{self.interview.id}/submit-answer/"

    @patch("apps.interviews.views.evaluate_and_generate_next")
    def test_gemini_is_final_ignored(self, mock_eval):
        # Gemini says is_final=True, but time is NOT up
        mock_eval.return_value = {
            "score": 5,
            "feedback": "mock feedback",
            "next_question": "Mock question",
            "topic": "Mock topic",
            "is_final": True
        }

        response = self.client.post(self.url, {"question_id": self.question.id, "answer": "I don't know"})
        self.assertEqual(response.status_code, 200)
        self.assertFalse(response.data["completed"])
        
        self.interview.refresh_from_db()
        self.assertEqual(self.interview.status, Interview.Status.IN_PROGRESS)

    @patch("apps.interviews.views.evaluate_and_generate_next")
    def test_duration_completion(self, mock_eval):
        # Gemini says is_final=False, but time IS up (31 minutes passed)
        mock_eval.return_value = {
            "score": 5,
            "feedback": "mock feedback",
            "next_question": "Mock question",
            "topic": "Mock topic",
            "is_final": False
        }
        
        self.interview.started_at = timezone.now() - timedelta(minutes=31)
        self.interview.save()

        response = self.client.post(self.url, {"question_id": self.question.id, "answer": "mock answer"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["completed"])
        
        self.interview.refresh_from_db()
        self.assertEqual(self.interview.status, Interview.Status.COMPLETED)

    @patch("apps.interviews.views.evaluate_and_generate_next")
    def test_safety_limit_completion(self, mock_eval):
        # Gemini says is_final=False, time is NOT up, but safety limit (duration * 2 = 60) IS reached
        mock_eval.return_value = {
            "score": 5,
            "feedback": "mock feedback",
            "next_question": "Mock question",
            "topic": "Mock topic",
            "is_final": False
        }
        
        self.question.question_number = 60
        self.question.save()

        response = self.client.post(self.url, {"question_id": self.question.id, "answer": "mock answer"})
        self.assertEqual(response.status_code, 200)
        self.assertTrue(response.data["completed"])
        
        self.interview.refresh_from_db()
        self.assertEqual(self.interview.status, Interview.Status.COMPLETED)
