from django.contrib.auth.models import AbstractUser
from django.db import models
from categories.models import Category, SubCategory
from django.core.exceptions import ValidationError


class User(AbstractUser):

    ROLE_CHOICES = (
        ('maker', 'Maker'),
        ('reviewer', 'Reviewer'),
        ('admin', 'Admin'),
    )

    role = models.CharField(max_length=20, choices=ROLE_CHOICES)

    reviewer_field = models.ForeignKey(
        Category,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    specialization = models.ForeignKey(
        SubCategory,
        on_delete=models.SET_NULL,
        null=True,
        blank=True
    )

    def clean(self):
        if self.role == 'reviewer':
            if not self.reviewer_field:
                raise ValidationError("Reviewer must have Reviewer Field")

            if not self.specialization:
                raise ValidationError("Reviewer must have Specialization")

    def __str__(self):
        return self.username