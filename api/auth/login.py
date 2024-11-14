import os
import json
import http.client
from django.shortcuts import redirect, render
from django.http import JsonResponse, HttpResponseForbidden
from rest_framework import status
from api.firebase.firebase_client import login

CONN = http.client.HTTPSConnection("talipsan.com.tr")


def login_view(request):
    token = request.GET.get("Token", "").strip()
    if not token:
        return JsonResponse({"error": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)

    # API isteği için JSON verisi hazırlama
    payload = json.dumps({
        "Service": "LoginWithToken",
        "Request": "LoginWithToken",
        "Token": token
    })

    headers = {
        'Content-Type': 'application/json',
        'Authorization': os.getenv("AUTHORIZATION_KEY", "Basic Y2Fncmkub3pheTpDYWdyaTIwMjQ="),
        'Cookie': f'PHPSESSID={os.getenv("COOKIE_PHPSESSID", "pnkquosabd9r2j5vi73n71id05")}'
    }

    try:
        # API isteği gönderme
        CONN.request("POST", "/restapi?key=1837837", payload, headers)
        response = CONN.getresponse()

        # Yanıt durum kodunu kontrol et
        if response.status != 200:
            return JsonResponse({"error": "API request failed."}, status=response.status)

        # Yanıtı JSON olarak ayrıştırma
        response_data = json.loads(response.read().decode('utf-8'))
        if 'username' not in response_data:
            return JsonResponse({"error": response_data.get('error', 'Unknown error')}, status=response.status)

        # Kullanıcı oturum bilgilerini kaydetme
        username = response_data['username']
        request.session['username'] = username
        request.session['is_admin'] = request.user.has_perm('modules.customers.admin')

        # Firebase kaydı
        login(username, request.session['is_admin'])

        # Başarılı girişten sonra yönlendirme
        return redirect('/user-panel/')

    except (http.client.HTTPException, json.JSONDecodeError) as e:
        return JsonResponse({"error": "An error occurred during the API request."},
                            status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    finally:
        # Bağlantıyı güvenlik amacıyla kapatma
        CONN.close()


def user_panel(request):
    # Oturumdan verileri tek seferde çekiyoruz
    session_data = request.session.get('username')
    is_admin = request.session.get('is_admin', False)

    if not session_data:
        return HttpResponseForbidden("Erişim izni yoktur.")

    context = {
        'username': session_data,
        'is_admin': is_admin
    }

    # Kullanıcı paneli sayfasını döndür
    return render(request, 'pages/user_panel.html', context)
