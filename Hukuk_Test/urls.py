from django.contrib import admin
from django.urls import path, include
from api.views import ana_sayfa_view  # Ana sayfa view'unu import edin

urlpatterns = [
    path('admin/', admin.site.urls),
    path('api/', include('api.urls')),  # 'api/' prefiksini ekleyen yol
    path('ana_sayfa/', ana_sayfa_view, name='ana_sayfa'),  # Ana sayfa URL'si
]
