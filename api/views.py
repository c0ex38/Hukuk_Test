from django.shortcuts import render


def homepage(request):
    # Eğer kullanıcı giriş yapmamışsa
    if 'username' not in request.session:
        return render(request, 'access_denied.html')  # Erişim yok sayfasına yönlendir

    # Kullanıcı giriş yapmışsa devam et
    username = request.session.get('username')
    context = {
        'username': username
    }
    return render(request, 'homepage.html', context)


def customer_find_view(request):
    return render(request, 'customer_find.html')


def call_result(request):
    return render(request, 'call_result.html')


def access_denied(request):
    return render(request, 'access_denied.html')
