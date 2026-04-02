from django.shortcuts import render
from django.http import JsonResponse
from .models import SubCategory


def load_subcategories(request):
    category_id = request.GET.get('category')

    subcategories = SubCategory.objects.filter(
        category_id=category_id
    ).values('id', 'name')

    return JsonResponse(list(subcategories), safe=False)