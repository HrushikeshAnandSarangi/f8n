from rest_framework import serializers

class SentimentRequestSerializer(serializers.Serializer):
    ticker = serializers.CharField(max_length=10)

class SentimentPercentageSerializer(serializers.Serializer):
    positive = serializers.FloatField()
    negative = serializers.FloatField()
    neutral = serializers.FloatField()

class SentimentResponseSerializer(serializers.Serializer):
    reddit = SentimentPercentageSerializer()
    news = SentimentPercentageSerializer()