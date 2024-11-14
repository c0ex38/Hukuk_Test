import asyncio
from django.http import JsonResponse
from ..auth.session_manager import SessionManager
from .base import get_aiohttp_session, get_cached_data, set_cached_data, close_aiohttp_session


class CustomerDetailService:
    BASE_URL = "http://176.236.176.155:1260"
    CACHE_TIMEOUT = 300

    PROCEDURES = {
        "customer_details": "[360Portal].dbo.CustomerService_getCustomerDetail",
        "customer_phones": "[360Portal].dbo.CustomerService_getCustomerPhones",
        "customer_notes1": "[360Portal].dbo.CustomerService_getCustomerNotes1",
        "customer_notes2": "[360Portal].dbo.CustomerService_getCustomerNotes2",
        "customer_attributes": "[360Portal].dbo.CustomerService_getCustomerAttributes",
        "customer_messages": "[360Portal].dbo.CustomerService_getCustomerMessages",
        "customer_addresses": "[360Portal].dbo.CustomerService_getCustomerAddresses",
        "customer_installments": "[360Portal].dbo.CustomerService_getCustomerInstallments",
    }

    @classmethod
    async def run_procedure(cls, session_id, proc_name, customer_code):
        cache_key = f"customer_data_{customer_code}_{proc_name}"
        cached_data = await get_cached_data(cache_key)
        if cached_data:
            return cached_data

        procedure_info = {
            "ProcName": proc_name,
            "Parameters": [{"Name": "Customercode", "Value": customer_code}]
        }
        url = f"{cls.BASE_URL}/(S({session_id}))/IntegratorService/RunProc"

        try:
            session = await get_aiohttp_session()
            async with session.post(url, json=procedure_info, timeout=30) as response:
                if response.status == 200:
                    data = await response.json()
                    await set_cached_data(cache_key, data, cls.CACHE_TIMEOUT)
                    return data
                return None
        except Exception as e:
            print(f"Error in run_procedure: {str(e)}")
            return None


async def _execute_customer_detail(request, customer_code: str):
    session_id = await SessionManager.get_session_id_from_api(SessionManager.DEFAULT_CREDENTIALS)
    if not session_id:
        return JsonResponse({"error": "Session ID alınamadı"}, status=500)

    tasks = [
        CustomerDetailService.run_procedure(session_id, proc_name, customer_code)
        for proc_name in CustomerDetailService.PROCEDURES.values()
    ]

    try:
        results = await asyncio.gather(*tasks)
        data = {name: result for name, result in zip(CustomerDetailService.PROCEDURES.keys(), results)}
        return JsonResponse(data)
    except Exception as e:
        print(f"Error in customer_detail: {str(e)}")
        return JsonResponse({"error": str(e)}, status=500)
    finally:
        await close_aiohttp_session()


async def customer_detail(request, customer_code: str):
    try:
        loop = asyncio.get_running_loop()
    except RuntimeError:
        loop = asyncio.new_event_loop()
        asyncio.set_event_loop(loop)

    try:
        return await _execute_customer_detail(request, customer_code)
    except Exception as e:
        print(f"Unexpected error: {str(e)}")
        return JsonResponse({"error": "Beklenmeyen bir hata oluştu"}, status=500)
