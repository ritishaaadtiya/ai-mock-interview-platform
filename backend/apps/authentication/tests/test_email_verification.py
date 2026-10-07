from unittest.mock import patch

from django.contrib.auth import get_user_model
from django.core import mail
from django.core.signing import TimestampSigner
from django.urls import reverse
from rest_framework import status
from rest_framework.test import APITestCase

User = get_user_model()
signer = TimestampSigner()

class EmailVerificationTests(APITestCase):

    def setUp(self):
        self.unverified_user = User.objects.create_user(
            username="testuser",
            email="test@example.com",
            password="testpassword123",
            email_verified=False
        )
        self.verified_user = User.objects.create_user(
            username="verifieduser",
            email="verified@example.com",
            password="testpassword123",
            email_verified=True
        )

    def test_registration_sends_verification_email(self):
        url = reverse('register')
        data = {
            "username": "newuser",
            "email": "newuser@example.com",
            "password": "newpassword123"
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        
        user = User.objects.get(email="newuser@example.com")
        self.assertFalse(user.email_verified)
        
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, ["newuser@example.com"])
        self.assertIn("Verify your email", mail.outbox[0].subject)

    def test_valid_verification(self):
        token = signer.sign(str(self.unverified_user.id))
        url = reverse('verify_email')
        
        response = self.client.post(url, {"token": token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Email verified successfully.")
        
        self.unverified_user.refresh_from_db()
        self.assertTrue(self.unverified_user.email_verified)

    def test_invalid_token(self):
        url = reverse('verify_email')
        response = self.client.post(url, {"token": "invalid_token_format"})
        
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        
        self.unverified_user.refresh_from_db()
        self.assertFalse(self.unverified_user.email_verified)

    @patch('django.core.signing.TimestampSigner.unsign')
    def test_expired_token(self, mock_unsign):
        from django.core.signing import SignatureExpired
        mock_unsign.side_effect = SignatureExpired("Signature expired")
        
        token = signer.sign(str(self.unverified_user.id))
        url = reverse('verify_email')
        
        response = self.client.post(url, {"token": token})
        self.assertEqual(response.status_code, status.HTTP_400_BAD_REQUEST)
        self.assertEqual(response.data["detail"], "Verification link has expired (it is older than 24 hours). Please request a new one.")

    def test_already_verified(self):
        token = signer.sign(str(self.verified_user.id))
        url = reverse('verify_email')
        
        response = self.client.post(url, {"token": token})
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Email is already verified.")

    def test_login_unverified_rejected(self):
        url = reverse('login')
        data = {
            "email": self.unverified_user.email,
            "password": "testpassword123"
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_403_FORBIDDEN)
        self.assertIn("verify your email", response.data["detail"].lower())

    def test_login_verified_success(self):
        url = reverse('login')
        data = {
            "email": self.verified_user.email,
            "password": "testpassword123"
        }
        
        response = self.client.post(url, data)
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertIn("access", response.data)

    def test_resend_verification_unverified(self):
        url = reverse('resend_verification')
        response = self.client.post(url, {"email": self.unverified_user.email})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 1)
        self.assertEqual(mail.outbox[0].to, [self.unverified_user.email])

    def test_resend_verification_verified(self):
        url = reverse('resend_verification')
        response = self.client.post(url, {"email": self.verified_user.email})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(response.data["message"], "Email is already verified.")
        self.assertEqual(len(mail.outbox), 0)

    def test_resend_verification_invalid_email(self):
        url = reverse('resend_verification')
        response = self.client.post(url, {"email": "doesnotexist@example.com"})
        
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(mail.outbox), 0)
