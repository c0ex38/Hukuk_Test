from django.urls import path

from .views import (
    LoginWithTokenView,
    get_session_id,
    fetch_customer_details,
    customer_search_view,
    add_customer_communication,
    customer_note_view,
    homepage,
    get_customer_attributes_list,
    add_customer_attribute,
    AddPhoneLogView,
    CallHistoryListenerView,
    GetCustomerNoteCategoriesView,
)

urlpatterns = [
    path('login-with-token/', LoginWithTokenView.as_view(), name='login_with_token'),
    path('get-session-id/', get_session_id, name='get_session_id'),
    path('fetch-customer-details/<str:customer_code>/', fetch_customer_details, name='fetch_customer_details'),
    path('customer-search/', customer_search_view, name='customer_search'),
    path('add-customer-communication/', add_customer_communication, name='add_customer_communication'),
    path('add-customer-notes1/', customer_note_view, name='add_customer_notes1'),
    path('homepage/', homepage, name='homepage'),
    path('get-customer-attribute-list/<int:attribute_type_code>/', get_customer_attributes_list, name='get_customer_attributes_list'),
    path('add-customer-attribute/', add_customer_attribute, name='add_customer_attribute'),
    path('api/add-phone-log/<str:username>/', AddPhoneLogView.as_view(), name='add_phone_log'),
    path('api/call-history-listener/<str:username>/', CallHistoryListenerView.as_view(), name='call_history_listener'),
    path('api/get-customer-note-categories/', GetCustomerNoteCategoriesView.as_view(), name='get_customer_note_categories'),
]