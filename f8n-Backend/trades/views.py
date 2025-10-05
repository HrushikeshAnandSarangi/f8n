from rest_framework import viewsets, generics
from django.db.models import Count
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import TradeActivity
from .serializers import TradeActivitySerializer

class TradeActivityViewSet(viewsets.ModelViewSet):
    queryset = TradeActivity.objects.all().order_by('-timestamp')
    serializer_class = TradeActivitySerializer
    permission_classes = [IsAuthenticated]

    def perform_create(self, serializer):
        serializer.save(user=self.request.user)


class TradeViewSet(generics.ListAPIView):
    serializer_class = TradeActivitySerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        return TradeActivity.objects.all()


class TopTradedAssetsView(APIView):
    permission_classes = [IsAuthenticated]

    def get(self, request):
        top_assets = (
            TradeActivity.objects
            .values('asset_name')
            .annotate(trade_count=Count('id'))
            .order_by('-trade_count')[:5]
        )
        return Response(top_assets)