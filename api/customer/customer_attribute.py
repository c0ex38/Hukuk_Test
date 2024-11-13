# api/customer/customer_attribute.py
import json
from typing import Optional, Dict
import aiohttp
from asgiref.sync import sync_to_async
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ..auth.session_manager import SessionManager
from .base import get_aiohttp_session


class CustomerAttributeService:
    BASE_URL = "http://176.236.176.155:1260"
    PROCEDURE_NAME = "[360Portal].dbo.CustomerService_addCustomerAttribute"
    REQUIRED_FIELDS = ['CustomerCode', 'AttributeTypeCode', 'AttributeCode', 'username']

    @classmethod
    async def add_attribute(cls, session_id: str, data: Dict) -> Optional[Dict]:
        procedure_info = {
            "ProcName": cls.PROCEDURE_NAME,
            "Parameters": [
                {"Name": "CustomerCode", "Value": data.get("CustomerCode")},
                {"Name": "AttributeTypeCode", "Value": data.get("AttributeTypeCode")},
                {"Name": "AttributeCode", "Value": data.get("AttributeCode")},
                {"Name": "username", "Value": data.get("username")}
            ]
        }

        procedure_url = f"{cls.BASE_URL}/(S({session_id}))/IntegratorService/RunProc"
        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(procedure_url, json=procedure_info, timeout=30) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        return None
            except Exception:
                return None


@csrf_exempt
async def add_customer_attribute(request):
    """Müşteri öznitelik ekleme view fonksiyonu"""
    try:
        if request.method != 'POST':
            return JsonResponse({"error": "Sadece POST istekleri destekleniyor"}, status=405)

        body = await sync_to_async(request.body.decode)('utf-8')
        data = json.loads(body)

        # Gerekli alanları kontrol et
        missing_fields = [field for field in CustomerAttributeService.REQUIRED_FIELDS if not data.get(field)]
        if missing_fields:
            return JsonResponse({"error": f"Eksik alanlar: {', '.join(missing_fields)}"}, status=400)

        # Session ID al
        session_id = await CustomerAttributeService.get_session_id()
        if not session_id:
            return JsonResponse({"error": "Session ID alınamadı."}, status=500)

        # Özniteliği ekle
        result = await CustomerAttributeService.add_attribute(session_id, data)
        if result is None:
            return JsonResponse({"error": "Öznitelik eklenemedi."}, status=500)

        return JsonResponse(result)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Geçersiz JSON formatı"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"Beklenmeyen hata: {str(e)}"}, status=500)
