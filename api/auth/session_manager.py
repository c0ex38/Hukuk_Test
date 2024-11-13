import asyncio
import urllib.parse
from typing import Optional, Dict
import aiohttp
from asgiref.sync import sync_to_async
from django.core.cache import cache


class SessionManager:
    CACHE_TIMEOUT = 3600  # 1 hour
    LOGIN_URL = "http://176.236.176.155:1260/IntegratorService/Connect"
    DEFAULT_CREDENTIALS = {
        "ServerName": "176.236.176.155",
        "DatabaseName": "V3_TalipsanAS",
        "UserGroupCode": "DGNM",
        "username": "M999",
        "Password": "30083009"
    }

    @staticmethod
    def build_query_string(data: Dict) -> str:
        return urllib.parse.urlencode(data)

    @staticmethod
    def get_cache_key(username: str, user_group: str) -> str:
        return f"session_id_{username}_{user_group}"

    @classmethod
    async def get_session_id_from_api(cls, credentials: Dict) -> Optional[str]:
        query_string = cls.build_query_string(credentials)
        url = f"{cls.LOGIN_URL}?{query_string}"

        async with aiohttp.ClientSession() as session:
            try:
                async with session.post(url, timeout=10) as response:
                    if response.status == 200:
                        session_data = await response.json()
                        return session_data.get("SessionID")
            except (aiohttp.ClientError, asyncio.TimeoutError):
                return None
        return None

    @classmethod
    async def set_cache(cls, key: str, value: str):
        await sync_to_async(cache.set)(key, value, cls.CACHE_TIMEOUT)

    @classmethod
    async def get_cache(cls, key: str) -> Optional[str]:
        return await sync_to_async(cache.get)(key)
