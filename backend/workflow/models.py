from django.db import models
from tickets.models import Ticket
from users.models import User


class StatusLog(models.Model):

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)

    old_status = models.CharField(max_length=50)

    new_status = models.CharField(max_length=50)

    changed_by = models.ForeignKey(User, on_delete=models.CASCADE)

    timestamp = models.DateTimeField(auto_now_add=True)