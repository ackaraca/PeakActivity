import firebase_admin
from firebase_admin import credentials, firestore

def initialize_firebase():
    if not firebase_admin._apps:
        # TODO: Use a more secure way to load credentials in production
        # For local development, you can place your serviceAccountKey.json in the same directory
        try:
            cred = credentials.ApplicationDefault()
            firebase_admin.initialize_app(cred)
            print("Firebase Admin SDK başarıyla başlatıldı (Application Default).")
        except Exception as e:
            print(f"Firebase Admin SDK başlatılırken hata oluştu: {e}")
            print("Uygulama Varsayılan Kimlik Bilgilerini kullanılamadı. Ortam değişkenlerini veya serviceAccountKey.json dosyasını kontrol edin.")

    return firestore.client()

db = initialize_firebase() 