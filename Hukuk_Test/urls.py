from django.contrib import admin
from django.urls import path, include
from api import views
from api.auth import login, logout

urlpatterns = [
    path('', views.homepage, name='homepage'),
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('user-panel/', login.user_panel, name='user_panel'),
    path('logout/', logout.logout_view, name='logout'),
    path('homepage/', views.homepage, name='homepage'),
    path('customer_search/', views.customer_search, name='customer_search'),
    path('call_result/', views.call_result, name='call_result'),
    path('access-denied/', views.access_denied, name='access_denied'),
    path('test/', views.test_page, name='test_page'),
]
