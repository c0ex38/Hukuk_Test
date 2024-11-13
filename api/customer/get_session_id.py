from django.http import JsonResponse
from ..auth.session_manager import SessionManager
from django.views.decorators.csrf import csrf_exempt


@csrf_exempt
async def get_session_id(request):
    """Session ID'yi almak için API endpoint"""
    try:
        # Cache key based on default credentials
        cache_key = SessionManager.get_cache_key(
            SessionManager.DEFAULT_CREDENTIALS["username"],
            SessionManager.DEFAULT_CREDENTIALS["UserGroupCode"]
        )

        # Cache'ten session ID'yi kontrol et
        cached_session_id = await SessionManager.get_cache(cache_key)
        if cached_session_id:
            return JsonResponse({"session_id": cached_session_id})

        # Cache'te yoksa API'den session ID'yi al
        session_id = await SessionManager.get_session_id_from_api(SessionManager.DEFAULT_CREDENTIALS)
        if session_id:
            await SessionManager.set_cache(cache_key, session_id)
            return JsonResponse({"session_id": session_id})

        # Hala alınamadıysa hata döndür
        return JsonResponse({"error": "Session ID alınamadı"}, status=500)

    except Exception as e:
        return JsonResponse({"error": f"Beklenmeyen hata: {str(e)}"}, status=500)
