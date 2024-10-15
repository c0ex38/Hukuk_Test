import http.client
import http.client
import http.client
import json
import logging
import urllib.parse
import urllib.parse
import urllib.parse
from concurrent.futures import ThreadPoolExecutor

import firebase_admin
import requests
from django.http import JsonResponse
from django.shortcuts import redirect
from django.shortcuts import render
from django.views.decorators.csrf import csrf_exempt
from firebase_admin import credentials, db
from rest_framework import status
from rest_framework.response import Response
from rest_framework.views import APIView

# Firebase yapılandırması
cred = credentials.Certificate('api/serviceAccountKey.json')
firebase_admin.initialize_app(cred, {
    'databaseURL': 'https://hukuk-9a8a0-default-rtdb.europe-west1.firebasedatabase.app/'
})


class AddPhoneLogView(APIView):
    def post(self, request, username):
        # Kullanıcı adını ve telefondan gelen veriyi al
        phone_number = request.data.get('phone_number')

        if not phone_number:
            return Response({"error": "Phone number is required."}, status=status.HTTP_400_BAD_REQUEST)

        # Firebase'de kullanıcıya ait call_logs referansını oluştur
        ref = db.reference(f'users/{username}/call_logs')

        # Telefona doğrudan call_logs altında yaz
        try:
            ref.set({'phone_number': phone_number})  # Veriyi doğrudan call_logs altında ayarlayın
            return Response({"message": "Phone log added successfully!"}, status=status.HTTP_201_CREATED)
        except Exception as e:
            return Response({"error": f"Failed to add phone log: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


class CallHistoryListenerView(APIView):
    def post(self, request, username):
        # Gelen veriyi al
        data = request.data

        # Verinin doğru yapıda olup olmadığını kontrol et
        if not isinstance(data, dict) or len(data) == 0:
            return Response({"error": "Invalid data format."}, status=status.HTTP_400_BAD_REQUEST)

        # Her bir çağrıyı işleyin
        for uniq_id, call_info in data.items():
            call_duration = call_info.get('call_duration')
            call_type = call_info.get('call_type')
            caller_id = call_info.get('caller_id')
            phone_number = call_info.get('phone_number')
            status_value = call_info.get('status')

            # Başarıyla alındığında yanıt döndür
            return Response({
                "message": "Call data processed successfully.",
                "redirect": f"/callResult?username={username}&phone_number={phone_number}&status={status_value}&duration={call_duration}"
            }, status=status.HTTP_200_OK)

        return Response({"error": "No valid call data found."}, status=status.HTTP_400_BAD_REQUEST)





class SendDataToFirebase(APIView):
    def post(self, request):
        data = request.data  # İstemciden gelen veriyi al

        # Firebase Realtime Database'e veriyi gönder
        ref = db.reference('your_endpoint')  # Verilerinizi hangi referansa göndereceğinizi belirtin
        ref.push(data)  # Veriyi gönder

        return Response({"message": "Veri başarıyla gönderildi!"}, status=status.HTTP_201_CREATED)



class LoginWithTokenView(APIView):
    def get(self, request):
        # Token'ı URL'den sorgu parametresi olarak al
        token = request.query_params.get("Token")

        # Token kontrolü
        if not token:
            return Response({"error": "Token is required."}, status=status.HTTP_400_BAD_REQUEST)

        token = token.strip()  # Token'daki gereksiz boşlukları ve yeni satırları kaldır
        print(f"Received Token: {token}")  # Debug: Token'ı kontrol et

        # API isteği için payload'ı oluştur
        payload = json.dumps({
            "Service": "LoginWithToken",
            "Request": "LoginWithToken",
            "Token": token
        })

        headers = {
            'Content-Type': 'application/json',
            'Authorization': 'Basic Y2Fncmkub3pheTpDYWdyaTIwMjQ=',
            'Cookie': 'PHPSESSID=pnkquosabd9r2j5vi73n71id05'
        }

        # API'ye istek gönder
        try:
            conn = http.client.HTTPSConnection("talipsan.com.tr")
            conn.request("POST", "/restapi?key=1837837", payload, headers)

            res = conn.getresponse()
            data = res.read()
            status_code = res.status  # HTTP durum kodunu al
            print(f"API Response Status: {status_code}")  # API yanıt durum kodunu kontrol et
            response_data = json.loads(data.decode('utf-8'))  # JSON olarak çözümle

            if status_code == 200:
                username = response_data.get('username')
                if username:
                    request.session['username'] = username
                    print(f"username '{username}' oturuma kaydedildi.")

                    # Kullanıcının admin olup olmadığını kontrol et
                    is_admin = request.user.has_perm('modules.customers.admin')

                    # Kullanıcı bilgilerini Firebase'e kaydet
                    save_user_to_firebase(username, is_admin)

                # Başarılı yanıt sonrası customer_details sayfasına yönlendir
                return redirect('/homepage/')

            return Response(response_data)  # Başarılı yanıtı döndür
        except Exception as e:
            return Response({"error": f"API request failed: {str(e)}"}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)


def save_user_to_firebase(username, is_admin):
    ref = db.reference('users')  # Kullanıcı bilgilerini saklamak için bir referans oluşturun
    user_data = {
        'username': username,
        'is_admin': is_admin
    }

    # Kullanıcı daha önce kaydedilmiş mi kontrol et
    existing_user = ref.child(username).get()
    if not existing_user:
        ref.child(username).set(user_data)  # Yeni kullanıcıyı ekle
        print(f"User '{username}' added to Firebase.")
    else:
        print(f"User '{username}' already exists in Firebase.")


# Query string formatını oluşturan fonksiyon
def build_query_string(data):
    return urllib.parse.urlencode(data)


# Session ID almak için API çağrısı
@csrf_exempt
def get_session_id(request):
    # Oturumda zaten bir session_id var mı kontrol et
    session_id = request.session.get('session_id')
    if session_id:
        logging.debug(f"Mevcut session_id: {session_id}")
        return JsonResponse({"session_id": session_id})  # JsonResponse olarak döndürün

    # Oturumda yoksa yeni session_id al
    data = {
        "ServerName": "176.236.176.155",
        "DatabaseName": "V3_TalipsanAS",
        "UserGroupCode": "DGNM",
        "username": "M999",
        "Password": "30083009"
    }

    query_string = build_query_string(data)
    login_url = f"http://176.236.176.155:1260/IntegratorService/Connect?{query_string}"

    response = requests.post(login_url)

    if response.status_code == 200:
        session_data = response.json()
        session_id = session_data.get("SessionID")
        if session_id:
            # Yeni session_id'yi oturumda sakla ve JsonResponse olarak döndür
            request.session['session_id'] = session_id
            logging.debug(f"Alınan yeni session_id: {session_id}")
            return JsonResponse({"session_id": session_id})  # JsonResponse olarak döndür

    logging.error(f"Session ID alınamadı. Durum kodu: {response.status_code}")
    return JsonResponse({"error": "Session ID alınamadı"}, status=500)  # Hata durumunda JsonResponse döndürün


# Verilen session_id ile prosedürü çalıştıran fonksiyon
def run_procedure(session_id, proc_name, customer_code):
    procedure_info = {
        "ProcName": proc_name,
        "Parameters": [
            {"Name": "Customercode", "Value": customer_code}
        ]
    }

    procedure_url = f"http://176.236.176.155:1260/(S({session_id}))/IntegratorService/RunProc"
    try:
        response = requests.post(procedure_url, json=procedure_info)
        response.raise_for_status()
    except requests.exceptions.HTTPError as e:
        print(f"Prosedür başarısız. Hata: {e}")
        return None

    return response.json() if response.status_code == 200 else None


# Müşteri bilgilerini alan view
def fetch_customer_details(request, customer_code):
    # Her çağrıda session_id almak için get-session-id endpointine istek gönder
    session_id_response = requests.get("http://127.0.0.1:8000/api/get-session-id/")

    # Yanıtın başarılı olup olmadığını ve session_id içerip içermediğini kontrol et
    if session_id_response.status_code != 200 or "session_id" not in session_id_response.json():
        return JsonResponse({"error": "Session ID alınamadı"}, status=500)

    # session_id değerini al
    session_id = session_id_response.json().get("session_id")
    print(f"Alınan session_id: {session_id}")  # Debugging

    # Çağrılacak prosedürleri tanımla
    procedures = {
        "customer_details": "[360Portal].dbo.CustomerService_getCustomerDetail",
        "customer_phones": "[360Portal].dbo.CustomerService_getCustomerPhones",
        "customer_notes1": "[360Portal].dbo.CustomerService_getCustomerNotes1",
        "customer_notes2": "[360Portal].dbo.CustomerService_getCustomerNotes2",
        "customer_attributes": "[360Portal].dbo.CustomerService_getCustomerAttributes",
        "customer_messages": "[360Portal].dbo.CustomerService_getCustomerMessages",
        "customer_addresses": "[360Portal].dbo.CustomerService_getCustomerAddresses",
    }

    # ThreadPoolExecutor ile prosedürleri paralel olarak çağır
    with ThreadPoolExecutor() as executor:
        futures = {name: executor.submit(run_procedure, session_id, proc_name, customer_code)
                   for name, proc_name in procedures.items()}
        results = {name: future.result() for name, future in futures.items()}

    # Müşteri detayları ve telefonları çek
    customer_details = replace_none_with_null(results.get('customer_details'))
    customer_phones = replace_none_with_null(results.get('customer_phones'))

    # JSON formatında veri döndür
    return JsonResponse({
        'customer_details': customer_details,
        'customer_phones': customer_phones,
        'customer_notes1': replace_none_with_null(results.get('customer_notes1')),
        'customer_notes2': replace_none_with_null(results.get('customer_notes2')),
        'customer_attributes': replace_none_with_null(results.get('customer_attributes')),
        'customer_messages': replace_none_with_null(results.get('customer_messages')),
        'customer_addresses': replace_none_with_null(results.get('customer_addresses'))
    })


def replace_none_with_null(data):
    if isinstance(data, list):
        return [replace_none_with_null(item) for item in data]
    elif isinstance(data, dict):
        return {key: replace_none_with_null(value) for key, value in data.items()}
    elif data is None:
        return None  # JSON olarak null gönderilmesi için
    else:
        return data


# Prosedürü çalıştıran fonksiyon
def run_proc(session_id, username, customerCode=None, identityNum=None, name=None, surname=None, fatherName=None,
             motherName=None, phone=None):
    logging.debug(f"run_proc başlatıldı - session_id: {session_id}, username: {username}")

    procedure_info = {
        "ProcName": "[360Portal].dbo.CustomerService_getCustomers",
        "Parameters": [
            {"Name": "ClientId", "Value": username},
            *([{"Name": "Customercode", "Value": customerCode}] if customerCode else []),
            *([{"Name": "IdentityNum", "Value": identityNum}] if identityNum else []),
            *([{"Name": "Name", "Value": name}] if name else []),
            *([{"Name": "Surname", "Value": surname}] if surname else []),
            *([{"Name": "FatherName", "Value": fatherName}] if fatherName else []),
            *([{"Name": "MotherName", "Value": motherName}] if motherName else []),
            *([{"Name": "Phone", "Value": phone}] if phone else []),
        ]
    }

    procedure_url = f"http://176.236.176.155:1260/(S({session_id}))/IntegratorService/RunProc"

    # procedure_info ve procedure_url içeriğini loglayın
    logging.debug(f"Prosedür URL'si: {procedure_url}")
    logging.debug(f"Giden Parametreler: {json.dumps(procedure_info, indent=2)}")

    try:
        response = requests.post(procedure_url, json=procedure_info)
        response.raise_for_status()
        logging.debug(f"Başarılı yanıt: {response.json()}")
        return response.json()
    except requests.exceptions.HTTPError as e:
        logging.error(f"Prosedür başarısız. HTTPError: {e}, Yanıt: {response.text}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"Prosedür başarısız. RequestException: {e}")
        return None


# Müşteri arama view fonksiyonu
def customer_search_view(request):
    result = None

    if request.method == 'GET':
        username = request.session.get('username')
        if not username:
            return JsonResponse({"error": "Kullanıcı oturum açmamış."}, status=403)

        # Her çağrıda session_id almak için get-session-id endpointine istek gönder
        session_id_response = requests.get("http://127.0.0.1:8000/api/get-session-id/")

        if session_id_response.status_code != 200 or "session_id" not in session_id_response.json():
            logging.error("Session ID alınamadı.")
            return JsonResponse({"error": "Session ID alınamadı."}, status=500)

        session_id = session_id_response.json().get("session_id")
        print(username)
        logging.debug(f"Form verileri alındı - username: {username}")

        # run_proc fonksiyonunu çağır ve username'i kullan
        result = run_proc(session_id, username)

        if result is None:
            logging.error("run_proc fonksiyonu başarısız oldu veya boş sonuç döndürdü.")
            return JsonResponse({"error": "Müşteri araması başarısız."}, status=500)

        # Telefon numaralarını ayır ve her müşteri için yeni bir anahtara ekle
        for customer in result:
            customer['PhoneList'] = customer['Phone'].split(',') if 'Phone' in customer and customer['Phone'] else []

    # JSON formatında yanıt döndür
    return JsonResponse({"result": result})


@csrf_exempt
def add_customer_communication(request):
    if request.method == 'POST':
        session_id_response = requests.get("http://127.0.0.1:8000/api/get-session-id/")

        if session_id_response.status_code != 200 or "session_id" not in session_id_response.json():
            return JsonResponse({"error": "Session ID alınamadı."}, status=500)

        session_id = session_id_response.json().get("session_id")
        data = json.loads(request.body)

        # Gerekli parametreler
        customer_code = data.get("CustomerCode")
        communication_type_code = data.get("CommunicationTypeCode")
        phone = data.get("CommAddress")
        username = data.get("username")

        # Prosedür bilgisi
        procedure_info = {
            "ProcName": "[360Portal].dbo.CustomerService_addCustomerPhone",
            "Parameters": [
                {"Name": "CustomerCode", "Value": customer_code},
                {"Name": "CommunicationTypeCode", "Value": communication_type_code},
                {"Name": "CommAddress", "Value": phone},
                {"Name": "username", "Value": username},
            ]
        }

        procedure_url = f"http://176.236.176.155:1260/(S({session_id}))/IntegratorService/RunProc"
        try:
            response = requests.post(procedure_url, json=procedure_info)
            response.raise_for_status()
            return JsonResponse(response.json(), status=200)
        except requests.exceptions.HTTPError as e:
            return JsonResponse({"error": f"Prosedür başarısız: {str(e)}"}, status=500)

    return JsonResponse({"error": "Geçersiz istek yöntemi."}, status=400)


class GetCustomerNoteCategoriesView(APIView):
    def get(self, request):
        # Session ID alma
        session_id_response = requests.get("http://127.0.0.1:8000/api/get-session-id/")
        if session_id_response.status_code != 200 or "session_id" not in session_id_response.json():
            return JsonResponse({"error": "Session ID alınamadı."}, status=500)

        session_id = session_id_response.json().get("session_id")

        # Prosedür bilgisi
        procedure_info = {
            "ProcName": "[360Portal].dbo.CustomerService_getCustomerNoteCategories",
            "Parameters": []  # Parametreler boş bırakıldı
        }

        procedure_url = f"http://176.236.176.155:1260/(S({session_id}))/IntegratorService/RunProc"
        try:
            response = requests.post(procedure_url, json=procedure_info)
            response.raise_for_status()
            return JsonResponse(response.json(), safe=False, status=200)
        except requests.exceptions.HTTPError as e:
            return JsonResponse({"error": f"Prosedür başarısız: {str(e)}"}, status=500)


def run_customer_notes(session_id, customer_code, alert_type, date, taker, description):
    procedure_info = {
        "ProcName": "[360Portal].dbo.CustomerService_postCustomerNotes1",
        "Parameters": [
            {"Name": "Customercode", "Value": customer_code},
            {"Name": "Alert", "Value": alert_type},
            {"Name": "Date", "Value": date},
            {"Name": "Taker", "Value": taker},
            {"Name": "Description", "Value": description}
        ]
    }

    procedure_url = f"http://176.236.176.155:1260/(S({session_id}))/IntegratorService/RunProc"
    logging.debug(f"Prosedür URL'si: {procedure_url}")

    try:
        response = requests.post(procedure_url, json=procedure_info)
        response.raise_for_status()
        return response.json()
    except requests.exceptions.HTTPError as e:
        logging.error(f"Prosedür başarısız. HTTPError: {e}, Yanıt: {response.text}")
        return None
    except requests.exceptions.RequestException as e:
        logging.error(f"Prosedür başarısız. RequestException: {e}")
        return None


@csrf_exempt
def customer_note_view(request):
    if request.method == 'POST':
        session_id_response = requests.get("http://127.0.0.1:8000/api/get-session-id/")
        if session_id_response.status_code != 200 or "session_id" not in session_id_response.json():
            logging.error("Session ID alınamadı.")
            return JsonResponse({"error": "Session ID alınamadı."}, status=500)

        session_id = session_id_response.json().get("session_id")

        # POST verilerini al
        customer_code = request.POST.get('CustomerCode')
        alert_type = request.POST.get('AlertTypeNote1')
        date = request.POST.get('Date')
        username = request.session.get('username')
        phone = request.POST.get('Phone')
        note = request.POST.get('Note')

        # Description formatını oluştur
        description = f"{alert_type}. Görüşülen tel no: {phone}, {note}"  # {alert}, {phone}, {note} formatında

        # run_customer_notes fonksiyonunu çağır
        result = run_customer_notes(session_id, customer_code, alert_type, date, username, description)

        if result is None:
            return JsonResponse({"error": "Müşteri notu ekleme başarısız."}, status=500)

        return JsonResponse(result, status=200)

    return JsonResponse({"error": "Invalid request method."}, status=400)
    

@csrf_exempt
def get_customer_attributes_list(request, attribute_type_code):
    # Session ID alma
    session_id_response = requests.get("http://127.0.0.1:8000/api/get-session-id/")
    if session_id_response.status_code != 200 or "session_id" not in session_id_response.json():
        return JsonResponse({"error": "Session ID alınamadı."}, status=500)

    session_id = session_id_response.json().get("session_id")

    # Prosedür bilgisi
    procedure_info = {
        "ProcName": "[360Portal].dbo.CustomerService_getCustomerAttributesList",
        "Parameters": [
            {"Name": "AttributeTypeCode", "Value": attribute_type_code},
        ]
    }

    procedure_url = f"http://176.236.176.155:1260/(S({session_id}))/IntegratorService/RunProc"
    try:
        response = requests.post(procedure_url, json=procedure_info)
        response.raise_for_status()
        return JsonResponse(response.json(), safe=False, status=200)
    except requests.exceptions.HTTPError as e:
        return JsonResponse({"error": f"Prosedür başarısız: {str(e)}"}, status=500)


@csrf_exempt
def add_customer_attribute(request):
    if request.method == 'POST':
        data = json.loads(request.body)
        customer_code = data.get("CustomerCode")
        attribute_type_code = data.get("AttributeTypeCode")
        attribute_code = data.get("AttributeCode")
        username = data.get("username")

        procedure_info = {
            "ProcName": "[360Portal].dbo.CustomerService_addCustomerAttribute",
            "Parameters": [
                {"Name": "Customercode", "Value": customer_code},
                {"Name": "AttributeTypeCode", "Value": attribute_type_code},
                {"Name": "AttributeCode", "Value": attribute_code},
                {"Name": "username", "Value": username}
            ]
        }

        session_id_response = requests.get("http://127.0.0.1:8000/api/get-session-id/")
        if session_id_response.status_code != 200:
            return JsonResponse({"error": "Session ID alınamadı."}, status=500)

        session_id = session_id_response.json().get("session_id")
        procedure_url = f"http://176.236.176.155:1260/(S({session_id}))/IntegratorService/RunProc"

        try:
            response = requests.post(procedure_url, json=procedure_info)
            response.raise_for_status()
            return JsonResponse({"success": "Özellik başarıyla güncellendi."})
        except requests.exceptions.HTTPError as e:
            return JsonResponse({"error": f"Prosedür başarısız: {str(e)}"}, status=500)
    
    return JsonResponse({"error": "Geçersiz istek yöntemi."}, status=400)


def homepage_view(request):
    # Kullanıcının oturum açıp açmadığını kontrol et
    username = request.session.get('username')  # Oturumda saklanan kullanıcı adı
    is_logged_in = username is not None  # Kullanıcının giriş yapıp yapmadığını kontrol et

    return render(request, 'homepage.html', {
        'username': username,  # Kullanıcı adını şablona gönder
        'is_logged_in': is_logged_in  # Kullanıcının giriş yapıp yapmadığını şablona gönder
    })


def customer_find_view(request):
    username = request.session.get('username')  # Oturumda saklanan kullanıcı adı
    return render(request, 'customerFind.html', {'username': username})


def call_result_view(request):
    # URL'den gelen verileri al
    phone_number = request.GET.get("phone_number")
    status = request.GET.get("status")
    duration = request.GET.get("duration")
    username = request.GET.get("username")

    # Verileri template'e gönder
    context = {
        'phone_number': phone_number,
        'status': status,
        'duration': duration,
        'username': username
    }

    return render(request, 'callResult.html', context)  # 'callResult.html' adlı template dosyasını render et
