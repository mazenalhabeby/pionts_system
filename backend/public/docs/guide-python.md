# Python Integration

For Django, Flask, FastAPI, or any Python backend.

## Client Class

```python
import os, requests, hmac, hashlib

class PiontsClient:
    def __init__(self):
        self.base = os.environ['PIONTS_API_URL'] + '/api/v2'
        self.headers = {
            'Content-Type': 'application/json',
            'X-Api-Key': os.environ['PIONTS_SECRET_KEY'],
        }

    def validate(self, code: str) -> dict:
        r = requests.post(f'{self.base}/checkout/validate',
                          json={'code': code}, headers=self.headers, timeout=10)
        return r.json()

    def mark_used(self, code: str):
        requests.post(f'{self.base}/checkout/mark-used',
                      json={'code': code}, headers=self.headers, timeout=10)

    def order_paid(self, order_id, email, total, currency='EUR'):
        requests.post(f'{self.base}/orders/paid', json={
            'orderId': order_id, 'email': email,
            'orderTotal': total, 'currency': currency,
        }, headers=self.headers, timeout=10)

    def order_refunded(self, order_id, amount):
        requests.post(f'{self.base}/orders/refunded', json={
            'orderId': order_id, 'refundAmount': amount,
        }, headers=self.headers, timeout=10)

    @staticmethod
    def widget_hmac(email: str) -> str:
        secret = os.environ['PIONTS_HMAC_SECRET']
        return hmac.new(secret.encode(), email.encode(), hashlib.sha256).hexdigest()

pionts = PiontsClient()
```

## Django Example

```python
# views.py
from .pionts import pionts
from django.http import JsonResponse

def checkout_validate(request):
    code = request.POST.get('code')
    result = pionts.validate(code)
    if result.get('valid'):
        request.session['loyalty_discount'] = result['discountAmount']
    return JsonResponse(result)

def payment_success(request, order):
    pionts.order_paid(str(order.id), order.email, float(order.total))
    if order.loyalty_code:
        pionts.mark_used(order.loyalty_code)
```

## Flask Example

```python
from flask import request, jsonify
from .pionts import pionts

@app.route('/checkout/validate', methods=['POST'])
def validate():
    code = request.json.get('code')
    return jsonify(pionts.validate(code))
```
