import json
import time
from functools import lru_cache

from django.conf import settings
from google import genai
from google.genai import types
from rest_framework.exceptions import APIException


class AIIntegrationError(APIException):
    status_code = 502
    default_detail = 'AI service temporarily unavailable.'
    default_code = 'bad_gateway'


@lru_cache(maxsize=1)
def _get_client() -> genai.Client:
    api_key = getattr(settings, "GEMINI_API_KEY", None)
    if not api_key:
        raise AIIntegrationError("GEMINI_API_KEY must be configured to run interviews.")
    return genai.Client(api_key=api_key)


def _generate_with_retry(client, model, contents, config, retries=3):
    last_error = None
    for attempt in range(retries):
        try:
            response = client.models.generate_content(
                model=model,
                contents=contents,
                config=config
            )
            return json.loads(response.text)
        except Exception as e:
            last_error = e
            error_str = str(e)
            
            # Fail fast on daily quota exhaustion instead of retrying
            if "429" in error_str and ("GenerateRequestsPerDayPerModel-FreeTier" in error_str or "GenerateRequestsPerDayPerProjectPerModel-FreeTier" in error_str):
                raise AIIntegrationError("Gemini API free-tier quota has been reached. Please try again after the quota resets.")
                
            if attempt < retries - 1:
                time.sleep(1.5)
    raise AIIntegrationError(f"Gemini API Error after {retries} attempts: {last_error!s}")


def generate_first_question(interview, resume_text: str) -> dict:
    """
    Generates the opening interview question tailored to the candidate's
    resume, target role, and chosen difficulty level.
    """
    client = _get_client()
    
    system_prompt = f"""
You are an expert technical interviewer conducting a live mock interview.
Target Role: {interview.job_role.name}
Experience Level: {interview.get_experience_level_display()}
Interview Focus: {interview.get_interview_type_display()}
Difficulty: {interview.get_difficulty_display()}

Candidate Resume Details:
{resume_text if resume_text else "No resume provided. Ask standard industry questions."}

Guidelines:
1. Formulate a single, realistic opening interview question.
2. If a resume is provided, reference a project, tool, or claim directly from it.
3. Keep the tone professional, direct, and conversational.
4. Output MUST be valid JSON with keys: "question", "topic", "question_number".
"""

    return _generate_with_retry(
        client=client,
        model='gemini-3.5-flash-lite',
        contents='Begin the interview by asking the first question.',
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            temperature=0.7
        )
    )


def evaluate_and_generate_next(interview, history: list, candidate_answer: str) -> dict:
    """
    Evaluates candidate's last answer and determines the follow-up question.
    """
    client = _get_client()
    
    system_prompt = f"""
You are an expert human interviewer evaluating a candidate for {interview.job_role.name}.
Target Difficulty: {interview.get_difficulty_display()}

Your goal is to conduct a natural, adaptive, and highly responsive conversation.
Do NOT act like an automated grading bot. Listen to the candidate's answer and react exactly how a real interviewer would.

CRITICAL INTERVIEW RULES:
1. NEVER teach, correct, or explain the right answer to the candidate during the live interview. Evaluate them internally, and simply ask the next question.
2. NEVER complete or end the interview. The backend controls completion based on time limits. Always leave 'is_final' as false.
3. If the candidate says "I don't know", "not sure", "no", or gives a wrong/weak answer, DO NOT end the interview. Either simplify the question or move naturally to another related topic.
4. If the candidate gives a short conversational answer ("yes", "sure", "okay", "yeah", "right"), do not treat it as evidence of technical knowledge. Ask a specific follow-up that requires an actual explanation or example.
5. If the candidate gives irrelevant or gibberish answers, do not pretend it was meaningful. Ask ONE clarification question. If they repeatedly give unusable answers, move to another topic instead of endlessly probing.
6. Topic Continuity: Do not jump to a completely unrelated topic after every weak answer. Stay on the current topic if there is still useful information to evaluate. Only move to another topic when: the topic is sufficiently explored, the candidate clearly cannot continue, repeated unusable answers occur, or you decide the topic should naturally change.
7. Tone: Maintain a strictly neutral and professional tone. Do NOT use evaluative or praising statements such as "That's a spot-on use", "Excellent answer", "Great job", "That's correct", or "You're absolutely right". Acknowledge the answer naturally if needed (e.g., "Okay", "Understood"), but NEVER reveal whether the candidate's answer was correct, strong, weak, or incorrect. Ask concise, natural interview questions.

Step 1: Internal Analysis (Chain of Thought)
- Relevance: Did they answer the specific question asked? (Meaningful, Partial, Irrelevant, or Short/Conversational?)
- Knowledge Level: Weak, Basic, Good, or Strong?
- Demonstrated Concepts: What did they clearly understand?
- Missing Concepts: What nuance or detail did they miss?
- Next Action: Decide exactly what to do next ('probe deeper', 'clarify', 'scenario', 'simplify', 'move topic').

Step 2: Score & Feedback (For Internal Report Only)
- Provide concise constructive feedback (1-3 sentences).
- Assign a score from 1-10 based on accuracy and depth.

Step 3: Generate Next Question
- Write the exact response and next question you will say to the candidate.
- Do NOT provide the correct answer, coach them, or praise them. Maintain strict neutrality. Just ask the next question.
- Make the next question explicitly depend on their previous answer!

Return a JSON object with EXACTLY these keys:
"relevance": (string)
"knowledge_level": (string)
"demonstrated_concepts": (string)
"missing_concepts": (string)
"next_action": (string)
"score": (integer 1-10)
"feedback": (string)
"topic": (string)
"next_question": (string - what you actually say to the candidate)
"is_final": (boolean - always false)
"""

    messages = []
    for turn in history:
        role = "model" if turn["role"] == "assistant" else "user"
        messages.append({"role": role, "parts": [{"text": turn["content"]}]})
        
    messages.append({"role": "user", "parts": [{"text": candidate_answer}]})

    return _generate_with_retry(
        client=client,
        model='gemini-3.5-flash-lite',
        contents=messages,
        config=types.GenerateContentConfig(
            system_instruction=system_prompt,
            response_mime_type="application/json",
            temperature=0.6
        )
    )