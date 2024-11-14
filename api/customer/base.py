import aiohttp
import asyncio
from django.core.cache import cache
import contextvars

# Global session nesnesi
_aiohttp_session = None
_session_lock = asyncio.Lock()


async def get_aiohttp_session():
    global _aiohttp_session

    async with _session_lock:
        if _aiohttp_session is None or _aiohttp_session.closed:
            _aiohttp_session = aiohttp.ClientSession()
        return _aiohttp_session


async def close_aiohttp_session():
    global _aiohttp_session
    if _aiohttp_session and not _aiohttp_session.closed:
        try:
            await _aiohttp_session.close()
        except Exception as e:
            print(f"Error closing aiohttp session: {str(e)}")
        _aiohttp_session = None


async def get_cached_data(key):
    return cache.get(key)


async def set_cached_data(key, data, timeout):
    cache.set(key, data, timeout)


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
