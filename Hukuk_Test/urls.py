from django.contrib import admin
from django.urls import path, include
from api.views import homepage_view, customer_find_view   # Ana sayfa view'unu import edin

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # 'api/' prefiksini ekleyen yol
    path('homepage/', homepage_view, name='homepage'),  # Ana sayfa URL'si
    path('', include('api.urls')),  # Burada uygulamanızın adını kullanın
    path('customerFind/', customer_find_view, name='customer_find'),

]
