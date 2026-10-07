from django.urls import path
from rest_framework_simplejwt.views import TokenRefreshView

from .views import RegisterView, ResendVerificationView, VerifyEmailView

urlpatterns = [
    path("register/", RegisterView.as_view(), name="register"),
    path("verify-email/", VerifyEmailView.as_view(), name="verify_email"),
    path("resend-verification/", ResendVerificationView.as_view(), name="resend_verification"),
    path("token/refresh/", TokenRefreshView.as_view(), name="token_refresh"),
]