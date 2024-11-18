# middleware.py
from django.shortcuts import redirect, render


class AuthMiddleware:
    def __init__(self, get_response):
        self.get_response = get_response

    def __call__(self, request):
        # Oturum kontrolü gerektirmeyen sayfalar
        public_paths = ['/login/', '/api/login/', '/access-denied/']

        # Eğer sayfa public değilse ve oturum yoksa
        if request.path not in public_paths and 'username' not in request.session:
            return redirect('/access-denied/')  # veya render(request, 'pages/access_denied.html')

        response = self.get_response(request)

        # Cache kontrolü
        response['Cache-Control'] = 'no-cache, no-store, must-revalidate'
        response['Pragma'] = 'no-cache'
        response['Expires'] = '0'

        return response