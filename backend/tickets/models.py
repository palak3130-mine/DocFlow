from django.db import models
from users.models import User
from categories.models import Category, SubCategory


class Ticket(models.Model):

    STATUS_CHOICES = (
        ('created', 'Created'),
        ('assigned', 'Assigned'),
        ('started', 'Started'),
        ('draft', 'Draft'),
        ('approval', 'Approval'),
        ('approved', 'Approved'),
        ('locked', 'Locked'),
    )

    title = models.CharField(max_length=255)

    category = models.ForeignKey(Category, on_delete=models.CASCADE)
    subcategory = models.ForeignKey(SubCategory, on_delete=models.CASCADE)

    created_by = models.ForeignKey(User, on_delete=models.CASCADE, related_name='created_tickets')

    assigned_reviewer = models.ForeignKey(
        User,
        on_delete=models.SET_NULL,
        null=True,
        blank=True,
        related_name='assigned_tickets'
    )

    status = models.CharField(
        max_length=20,
        choices=STATUS_CHOICES,
        default='created'
    )

    created_at = models.DateTimeField(auto_now_add=True)

    locked = models.BooleanField(default=False)

    def __str__(self):
        return self.title