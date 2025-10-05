from django.contrib import admin
from django.urls import path, include

urlpatterns = [
    path('admin/', admin.site.urls),
    path('users/', include('users.urls')),
    path('trades/', include('trades.urls')),
    path('analysis/', include('analysis.urls')),
    path('news/', include('news.urls')),
    path('recommendations/', include('recommendations.urls')),
    path('compare/', include('compare.urls')),
    path('sentiment/', include('sentiment.urls')),
]
