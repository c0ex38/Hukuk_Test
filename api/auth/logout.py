from django.shortcuts import redirect
from django.contrib.auth import logout as django_logout
from api.firebase.firebase_client import logout as firebase_logout


def logout_view(request):
    try:
        # Session'dan username'i al
        username = request.session.get('username')

        # Eğer username varsa Firebase logout işlemini yap
        if username:
            firebase_logout(username)

        # Django session'ı temizle
        django_logout(request)
        request.session.flush()

    except Exception as e:
        print(f"Logout error: {str(e)}")

    return redirect("https://talipsan.com.tr/")