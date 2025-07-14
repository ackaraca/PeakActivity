# Veri Akışı ve Senkronizasyon

Veri akışı, PeakActivity’nin kalbidir. Kullanıcı etkinlikleri, ActivityWatch izleyicileri tarafından toplanır, sunucu katmanında işlenir ve Firebase’e senkronize edilir. Aşağıda adım adım veri yolculuğu anlatılmıştır.

## 1. Veri Toplama (ActivityWatch)
- Watcher modülleri (afk, input, window) aktif olarak olayları dinler
- Her olay `Bucket` ve `Event` yapısı içinde lokal olarak kaydedilir (SQLite veya bellek)

## 2. Lokal İşleme (aw-server)
- `aw-server` uygulaması olayları işler, anonimleştirir ve geçici hafızada tutar
- Data anonimleştirme kuralları (pencere başlıklarından kişisel bilgi temizleme)

## 3. Bulut Senkronizasyon (Firebase)
- Kullanıcı izni ile toplu ya da gerçek zamanlı senkronizasyon
- Firestore’a `aw_events` koleksiyonuna ekleme
- Senkronizasyon durum takibi (işlem başlatıldı, başarı, hata)

## 4. AI Analizi (Cloud Functions)
- `ai-insight-api` fonksiyonu çağrılır
- Veriler AI iş akışına iletilir (Edge veya Cloud AI)

## 5. Sonuçların Depolanması ve Bildirimi
- Oluşan içgörüler Firestore içinde `insights` koleksiyonunda saklanır
- Kullanıcıya bildirim gönderilir (`aw-notify`)

## 6. Çift Yönlü Senkronizasyon
- Kullanıcı ayarları değiştirildiğinde lokal yapı da güncellenir
- Conflict resolution stratejisi: En son güncelleme öncelikli
