from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from rest_framework.permissions import IsAuthenticated

from .models import DocumentVersion
from .serializers import DocumentVersionSerializer
from tickets.models import Ticket


class UploadDocumentView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        ticket_id = request.data.get('ticket')

        try:
            ticket = Ticket.objects.get(id=ticket_id)
        except Ticket.DoesNotExist:
            return Response(
                {"error": "Ticket not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Prevent upload if locked
        if ticket.locked:
            return Response(
                {"error": "Ticket is locked. Upload not allowed."},
                status=status.HTTP_400_BAD_REQUEST
            )

        serializer = DocumentVersionSerializer(data=request.data)

        if serializer.is_valid():

            serializer.save(
                uploaded_by=request.user
            )

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )