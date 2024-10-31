from django.contrib import admin
from django.urls import path, include
from django.contrib.auth import views as auth_views
from api import views

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),
    path('user-panel/', views.user_panel, name='user_panel'),
    path('logout/', views.logout_view, name='logout'),
    path('homepage/', views.homepage, name='homepage'),
    path('customer_find/', views.customer_find_view, name='customer_find'),
    path('call_result/', views.call_result, name='call_result'),
    path('access-denied/', views.access_denied, name='access_denied'),

]
