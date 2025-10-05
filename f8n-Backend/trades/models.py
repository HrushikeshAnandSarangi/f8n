from django.db import models
from django.conf import settings

class TradeActivity(models.Model):
    TRADE_TYPES = [
        ('BUY', 'Buy'),
        ('SELL', 'Sell'),
    ]

    ASSET_TYPE = [
        ('STOCK', 'Stock'),
        ('MF', 'Mutual Fund'),
        ('CRYPTO', 'Cryptocurrency'),
    ]

    STATUS = [
        ('Success', 'Success'),
        ('Pending', 'Pending'),
        ('Failed', 'Failed'),
    ]

    ORDER_TYPES = [
        ('MARKET', 'Market'),
        ('LIMIT', 'Limit'),
        ('STOP_LOSS', 'Stop Loss'),
    ]

    user = models.ForeignKey(settings.AUTH_USER_MODEL, on_delete=models.CASCADE)
    trade_type = models.CharField(max_length=4, choices=TRADE_TYPES)
    asset_type = models.CharField(max_length=20, choices=ASSET_TYPE)
    asset_name = models.CharField(max_length=100)
    quantity = models.DecimalField(max_digits=10, decimal_places=2)
    price = models.DecimalField(max_digits=15, decimal_places=2)
    total_amount = models.DecimalField(max_digits=20, decimal_places=2)
    timestamp = models.DateTimeField(auto_now_add=True)
    status = models.CharField(max_length=20, choices=STATUS)
    order_type = models.CharField(max_length=10, choices=ORDER_TYPES)

    def __str__(self):
        return f"{self.user} - {self.trade_type} {self.quantity} {self.asset_name} at {self.price}"