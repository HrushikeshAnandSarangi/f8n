from rest_framework import serializers
from .models import TradeActivity

class TradeActivitySerializer(serializers.ModelSerializer):
    class Meta:
        model = TradeActivity
        fields = '__all__'