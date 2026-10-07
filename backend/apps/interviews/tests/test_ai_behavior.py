import os
import unittest

from django.contrib.auth import get_user_model
from django.test import tag
from django.utils import timezone

from apps.interviews.models import Interview
from apps.interviews.services import evaluate_and_generate_next
from apps.resumes.models import JobRole

User = get_user_model()

@tag('integration', 'gemini')
class AIInterviewerBehaviorTests(unittest.TestCase):
    """
    Integration tests for the Gemini AI Prompt.
    These hit the real Gemini API and verify the adaptive interviewer behavior.
    """
    
    @classmethod
    def setUpClass(cls):
        super().setUpClass()
        import django
        os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
        django.setup()
        
        cls.user = User.objects.create_user(username="test_ai_user", email="test_ai@test.com", password="pwd")
        cls.role = JobRole.objects.create(name="Backend Developer")
        cls.interview = Interview.objects.create(
            user=cls.user,
            job_role=cls.role,
            experience_level=Interview.ExperienceLevel.TWO_TO_FIVE,
            interview_type=Interview.InterviewType.TECHNICAL,
            difficulty=Interview.Difficulty.MEDIUM,
            duration=30,
            status=Interview.Status.IN_PROGRESS,
            started_at=timezone.now()
        )

    @classmethod
    def tearDownClass(cls):
        cls.interview.delete()
        cls.role.delete()
        cls.user.delete()
        super().tearDownClass()

    def run_eval(self, history, answer):
        return evaluate_and_generate_next(self.interview, history, answer)

    def test_1_strong_answer(self):
        history = [{"role": "assistant", "content": "How would you optimize a database query in Django?"}]
        answer = "I would use select_related for ForeignKey and OneToOne relationships, which uses a SQL JOIN so related objects can be fetched in the same query to avoid N+1 queries."
        
        result = self.run_eval(history, answer)
        
        self.assertIn("relevance", result)
        self.assertFalse(result.get("is_final", False))
        
        # Next action should logically be to probe deeper or move to a scenario
        self.assertIn(result["next_action"].lower(), ["probe deeper", "scenario", "move topic"])

    def test_2_basic_answer(self):
        history = [{"role": "assistant", "content": "How would you optimize a database query in Django?"}]
        answer = "I would use select_related for optimization."
        
        result = self.run_eval(history, answer)
        self.assertFalse(result.get("is_final", False))
        self.assertIn(result["next_action"].lower(), ["probe deeper", "clarify"])

    def test_3_i_dont_know(self):
        history = [{"role": "assistant", "content": "How would you optimize a database query in Django?"}]
        answer = "I don't know."
        
        result = self.run_eval(history, answer)
        self.assertFalse(result.get("is_final", False))
        self.assertIn(result["next_action"].lower(), ["simplify", "move topic"])

    def test_4_very_short_answer(self):
        history = [{"role": "assistant", "content": "Have you ever dealt with database concurrency issues?"}]
        answer = "Yes."
        
        result = self.run_eval(history, answer)
        self.assertFalse(result.get("is_final", False))
        self.assertIn(result["next_action"].lower(), ["probe deeper", "clarify"])

    def test_5_gibberish_answer(self):
        history = [{"role": "assistant", "content": "How would you optimize a database query in Django?"}]
        answer = "asdfgh qwerty 12345"
        
        result = self.run_eval(history, answer)
        self.assertFalse(result.get("is_final", False))
        self.assertIn(result["next_action"].lower(), ["clarify", "move topic", "simplify"])

    def test_6_repeated_weak_answers(self):
        history = [
            {"role": "assistant", "content": "How would you optimize a database query in Django?"},
            {"role": "user", "content": "I don't know."},
            {"role": "assistant", "content": "That's okay. Let's move to caching. Have you used Redis?"},
            {"role": "user", "content": "Not sure."},
            {"role": "assistant", "content": "No problem. Let's talk about APIs. How do you secure an endpoint?"},
            {"role": "user", "content": "I haven't used it."}
        ]
        answer = "Yes." # Another weak answer
        
        result = self.run_eval(history, answer)
        self.assertFalse(result.get("is_final", False))
        self.assertIn(result["next_action"].lower(), ["simplify", "move topic", "clarify"])

    def test_7_strong_follow_up(self):
        history = [
            {"role": "assistant", "content": "How would you optimize a database query in Django?"},
            {"role": "user", "content": "I would use select_related for optimization."},
            {"role": "assistant", "content": "Can you explain how select_related works under the hood?"}
        ]
        answer = "It performs a SQL JOIN and includes the fields of the related object in the SELECT statement. If you want to optimize ManyToMany fields, you should use prefetch_related instead because that does a separate query and joins in Python."
        
        result = self.run_eval(history, answer)
        self.assertFalse(result.get("is_final", False))
        self.assertIn(result["next_action"].lower(), ["probe deeper", "scenario", "move topic"])

