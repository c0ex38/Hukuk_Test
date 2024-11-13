from django.shortcuts import redirect
from django.contrib.auth import logout
from api.firebase.firebase_client import logout


def logout_view(request):
    username = request.session.get('username')
    if username:
        logout(username)
    logout(request)
    return redirect("https://talipsan.com.tr/")
