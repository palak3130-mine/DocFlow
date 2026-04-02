from django.shortcuts import render
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status

from rest_framework.permissions import IsAuthenticated

from .models import Ticket
from .serializers import TicketSerializer

from users.models import User
from workflow.models import StatusLog
from documents.models import DocumentVersion



class CreateTicketView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request):

        serializer = TicketSerializer(data=request.data)

        if serializer.is_valid():

            ticket = serializer.save(
                created_by=request.user
            )

            # Auto assign reviewer
            reviewer = User.objects.filter(
                role='reviewer',
                reviewer_field=ticket.category,
                specialization=ticket.subcategory
            ).first()

            if not reviewer:
                return Response(
                    {"error": "No reviewer available for selected category and subcategory"},
                    status=status.HTTP_400_BAD_REQUEST
                )

            ticket.assigned_reviewer = reviewer
            ticket.status = 'assigned'
            ticket.save()

            return Response(
                TicketSerializer(ticket).data,
                status=status.HTTP_201_CREATED
            )

        return Response(
            serializer.errors,
            status=status.HTTP_400_BAD_REQUEST
        )

class StartTicketView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):

        try:
            ticket = Ticket.objects.get(id=pk)
        except Ticket.DoesNotExist:
            return Response(
                {"error": "Ticket not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Only assigned reviewer can start
        if request.user != ticket.assigned_reviewer:
            return Response(
                {"error": "Only assigned reviewer can start ticket"},
                status=status.HTTP_403_FORBIDDEN
            )

        ticket.status = 'started'
        ticket.save()

        return Response(
            {"message": "Ticket started"},
            status=status.HTTP_200_OK
        )


class DraftTicketView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):

        try:
            ticket = Ticket.objects.get(id=pk)
        except Ticket.DoesNotExist:
            return Response(
                {"error": "Ticket not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Only assigned reviewer can change
        if request.user != ticket.assigned_reviewer:
            return Response(
                {"error": "Only assigned reviewer can change status"},
                status=status.HTTP_403_FORBIDDEN
            )

        old_status = ticket.status

        ticket.status = 'draft'
        ticket.save()

        # Log status change
        StatusLog.objects.create(
            ticket=ticket,
            old_status=old_status,
            new_status='draft',
            changed_by=request.user
        )

        return Response(
            {"message": "Ticket moved to draft"},
            status=status.HTTP_200_OK
        )

class ApprovalTicketView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):

        try:
            ticket = Ticket.objects.get(id=pk)
        except Ticket.DoesNotExist:
            return Response(
                {"error": "Ticket not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Only assigned reviewer can approve
        if request.user != ticket.assigned_reviewer:
            return Response(
                {"error": "Only assigned reviewer can send for approval"},
                status=status.HTTP_403_FORBIDDEN
            )

        old_status = ticket.status

        ticket.status = 'approval'
        ticket.save()

        # Log status change
        StatusLog.objects.create(
            ticket=ticket,
            old_status=old_status,
            new_status='approval',
            changed_by=request.user
        )

        return Response(
            {"message": "Ticket sent for approval"},
            status=status.HTTP_200_OK
        )


class ApproveTicketView(APIView):

    permission_classes = [IsAuthenticated]

    def post(self, request, pk):

        try:
            ticket = Ticket.objects.get(id=pk)
        except Ticket.DoesNotExist:
            return Response(
                {"error": "Ticket not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        # Only admin can approve
        if request.user.role != 'admin':
            return Response(
                {"error": "Only admin can approve"},
                status=status.HTTP_403_FORBIDDEN
            )

        old_status = ticket.status

        ticket.status = 'approved'
        ticket.locked = True
        ticket.save()

        # Log status change
        StatusLog.objects.create(
            ticket=ticket,
            old_status=old_status,
            new_status='approved',
            changed_by=request.user
        )

        return Response(
            {"message": "Ticket approved and locked"},
            status=status.HTTP_200_OK
        )

class MakerDashboardView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        tickets = Ticket.objects.filter(created_by=request.user)

        serializer = TicketSerializer(tickets, many=True)

        return Response(serializer.data)

class ReviewerDashboardView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        tickets = Ticket.objects.filter(
            assigned_reviewer=request.user
        )

        serializer = TicketSerializer(tickets, many=True)

        return Response(serializer.data)


class AdminDashboardView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request):

        if request.user.role != 'admin':
            return Response(
                {"error": "Admin only"},
                status=status.HTTP_403_FORBIDDEN
            )

        tickets = Ticket.objects.filter(status='approval')

        serializer = TicketSerializer(tickets, many=True)

        return Response(serializer.data)


class TicketDetailView(APIView):

    permission_classes = [IsAuthenticated]

    def get(self, request, pk):

        try:
            ticket = Ticket.objects.get(id=pk)
        except Ticket.DoesNotExist:
            return Response(
                {"error": "Ticket not found"},
                status=status.HTTP_404_NOT_FOUND
            )

        ticket_data = TicketSerializer(ticket).data

        documents = DocumentVersion.objects.filter(ticket=ticket)
        document_data = [
            {
                "id": doc.id,
                "version": doc.version,
                "file": doc.file.url,
                "uploaded_by": doc.uploaded_by.username,
                "uploaded_at": doc.uploaded_at
            }
            for doc in documents
        ]

        status_logs = StatusLog.objects.filter(ticket=ticket)
        status_data = [
            {
                "old_status": log.old_status,
                "new_status": log.new_status,
                "changed_by": log.changed_by.username,
                "timestamp": log.timestamp
            }
            for log in status_logs
        ]

        return Response({
            "ticket": ticket_data,
            "documents": document_data,
            "status_logs": status_data
        })