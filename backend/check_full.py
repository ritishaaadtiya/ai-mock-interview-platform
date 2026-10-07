import os
import django
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'config.settings')
django.setup()
from django.contrib.auth import get_user_model
from apps.authentication.utils import generate_verification_token
from django.core.signing import TimestampSigner

signer = TimestampSigner()
User = get_user_model()
u = User.objects.filter(email='riaadtiya@bestpeers.in').first()
if u:
    token = generate_verification_token(u.id)
    print(f"Token: {token}")
    try:
        user_id_str = signer.unsign(token, max_age=86400)
        print(f"Unsigned: {user_id_str}")
    except Exception as e:
        print(f"Error: {e}")
