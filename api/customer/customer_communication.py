import json
from typing import Optional, Dict

from asgiref.sync import sync_to_async
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt

from .base import get_aiohttp_session
from ..auth.session_manager import SessionManager


class CustomerCommunicationService:
    BASE_URL = "http://176.236.176.155:1260"
    PROCEDURE_NAME = "[360Portal].dbo.CustomerService_addCustomerPhone"

    @classmethod
    def build_procedure_params(cls, data: Dict) -> Dict:
        """Prosedür parametrelerini oluştur"""
        required_fields = ['CustomerCode', 'CommunicationTypeCode', 'CommAddress', 'username']
        parameters = [{"Name": field, "Value": data.get(field)} for field in required_fields]

        return {
            "ProcName": cls.PROCEDURE_NAME,
            "Parameters": parameters
        }

    @classmethod
    async def add_communication(cls, session_id: str, data: Dict) -> Optional[Dict]:
        """İletişim bilgisi ekle"""
        procedure_info = cls.build_procedure_params(data)
        procedure_url = f"{cls.BASE_URL}/(S({session_id}))/IntegratorService/RunProc"

        session = await get_aiohttp_session()
        async with session.post(procedure_url, json=procedure_info, timeout=30) as response:
            if response.status == 200:
                return await response.json()
            else:
                return None


@csrf_exempt
async def add_customer_phone(request):
    """Müşteri iletişim bilgisi ekleme view fonksiyonu"""
    try:
        if request.method != 'POST':
            return JsonResponse({"error": "Sadece POST istekleri destekleniyor"}, status=405)

        # Request body'i asenkron olarak oku
        body = await sync_to_async(request.body.decode)('utf-8')
        data = json.loads(body)

        # Gerekli alanları kontrol et
        required_fields = ['CustomerCode', 'CommunicationTypeCode', 'CommAddress', 'username']
        missing_fields = [field for field in required_fields if not data.get(field)]

        if missing_fields:
            return JsonResponse({"error": f"Eksik alanlar: {', '.join(missing_fields)}"}, status=400)

        # Session ID al
        session_id = await SessionManager.get_session_id_from_api(SessionManager.DEFAULT_CREDENTIALS)
        if not session_id:
            return JsonResponse({"error": "Session ID alınamadı."}, status=500)

        # İletişim bilgisini ekle
        result = await CustomerCommunicationService.add_communication(session_id, data)

        if result is None:
            return JsonResponse({"error": "İletişim bilgisi eklenemedi."}, status=500)

        return JsonResponse(result, safe=False)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Geçersiz JSON formatı"}, status=400)
    except Exception as e:
        return JsonResponse({"error": f"Beklenmeyen bir hata oluştu: {str(e)}"}, status=500)
