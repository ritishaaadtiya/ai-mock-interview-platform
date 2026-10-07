import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.contrib.auth import get_user_model
from apps.authentication.utils import send_verification_email
User = get_user_model()
u = User.objects.get(email='riaadtiya@bestpeers.in')
send_verification_email(u)
print("Sent successfully to riaadtiya@bestpeers.in")
