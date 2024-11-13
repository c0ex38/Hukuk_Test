from typing import Optional, Dict

from asgiref.sync import sync_to_async
from django.core.cache import cache
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .base import get_aiohttp_session
from ..auth.session_manager import SessionManager

# Prosedür ve önbellek ayarları
BASE_URL = "http://176.236.176.155:1260"
PROCEDURE_NAME = "[360Portal].dbo.CustomerService_getCustomerNoteCategories"
CACHE_KEY = "customer_note_categories"
CACHE_TIMEOUT = 3600


# Kategorileri önbellekten veya API'den al
async def CustomerNoteCategories(session_id: str) -> Optional[Dict]:
    cached_data = await sync_to_async(cache.get)(CACHE_KEY)
    if cached_data:
        return cached_data

    procedure_info = {"ProcName": PROCEDURE_NAME, "Parameters": []}
    procedure_url = f"{BASE_URL}/(S({session_id}))/IntegratorService/RunProc"

    session = await get_aiohttp_session()
    async with session.post(procedure_url, json=procedure_info, timeout=30) as response:
        if response.status == 200:
            data = await response.json()
            await sync_to_async(cache.set)(CACHE_KEY, data, CACHE_TIMEOUT)
            return data
    return None


@csrf_exempt
async def get_customer_note_categories(request):
    if request.method != 'GET':
        return JsonResponse({"error": "Sadece GET istekleri destekleniyor"}, status=405)

    session_id = await SessionManager.get_session_id_from_api(SessionManager.DEFAULT_CREDENTIALS)
    if not session_id:
        return JsonResponse({"error": "Session ID alınamadı."}, status=500)

    categories = await CustomerNoteCategories(session_id)
    if categories is None:
        return JsonResponse({"error": "Kategoriler alınamadı."}, status=500)

    return JsonResponse(categories, safe=False)
