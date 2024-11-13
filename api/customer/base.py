import aiohttp
from asgiref.sync import sync_to_async
from django.core.cache import cache

# Kalıcı aiohttp oturum nesnesi
session = None


# Oturum oluşturma ve kapatma
async def get_aiohttp_session():
    global session
    if session is None or session.closed:
        session = aiohttp.ClientSession()
    return session


async def close_aiohttp_session():
    """Uygulama kapanırken veya oturum resetlenmesi gerektiğinde çağrılabilir."""
    global session
    if session and not session.closed:
        await session.close()


# Önbellekten veri alma, isteğe bağlı varsayılan değer ile
async def get_cached_data(cache_key: str, default=None):
    try:
        return await sync_to_async(cache.get)(cache_key, default)
    except Exception:
        return default


# Önbelleğe veri ekleme
async def set_cached_data(cache_key: str, data, timeout: int):
    await sync_to_async(cache.set)(cache_key, data, timeout)


# API'den Session ID alma
async def get_session_id(api_url: str):
    session = await get_aiohttp_session()
    try:
        async with session.get(api_url, timeout=10) as response:
            if response.status == 200:
                data = await response.json()
                return data.get("session_id")
    except Exception:
        return None
    return None
