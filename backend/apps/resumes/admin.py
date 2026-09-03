from django.contrib import admin

# Register your models here.
from .models import Resume, JobRole


admin.site.register(Resume)
admin.site.register(JobRole)