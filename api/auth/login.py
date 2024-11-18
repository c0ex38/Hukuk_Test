import os
import json
import http.client
from django.shortcuts import redirect, render
from django.http import JsonResponse, HttpResponseForbidden
from django.views.decorators.cache import never_cache
from django.conf import settings
from rest_framework import status
from api.firebase.firebase_client import login


class APIConnection:
    def __init__(self):
        self.conn = http.client.HTTPSConnection("talipsan.com.tr")
        self.headers = {
            'Content-Type': 'application/json',
            'Authorization': os.getenv("AUTHORIZATION_KEY", "Basic Y2Fncmkub3pheTpDYWdyaTIwMjQ="),
            'Cookie': f'PHPSESSID={os.getenv("COOKIE_PHPSESSID", "pnkquosabd9r2j5vi73n71id05")}'
        }

    def close(self):
        if self.conn:
            self.conn.close()

    def make_request(self, payload):
        try:
            self.conn.request("POST", "/restapi?key=1837837", payload, self.headers)
            return self.conn.getresponse()
        except Exception as e:
            print(f"API Request Error: {str(e)}")
            raise


@never_cache
def login_view(request):
    try:
        # Token kontrolü
        token = request.GET.get("Token", "").strip()
        if not token:
            return JsonResponse(
                {"error": "Token is required."},
                status=status.HTTP_400_BAD_REQUEST
            )

        # API isteği için veri hazırlama
        payload = json.dumps({
            "Service": "LoginWithToken",
            "Request": "LoginWithToken",
            "Token": token
        })

        # API bağlantısı oluştur
        api_conn = APIConnection()
        try:
            response = api_conn.make_request(payload)

            # Yanıt durum kontrolü
            if response.status != 200:
                return JsonResponse(
                    {"error": "API request failed."},
                    status=response.status
                )

            # Yanıt işleme
            response_data = json.loads(response.read().decode('utf-8'))
            if 'username' not in response_data:
                return JsonResponse(
                    {"error": response_data.get('error', 'Invalid response format')},
                    status=status.HTTP_400_BAD_REQUEST
                )

            # Session yönetimi
            request.session['username'] = response_data['username']
            request.session['is_admin'] = request.user.has_perm('modules.customers.admin')
            request.session.set_expiry(settings.SESSION_COOKIE_AGE)  # Session süresini ayarla

            # Firebase login
            login(response_data['username'], request.session['is_admin'])

            # Başarılı yönlendirme
            response = redirect('/user-panel/')
            response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
            response['Pragma'] = 'no-cache'
            response['Expires'] = '0'
            return response

        except json.JSONDecodeError:
            return JsonResponse(
                {"error": "Invalid JSON response from API"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        except Exception as e:
            return JsonResponse(
                {"error": f"An error occurred: {str(e)}"},
                status=status.HTTP_500_INTERNAL_SERVER_ERROR
            )
        finally:
            api_conn.close()

    except Exception as e:
        return JsonResponse(
            {"error": f"Unexpected error: {str(e)}"},
            status=status.HTTP_500_INTERNAL_SERVER_ERROR
        )


@never_cache
def user_panel(request):
    try:
        username = request.session.get('username')
        if not username:
            return redirect('login')  # veya access_denied sayfasına

        context = {
            'username': username,
            'is_admin': request.session.get('is_admin', False)
        }

        response = render(request, 'pages/user_panel.html', context)
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'
        return response

    except Exception as e:
        print(f"User Panel Error: {str(e)}")
        return HttpResponseForbidden("Bir hata oluştu. Lütfen tekrar giriş yapın.")