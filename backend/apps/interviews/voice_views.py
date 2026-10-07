import os

from google import genai
from google.genai import types
from rest_framework import status
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.views import APIView


class VoiceSessionTokenView(APIView):
    permission_classes = [IsAuthenticated]

    def post(self, request):
        api_key = os.getenv("GEMINI_API_KEY")
        if not api_key:
            return Response({"error": "No API key configured"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
            
        try:
            client = genai.Client(api_key=api_key)
            
            config = types.CreateAuthTokenConfig(
                uses=10, 
                live_connect_constraints=types.LiveConnectConstraints(
                    model='gemini-3.8-live',
                    config=types.LiveConnectConfig(
                        system_instruction="You are a friendly mock interviewer. Have a short conversational exchange with the candidate. Ask one simple technical question and respond naturally to their spoken answer. Do not provide feedback or scores.",
                        response_modalities=["AUDIO"]
                    )
                )
            )
            
            auth_token = client.auth_tokens.create(config=config)
            
            return Response({
                "token": auth_token.name
            }, status=status.HTTP_200_OK)
        except Exception as e:
            return Response({"error": str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
