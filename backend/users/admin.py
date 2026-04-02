from django.contrib import admin
from django.contrib.auth.admin import UserAdmin as BaseUserAdmin
from .models import User


@admin.register(User)
class UserAdmin(BaseUserAdmin):

    list_display = (
        'username',
        'role',
        'reviewer_field',
        'specialization',
        'is_staff',
    )

    fieldsets = BaseUserAdmin.fieldsets + (
        ('Role Info', {
            'fields': ('role', 'reviewer_field', 'specialization'),
        }),
    )

    add_fieldsets = BaseUserAdmin.add_fieldsets + (
        ('Role Info', {
            'fields': ('role', 'reviewer_field', 'specialization'),
        }),
    )