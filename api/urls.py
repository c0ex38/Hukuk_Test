from django.urls import path

from .auth.login import login_view
from .customer.get_session_id import get_session_id
from .customer.customer_detail import customer_detail
from .customer.customer_search import customer_search
from .customer.customer_communication import add_customer_phone
from .customer.customer_note_category import get_customer_note_categories
from .customer.customer_attributes_list import get_customer_attributes_list
from .customer.customer_note import add_customer_note
from .customer.customer_attribute import add_customer_attribute

urlpatterns = [
    path('login/', login_view, name='login_view'),
    path('session/', get_session_id, name='get_session_id'),
    path('customer-detail/<str:customer_code>/', customer_detail, name='customer_detail'),
    path('customer-search/', customer_search, name='customer_search'),
    path('add-customer-phone/', add_customer_phone, name='add_customer_phone'),
    path('add-customer-note', add_customer_note, name='add_customer_note'),
    path('get-customer-attribute-list/<int:attribute_type_code>/', get_customer_attributes_list, name='get_customer_attributes_list'),
    path('add-customer-attribute/', add_customer_attribute, name='add_customer_attribute'),
    path('get-customer-note-categories/', get_customer_note_categories, name='get_customer_note_categories'),
]
