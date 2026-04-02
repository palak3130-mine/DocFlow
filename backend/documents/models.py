from django.db import models
from tickets.models import Ticket
from users.models import User


class DocumentVersion(models.Model):

    ticket = models.ForeignKey(Ticket, on_delete=models.CASCADE)

    file = models.FileField(upload_to='documents/')

    version = models.CharField(max_length=50, blank=True)

    uploaded_by = models.ForeignKey(User, on_delete=models.CASCADE)

    uploaded_at = models.DateTimeField(auto_now_add=True)

    def save(self, *args, **kwargs):

        if not self.version:

            last_version = DocumentVersion.objects.filter(
                ticket=self.ticket
            ).order_by('-id').first()

            if last_version:
                version_number = int(last_version.version.replace('V', '')) + 1
            else:
                version_number = 1

            self.version = f'V{version_number}'

        super().save(*args, **kwargs)

    def __str__(self):
        return self.version