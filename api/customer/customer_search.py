from typing import Dict, Optional, List
from asgiref.sync import sync_to_async
from django.http import JsonResponse
from .base import get_aiohttp_session, get_cached_data, set_cached_data, get_session_id
from ..auth.session_manager import SessionManager


class CustomerSearchService:
    BASE_URL = "http://176.236.176.155:1260"
    CACHE_TIMEOUT = 300

    @staticmethod
    def get_cache_key(params: Dict) -> str:
        param_str = '_'.join(f"{k}:{v}" for k, v in sorted(params.items()) if v)
        return f"customer_search_{param_str}"

    @classmethod
    def build_procedure_params(cls, username: str, **kwargs) -> Dict:
        base_params = [{"Name": "ClientId", "Value": username}]
        param_mapping = {
            'customerCode': 'Customercode',
            'identityNum': 'IdentityNum',
            'name': 'Name',
            'surname': 'Surname',
            'fatherName': 'FatherName',
            'motherName': 'MotherName',
            'phone': 'Phone'
        }

        additional_params = [
            {"Name": param_name, "Value": kwargs[key]}
            for key, param_name in param_mapping.items()
            if kwargs.get(key)
        ]

        return {
            "ProcName": "[360Portal].dbo.CustomerService_getCustomers",
            "Parameters": base_params + additional_params
        }

    @classmethod
    async def run_proc(
            cls,
            session_id: str,
            username: str,
            **kwargs
    ) -> Optional[List[Dict]]:
        cache_key = cls.get_cache_key({'username': username, **kwargs})

        cached_result = await get_cached_data(cache_key)
        if cached_result:
            return cached_result

        procedure_info = cls.build_procedure_params(username, **kwargs)
        procedure_url = f"{cls.BASE_URL}/(S({session_id}))/IntegratorService/RunProc"

        session = await get_aiohttp_session()
        try:
            async with session.post(procedure_url, json=procedure_info, timeout=30) as response:
                if response.status == 200:
                    result = await response.json()
                    processed_result = cls.process_customer_data(result)
                    await set_cached_data(cache_key, processed_result, cls.CACHE_TIMEOUT)
                    return processed_result
                else:
                    return None
        except Exception:
            return None

    @staticmethod
    def process_customer_data(customers: List[Dict]) -> List[Dict]:
        for customer in customers:
            customer['PhoneList'] = (
                customer.get('Phone', '').split(',')
                if customer.get('Phone')
                else []
            )
        return customers


# Oturumdaki username bilgisini asenkron olarak alma
async def get_username_from_session(request):
    return await sync_to_async(request.session.get)('username')


async def customer_search(request):
    try:
        if request.method != 'GET':
            return JsonResponse({"error": "Sadece GET istekleri destekleniyor"}, status=405)

        # Asenkron olarak oturumdan username bilgisini al
        username = await get_username_from_session(request)
        if not username:
            return JsonResponse({"error": "Kullanıcı oturum açmamış."}, status=403)

        # Tek bir `get_session_id` işlevini kullanarak `session_id` alıyoruz.
        session_id = await SessionManager.get_session_id_from_api(SessionManager.DEFAULT_CREDENTIALS)
        if not session_id:
            return JsonResponse({"error": "Session ID alınamadı."}, status=500)

        # URL parametrelerini al
        search_params = {
            'customerCode': request.GET.get('customerCode'),
            'identityNum': request.GET.get('identityNum'),
            'name': request.GET.get('name'),
            'surname': request.GET.get('surname'),
            'fatherName': request.GET.get('fatherName'),
            'motherName': request.GET.get('motherName'),
            'phone': request.GET.get('phone')
        }

        # Prosedürü çalıştır
        result = await CustomerSearchService.run_proc(
            session_id,
            username,
            **search_params
        )

        if result is None:
            return JsonResponse({"error": "Müşteri araması başarısız."}, status=500)

        return JsonResponse({"result": result})

    except Exception as e:
        return JsonResponse({"error": f"Beklenmeyen bir hata oluştu: {str(e)}"}, status=500)


# Test amacıyla username veriyoruz
# async def get_username_from_session(request):
#    # Bu satırı test için manuel bir kullanıcı adı ile değiştiriyoruz
#    return '005'
