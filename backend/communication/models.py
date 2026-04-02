from django.db import models
from tickets.models import Ticket
from users.models import User


class Communication(models.Model):

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)

    message = models.TextField()

    sender = models.ForeignKey(User, on_delete=models.CASCADE)

    attachment = models.FileField(
        upload_to='chat/',
        blank=True,
        null=True
    )

    created_at = models.DateTimeField(auto_now_add=True)