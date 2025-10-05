from django.urls import path, include
from .views import recommendations

urlpatterns = [
    path('recommendations/', recommendations.as_view(), name='news'),
]