from django.urls import path
from . import views

urlpatterns = [
    path('load-subcategories/', views.load_subcategories, name='load_subcategories'),
]