from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from rest_framework.permissions import IsAuthenticated

from .models import Communication
from .serializers import CommunicationSerializer


class SendMessageView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = CommunicationSerializer(data=request.data)

        if serializer.is_valid():

            serializer.save(
                sender=request.user
            )

            return Response(
                serializer.data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )


class GetMessagesView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, ticket_id):

        messages = Communication.objects.filter(
            ticket_id=ticket_id
        ).order_by('created_at')

        serializer = CommunicationSerializer(messages, many=True)

        return Response(serializer.data)
