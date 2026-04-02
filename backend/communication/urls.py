from django.urls import path
from .views import SendMessageView, GetMessagesView

urlpatterns = [
    path('send/', SendMessageView.as_view()),
    path('<int:ticket_id>/', GetMessagesView.as_view()),
]