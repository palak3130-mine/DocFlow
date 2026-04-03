from django.urls import path
from . import views

urlpatterns = [
    path('', views.load_categories),
    path('load-subcategories/', views.load_subcategories),
]