from typing import Optional, Dict

from .base import get_aiohttp_session
import asyncio
from django.http import JsonResponse
from django.views.decorators.csrf import csrf_exempt
import json
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
        """Add communication information"""
        procedure_info = cls.build_procedure_params(data)
        procedure_url = f"{cls.BASE_URL}/(S({session_id}))/IntegratorService/RunProc"

        print("Request URL:", procedure_url)  # Debug
        print("Request Payload:", procedure_info)  # Debug

        session = await get_aiohttp_session()
        async with session.post(procedure_url, json=procedure_info, timeout=30) as response:
            if response.status == 200:
                result = await response.json()
                print("Raw Response from API:", result)  # Debug
                return result
            else:
                print("API Error:", response.status)  # Debug
                return None


@csrf_exempt
def add_customer_phone(request):
    """Function to add customer phone with actual data service."""
    try:
        print("Step 1: Starting function")  # Debug
        if request.method != 'POST':
            print("Error: Not a POST request")  # Debug
            return JsonResponse({"error": "Only POST requests are supported"}, status=405)

        # Read and decode the request body
        print("Step 2: Reading request body")  # Debug
        body = request.body.decode('utf-8')
        data = json.loads(body)

        # Check for required fields
        print("Step 3: Checking required fields")  # Debug
        required_fields = ['CustomerCode', 'CommunicationTypeCode', 'CommAddress', 'username']
        missing_fields = [field for field in required_fields if not data.get(field)]

        if missing_fields:
            print(f"Error: Missing fields - {missing_fields}")  # Debug
            return JsonResponse({"error": f"Missing fields: {', '.join(missing_fields)}"}, status=400)

        # Obtain session ID using asyncio.run to create a new event loop
        print("Step 4: Getting session ID")  # Debug
        session_id = asyncio.run(SessionManager.get_session_id_from_api(SessionManager.DEFAULT_CREDENTIALS))
        if not session_id:
            print("Error: Unable to retrieve Session ID")  # Debug
            return JsonResponse({"error": "Unable to retrieve Session ID"}, status=500)

        print(f"Session ID obtained: {session_id}")  # Debug

        # Call the actual service to add communication data using asyncio.run
        print("Step 5: Calling add_communication")  # Debug
        result = asyncio.run(CustomerCommunicationService.add_communication(session_id, data))
        print("Result from add_communication:", result)

        if result is None:
            print("Error: add_communication returned None")  # Debug
            return JsonResponse({"error": "Failed to add communication data"}, status=500)

        print("Step 6: Successfully added communication data")  # Debug
        return JsonResponse(result, safe=False)

    except json.JSONDecodeError:
        print("Error: Invalid JSON format")  # Debug
        return JsonResponse({"error": "Invalid JSON format"}, status=400)
    except Exception as e:
        print(f"Error: An unexpected error occurred - {str(e)}")  # Debug
        return JsonResponse({"error": f"An unexpected error occurred: {str(e)}"}, status=500)

    print("End of function reached unexpectedly")  # Debug
    return JsonResponse({"error": "Unhandled error occurred"}, status=500)
