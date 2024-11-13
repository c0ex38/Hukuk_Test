import json
from typing import Optional, Dict
import aiohttp
from asgiref.sync import sync_to_async
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ..auth.session_manager import SessionManager
from .base import get_aiohttp_session


class CustomerNoteService:
    BASE_URL = "http://176.236.176.155:1260"
    PROCEDURE_NAME = "[360Portal].dbo.CustomerService_addCustomerNote"
    REQUIRED_FIELDS = ['CustomerCode', 'UserWarningCode', 'CommAddress', 'username', 'Description']

    @classmethod
    def build_description(cls, data: Dict) -> str:
        return (
            f"Görüşülen tel no: {data.get('CommAddress', '')}, "
            f"Kategori: {data.get('UserWarningDescription', '')}, "
            f"Not: {data.get('Description', '')}, "
            f"Kullanıcı: {data.get('username', '')}"
        )

    @classmethod
    async def get_session_id(cls) -> Optional[str]:
        """Session ID al"""
        session = await get_aiohttp_session()
        try:
            async with session.get(SessionManager.SESSION_API_URL, timeout=10) as response:
                if response.status == 200:
                    data = await response.json()
                    return data.get("session_id")
        except Exception:
            return None

    @classmethod
    async def add_note(cls, session_id: str, data: Dict) -> Optional[Dict]:
        description = cls.build_description(data)
        procedure_info = {
            "ProcName": cls.PROCEDURE_NAME,
            "Parameters": [
                {"Name": "CustomerCode", "Value": data.get("CustomerCode")},
                {"Name": "NoteTypeCode", "Value": data.get("UserWarningCode")},
                {"Name": "Description", "Value": description},
                {"Name": "username", "Value": data.get("username")},
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
async def add_customer_note(request):
    """Müşteri notu ekleme view fonksiyonu"""
    try:
        if request.method != 'POST':
            return JsonResponse({"error": "Sadece POST istekleri destekleniyor"}, status=405)

        body = await sync_to_async(request.body.decode)('utf-8')
        data = json.loads(body)

        # Gerekli alanları kontrol et
        missing_fields = [field for field in CustomerNoteService.REQUIRED_FIELDS if not data.get(field)]
        if missing_fields:
            return JsonResponse({"error": f"Eksik alanlar: {', '.join(missing_fields)}"}, status=400)

        # Session ID al
        session_id = await CustomerNoteService.get_session_id()
        if not session_id:
            return JsonResponse({"error": "Session ID alınamadı."}, status=500)

        # Notu ekle
        result = await CustomerNoteService.add_note(session_id, data)
        if result is None:
            return JsonResponse({"error": "Not eklenemedi."}, status=500)

        return JsonResponse(result)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Geçersiz JSON formatı"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"Beklenmeyen hata: {str(e)}"}, status=500)
