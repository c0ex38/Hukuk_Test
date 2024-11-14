from django.shortcuts import render


def homepage(request):
    # Eğer kullanıcı giriş yapmamışsa
    if 'username' not in request.session:
        return render(request, 'pages/access_denied.html')  # Erişim yok sayfasına yönlendir

    # Kullanıcı giriş yapmışsa devam et
    username = request.session.get('username')
    context = {
        'username': username
    }
    return render(request, 'pages/homepage.html', context)


def customer_search(request):
    return render(request, 'pages/customer_search.html')



def call_result(request):
    return render(request, 'pages/call_result.html')


def access_denied(request):
    return render(request, 'pages/access_denied.html')


def test_page(request):
    return render(request, 'pages/test.html')
