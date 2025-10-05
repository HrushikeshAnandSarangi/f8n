from django.urls import path, include
from .views import compare

urlpatterns = [
    path('compare/', compare.as_view(), name='compare'),
]