import io

import boto3
from django.conf import settings
from pypdf import PdfReader


def extract_resume_text(resume) -> str:
    """
    Retrieves the PDF resume (from AWS S3 or local storage)
    and extracts all text content into a single string.
    """
    if not resume or not resume.file:
        return ""

    try:
        # If using AWS S3
        if getattr(settings, "USE_S3", False):
            s3_client = boto3.client(
                "s3",
                aws_access_key_id=settings.AWS_ACCESS_KEY_ID,
                aws_secret_access_key=settings.AWS_SECRET_ACCESS_KEY,
                region_name=settings.AWS_S3_REGION_NAME,
            )
            file_buffer = io.BytesIO()
            s3_client.download_fileobj(
                settings.AWS_STORAGE_BUCKET_NAME,
                resume.file.name,
                file_buffer,
            )
            file_buffer.seek(0)
            reader = PdfReader(file_buffer)
        else:
            # Local filesystem fallback
            reader = PdfReader(resume.file.path)

        text_content = []
        for page in reader.pages:
            page_text = page.extract_text()
            if page_text:
                text_content.append(page_text)

        return "\n".join(text_content).strip()

    except Exception as exc:
        print(f"Error parsing resume PDF: {exc}")
        return ""