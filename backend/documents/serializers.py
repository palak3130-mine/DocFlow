from rest_framework import serializers
from .models import DocumentVersion


class DocumentVersionSerializer(serializers.ModelSerializer):

    class Meta:
        model = DocumentVersion
        fields = '__all__'
        read_only_fields = ('version', 'uploaded_by', 'uploaded_at')