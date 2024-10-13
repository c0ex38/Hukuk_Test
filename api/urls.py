from django.urls import path

from .views import (
    LoginWithTokenView,
    get_session_id,
    fetch_customer_details,
    customer_search_view,
    add_customer_communication,
    customer_note_view,
    ana_sayfa_view,

)

urlpatterns = [
    path('login-with-token/', LoginWithTokenView.as_view(), name='login_with_token'),
    path('get-session-id/', get_session_id, name='get_session_id'),
    path('fetch-customer-details/<str:customer_code>/', fetch_customer_details, name='fetch_customer_details'),
    path('customer-search/', customer_search_view, name='customer_search'),
    path('add-customer-communication/', add_customer_communication, name='add_customer_communication'),
    path('add-customer-notes1/', customer_note_view, name='add_customer_notes1'),
    path('ana_sayfa/', ana_sayfa_view, name='ana_sayfa'),  # Ana sayfa URL'si
    path('customer-search/', customer_search_view, name='customer_search'),
]