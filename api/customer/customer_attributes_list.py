import json
from typing import Optional, Dict
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from asgiref.sync import sync_to_async
from django.core.cache import cache
from ..auth.session_manager import SessionManager
from .base import get_aiohttp_session

# Temel ayarlar
BASE_URL = "http://176.236.176.155:1260"
PROCEDURE_NAME = "[360Portal].dbo.CustomerService_getCustomerAttributesList"
CACHE_TIMEOUT = 3600  # 1 saat


# Önbellek anahtarı oluşturucu
def get_cache_key(attribute_type_code: str) -> str:
    return f"customer_attributes_list_{attribute_type_code}"


# Öznitelikleri al
async def get_attributes(session_id: str, attribute_type_code: str) -> Optional[Dict]:
    cache_key = get_cache_key(attribute_type_code)
    cached_data = await sync_to_async(cache.get)(cache_key)
    if cached_data:
        return cached_data

    procedure_info = {
        "ProcName": PROCEDURE_NAME,
        "Parameters": [{"Name": "AttributeTypeCode", "Value": attribute_type_code}]
    }
    procedure_url = f"{BASE_URL}/(S({session_id}))/IntegratorService/RunProc"

    session = await get_aiohttp_session()
    async with session.post(procedure_url, json=procedure_info, timeout=30) as response:
        if response.status == 200:
            data = await response.json()
            await sync_to_async(cache.set)(cache_key, data, CACHE_TIMEOUT)
            return data
    return None


@csrf_exempt
async def get_customer_attributes_list(request, attribute_type_code):
    """Müşteri öznitelik listesini getiren view fonksiyonu"""
    if request.method != 'GET':
        return JsonResponse({"error": "Sadece GET istekleri destekleniyor"}, status=405)

    session_id = await SessionManager.get_session_id_from_api(SessionManager.DEFAULT_CREDENTIALS)
    if not session_id:
        return JsonResponse({"error": "Session ID alınamadı."}, status=500)

    attributes = await get_attributes(session_id, attribute_type_code)
    if attributes is None:
        return JsonResponse({"error": f"Öznitelikler alınamadı: {attribute_type_code}"}, status=500)

    return JsonResponse(attributes, safe=False)
