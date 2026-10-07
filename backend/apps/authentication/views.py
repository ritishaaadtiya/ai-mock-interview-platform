
# Create your views here.
from rest_framework import status
from rest_framework.permissions import AllowAny
from rest_framework.response import Response
from rest_framework.views import APIView

from .serializers import RegisterSerializer
from django.contrib.auth import get_user_model
from django.core.signing import BadSignature, SignatureExpired, TimestampSigner

from .utils import send_verification_email

User = get_user_model()
signer = TimestampSigner()

class RegisterView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        serializer = RegisterSerializer(data=request.data)

        if serializer.is_valid():
            user = serializer.save()
            user.email_verified = False
            user.save(update_fields=['email_verified'])

            send_verification_email(user)
            return Response(
                {
                    "message": "Registration successful. Please check your email to verify your account.",
                    "user": {
                        "id": user.id,
                        "username": user.username,
                        "email": user.email,
                    },
                },
                status=status.HTTP_201_CREATED,
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST,
        )


class VerifyEmailView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        token = request.data.get('token')
        if not token:
            return Response({"detail": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)
        
        try:
            # 24 hours = 86400 seconds
            user_id_str = signer.unsign(token, max_age=86400)
            user = User.objects.get(id=int(user_id_str))
        except SignatureExpired:
            print("Verify failed: SignatureExpired")
            return Response({"detail": "Verification link has expired (it is older than 24 hours). Please request a new one."}, status=status.HTTP_400_BAD_REQUEST)
        except User.DoesNotExist:
            print("Verify failed: User.DoesNotExist")
            return Response({"detail": "The account for this verification link no longer exists. Did you delete it and recreate it?"}, status=status.HTTP_400_BAD_REQUEST)
        except (BadSignature, ValueError) as e:
            print(f"Verify failed: BadSignature or ValueError. token={token}, error={e}")
            return Response({"detail": "Invalid verification link. It may be corrupted or malformed."}, status=status.HTTP_400_BAD_REQUEST)
            
        if user.email_verified:
            return Response({"message": "Email is already verified."}, status=status.HTTP_200_OK)
            
        user.email_verified = True
        user.save(update_fields=['email_verified'])
        
        return Response({"message": "Email verified successfully."}, status=status.HTTP_200_OK)

class ResendVerificationView(APIView):
    permission_classes = [AllowAny]

    def post(self, request):
        email = request.data.get('email')
        if not email:
            return Response({"detail": "Email is required."}, status=status.HTTP_400_BAD_REQUEST)
            
        try:
            user = User.objects.filter(email__iexact=email.strip()).first()
            if not user:
                raise User.DoesNotExist
        except User.DoesNotExist:
            # Don't expose whether user exists
            return Response({"message": "If an account with this email exists, a verification link has been sent."}, status=status.HTTP_200_OK)
            
        if user.email_verified:
            return Response({"message": "Email is already verified."}, status=status.HTTP_200_OK)
            
        send_verification_email(user)
        return Response({"message": "If an account with this email exists, a verification link has been sent."}, status=status.HTTP_200_OK)
