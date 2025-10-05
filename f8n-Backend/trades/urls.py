from django.urls import path, include
from .views import TradeActivityViewSet, TradeViewSet
from rest_framework.routers import DefaultRouter

router = DefaultRouter()
router.register('trade', TradeActivityViewSet, basename='trade-activity')

urlpatterns = [
    path('', include(router.urls)),
    path('alltrades/', TradeViewSet.as_view(), name='all-trades'),
]