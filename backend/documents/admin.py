from django.contrib import admin
from .models import DocumentVersion


@admin.register(DocumentVersion)
class DocumentVersionAdmin(admin.ModelAdmin):

    list_display = (
        'id',
        'ticket',
        'version',
        'uploaded_by',
        'uploaded_at'
    )