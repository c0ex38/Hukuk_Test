# views.py
from django.shortcuts import render
from django.views.decorators.cache import never_cache


@never_cache
def homepage(request):
    context = {
        'username': request.session.get('username')
    }
    return render(request, 'pages/homepage.html', context)


@never_cache
def customer_search(request):
    context = {
        'username': request.session.get('username')
    }
    return render(request, 'pages/customer_search.html', context)


def access_denied(request):
    return render(request, 'pages/access_denied.html')
