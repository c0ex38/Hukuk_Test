import firebase_admin
from firebase_admin import credentials, db
from datetime import datetime

# Firebase yalnızca bir kez başlatılacak şekilde kontrol ediliyor
if not firebase_admin._apps:
    cred = credentials.Certificate('api/serviceAccountKey.json')
    firebase_admin.initialize_app(cred, {
        'databaseURL': 'https://hukuk-9a8a0-default-rtdb.europe-west1.firebasedatabase.app/'
    })


def login(username: str, is_admin: bool) -> None:
    """Kullanıcı girişini Firebase'e kaydet"""
    ref = db.reference('users')
    user_data = {
        'username': username,
        'is_admin': is_admin,
        'login_web': datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")  # UTC kullanarak kesin zaman sağlar
    }
    ref.child(username).update(user_data)


def logout(username: str) -> None:
    """Kullanıcı çıkış zamanını Firebase'e kaydet"""
    ref = db.reference('users')
    logout_time = datetime.utcnow().strftime("%Y-%m-%d %H:%M:%S")
    ref.child(username).update({'logout_web': logout_time})
