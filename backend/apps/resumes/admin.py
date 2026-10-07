from django.contrib import admin

# Register your models here.
from .models import JobRole, Resume

admin.site.register(Resume)
admin.site.register(JobRole)