from django.conf import settings
from django.core.mail import send_mail
from django.core.signing import TimestampSigner

signer = TimestampSigner()

def generate_verification_token(user_id):
    return signer.sign(str(user_id))

def send_verification_email(user):
    token = generate_verification_token(user.id)
    frontend_url = getattr(settings, 'FRONTEND_URL', 'http://localhost:3000')
    verification_url = f"{frontend_url}/verify-email/{token}"
    
    subject = "Verify your email - MockInterview"
    message = f"""Welcome to MockInterview

Thanks for creating your account.

Please verify your email address to activate your account.

Verify Email: {verification_url}

This verification link will expire in 24 hours.
"""
    
    html_message = f"""
    <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto; padding: 20px; border: 1px solid #e2e5ea; border-radius: 10px;">
        <h2 style="color: #10141c;">Welcome to MockInterview</h2>
        <p style="color: #565f6d; font-size: 16px;">Thanks for creating your account.</p>
        <p style="color: #565f6d; font-size: 16px;">Please verify your email address to activate your account.</p>
        <div style="margin: 30px 0;">
            <a href="{verification_url}" style="background-color: #145C4B; color: white; padding: 12px 24px; text-decoration: none; border-radius: 6px; font-weight: bold; display: inline-block;">Verify Email</a>
        </div>
        <p style="color: #8a93a3; font-size: 14px;">This verification link will expire in 24 hours.</p>
        <hr style="border: none; border-top: 1px solid #e2e5ea; margin: 30px 0;">
        <p style="color: #8a93a3; font-size: 12px;">If the button doesn't work, copy and paste this link into your browser:<br>{verification_url}</p>
    </div>
    """
    
    send_mail(
        subject=subject,
        message=message,
        from_email=getattr(settings, 'DEFAULT_FROM_EMAIL', 'noreply@mockinterview.local'),
        recipient_list=[user.email],
        html_message=html_message,
        fail_silently=False,
    )
