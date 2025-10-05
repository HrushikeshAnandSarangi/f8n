from django.urls import path, include
from .views import news

urlpatterns = [
    path('news/', news.as_view(), name='news'),
]