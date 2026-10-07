
# Create your views here.
from django.shortcuts import get_object_or_404
from django.utils import timezone
from rest_framework import status
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView

from apps.resumes.models import JobRole
from apps.resumes.services import extract_resume_text

from .models import Interview, InterviewQuestion
from .serializers import InterviewSerializer
from .services import evaluate_and_generate_next, generate_first_question


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

class InterviewDetailView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request, pk):
        interview = get_object_or_404(Interview, pk=pk, user=request.user)

        # Extract resume text for AI context
        resume_text = extract_resume_text(interview.resume) if interview.resume else ""

        return Response({
            "id": interview.id,
            "job_role_name": interview.job_role.name,
            "experience_level": interview.experience_level,
            "interview_type": interview.interview_type,
            "difficulty": interview.difficulty,
            "duration": interview.duration,
            "status": interview.status,
            "resume_extracted": bool(resume_text),
            # Ready for system prompt assembly
        }, status=status.HTTP_200_OK)



class StartQuestionView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        interview = get_object_or_404(Interview, pk=pk, user=request.user)

        # Check if already started
        existing_q = interview.questions.filter(question_number=1).first()
        if existing_q:
            return Response({
                "interview_id": interview.id,
                "status": interview.status,
                "question_id": existing_q.id,
                "question": existing_q.question_text,
                "topic": existing_q.topic,
                "question_number": existing_q.question_number,
            }, status=status.HTTP_200_OK)

        resume_text = extract_resume_text(interview.resume) if interview.resume else ""
        question_data = generate_first_question(interview, resume_text)

        interview.status = Interview.Status.IN_PROGRESS
        interview.started_at = timezone.now()
        interview.save(update_fields=["status", "started_at"])

        q = InterviewQuestion.objects.create(
            interview=interview,
            question_number=1,
            topic=question_data.get("topic", "General"),
            question_text=question_data.get("question", ""),
        )

        return Response({
            "interview_id": interview.id,
            "status": interview.status,
            "question_id": q.id,
            "question": q.question_text,
            "topic": q.topic,
            "question_number": q.question_number,
        }, status=status.HTTP_200_OK)


class SubmitAnswerView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request, pk):
        interview = get_object_or_404(Interview, pk=pk, user=request.user)
        question_id = request.data.get("question_id")
        candidate_answer = request.data.get("answer", "").strip()

        if not candidate_answer:
            return Response({"detail": "Answer cannot be empty."}, status=status.HTTP_400_BAD_REQUEST)

        question = get_object_or_404(InterviewQuestion, id=question_id, interview=interview)
        question.candidate_answer = candidate_answer

        # Build transcript history for context
        prior_questions = interview.questions.filter(question_number__lte=question.question_number).order_by("question_number")
        history = []
        for item in prior_questions:
            history.append({"role": "assistant", "content": item.question_text})
            if item.id != question.id and item.candidate_answer:
                history.append({"role": "user", "content": item.candidate_answer})

        # Evaluate last answer and draft next question
        eval_result = evaluate_and_generate_next(interview, history, candidate_answer)

        question.score = eval_result.get("score", 7)
        question.feedback = eval_result.get("feedback", "")
        question.save(update_fields=["candidate_answer", "score", "feedback"])

        # Calculate elapsed time in minutes
        started = interview.started_at or timezone.now()
        elapsed_minutes = (timezone.now() - started).total_seconds() / 60.0
        time_is_up = elapsed_minutes >= interview.duration

        # Hard safety limit to prevent infinite loops (max 2 questions per minute of duration)
        safety_limit_reached = question.question_number >= (interview.duration * 2)

        # Decide whether to complete or continue
        is_final = time_is_up or safety_limit_reached

        if is_final:
            interview.status = Interview.Status.COMPLETED
            interview.completed_at = timezone.now()
            interview.save(update_fields=["status", "completed_at"])
            return Response({
                "completed": True,
                "message": "Interview completed! Great job.",
            }, status=status.HTTP_200_OK)

        next_q_num = question.question_number + 1
        next_q = InterviewQuestion.objects.create(
            interview=interview,
            question_number=next_q_num,
            topic=eval_result.get("topic", "Follow-up"),
            question_text=eval_result.get("next_question", ""),
        )

        return Response({
            "completed": False,
            "next_question": {
                "question_id": next_q.id,
                "question": next_q.question_text,
                "topic": next_q.topic,
                "question_number": next_q.question_number,
            },
        }, status=status.HTTP_200_OK)