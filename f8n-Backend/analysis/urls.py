from django.urls import path
from .views import analyse

urlpatterns = [
    path('analyse/', analyse.as_view(), name='chat'),
]