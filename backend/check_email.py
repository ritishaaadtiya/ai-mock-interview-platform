import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.core.mail import send_mail
from django.conf import settings

try:
    print(f"EMAIL_BACKEND: {settings.EMAIL_BACKEND}")
    print(f"EMAIL_HOST_USER: {settings.EMAIL_HOST_USER}")
    res = send_mail(
        "Test Subject",
        "Test Message",
        settings.DEFAULT_FROM_EMAIL,
        ["riaadtiya@bestpeers.in"],
        fail_silently=False,
    )
    print(f"Sent successfully! Result: {res}")
except Exception as e:
    print(f"Error sending email: {e}")
