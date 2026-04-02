from django.urls import path
from .views import (
    CreateTicketView,
    StartTicketView,
    DraftTicketView,
    ApprovalTicketView,
    ApproveTicketView,

    MakerDashboardView,
    ReviewerDashboardView,
    AdminDashboardView,

    TicketDetailView,
)

urlpatterns = [
    path('create/', CreateTicketView.as_view()),
    path('start/<int:pk>/', StartTicketView.as_view()),
    path('draft/<int:pk>/', DraftTicketView.as_view()),
    path('approval/<int:pk>/', ApprovalTicketView.as_view()),
    path('approve/<int:pk>/', ApproveTicketView.as_view()),

    path('maker/', MakerDashboardView.as_view()),
    path('reviewer/', ReviewerDashboardView.as_view()),
    path('admin/', AdminDashboardView.as_view()),

    path('<int:pk>/', TicketDetailView.as_view()),
]