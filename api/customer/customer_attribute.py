import json
from typing import Optional, Dict
import aiohttp
import asyncio
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
from ..auth.session_manager import SessionManager  # Import the SessionManager
import logging

logger = logging.getLogger(__name__)  # Set up logger for error handling

class CustomerAttributeService:
    BASE_URL = "http://176.236.176.155:1260"
    PROCEDURE_NAME = "[360Portal].dbo.CustomerService_addCustomerAttribute"
    REQUIRED_FIELDS = ['CustomerCode', 'AttributeTypeCode', 'AttributeCode', 'username']

    @classmethod
    def build_procedure_params(cls, data: Dict) -> Dict:
        """Build procedure parameters"""
        return {
            "ProcName": cls.PROCEDURE_NAME,
            "Parameters": [
                {"Name": "CustomerCode", "Value": data.get("CustomerCode")},
                {"Name": "AttributeTypeCode", "Value": data.get("AttributeTypeCode")},
                {"Name": "AttributeCode", "Value": data.get("AttributeCode")},
                {"Name": "username", "Value": data.get("username")}
            ]
        }

    @classmethod
    async def add_attribute(cls, session_id: str, data: Dict) -> Optional[Dict]:
        """Add attribute asynchronously"""
        procedure_info = cls.build_procedure_params(data)
        procedure_url = f"{cls.BASE_URL}/(S({session_id}))/IntegratorService/RunProc"

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(procedure_url, json=procedure_info, timeout=30) as response:
                    if response.status == 200:
                        return await response.json()
                    else:
                        logger.error(f"API returned status code {response.status}")
                        return None
            except aiohttp.ClientError as e:
                logger.error(f"Client error during request to {procedure_url}: {e}")
                return None
            except Exception as e:
                logger.error(f"Unexpected error during request to {procedure_url}: {e}")
                return None


@csrf_exempt
def add_customer_attribute(request):
    """Synchronous view function to add a customer attribute"""
    try:
        if request.method != 'POST':
            return JsonResponse({"error": "Only POST requests are supported"}, status=405)

        # Read and decode the request body
        body = request.body.decode('utf-8')
        data = json.loads(body)

        # Check for required fields
        missing_fields = [field for field in CustomerAttributeService.REQUIRED_FIELDS if not data.get(field)]
        if missing_fields:
            return JsonResponse({"error": f"Missing fields: {', '.join(missing_fields)}"}, status=400)

        # Get Session ID using asyncio.run to create a new event loop
        session_id = asyncio.run(SessionManager.get_session_id_from_api(SessionManager.DEFAULT_CREDENTIALS))
        if not session_id:
            return JsonResponse({"error": "Failed to retrieve session ID."}, status=500)

        # Add attribute using CustomerAttributeService, wrapped in asyncio.run
        result = asyncio.run(CustomerAttributeService.add_attribute(session_id, data))
        if result is None:
            return JsonResponse({"error": "Failed to add attribute."}, status=500)

        return JsonResponse(result, safe=False)

    except json.JSONDecodeError:
        return JsonResponse({"error": "Invalid JSON format"}, status=400)
    except Exception as e:
        logger.error(f"Unexpected error in add_customer_attribute view: {e}")
        return JsonResponse({"error": f"Unexpected error: {str(e)}"}, status=500)
