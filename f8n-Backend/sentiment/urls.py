from django.urls import path
from .views import SentimentView

urlpatterns = [
    path('sentiment/', SentimentView.as_view(), name='sentiment'),
]