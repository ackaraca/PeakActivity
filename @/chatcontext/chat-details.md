# Sohbet Teknik Detayları

Bu sohbet boyunca ActivityWatch'ın PeakActivity çatallanmasında yapılan teknik değişiklikler ve entegrasyonlar aşağıda detaylandırılmıştır:

## 1. Tauri Entegrasyonu (Aşama 3.1.4)

### Eklenen Fonksiyonlar:
*   `aw-qt/src-tauri/src/commands.rs`: `send_notification_command` fonksiyonu eklendi. Bu fonksiyon, Tauri'nin bildirim API'sini kullanarak sistem bildirimleri göndermek için kullanılır.

### Class/Module/Package Değişiklikleri:
*   `aw-qt/src-tauri/src/main.rs`: `send_notification_command` fonksiyonu Tauri uygulamasının komutlarına eklendi.

### Framework/Library Değişiklikleri:
*   Tauri'nin yerel bildirim API'leri entegre edildi.
*   Yerel hedef verisi senkronizasyonu için SQLite kullanımı başlatıldı (ancak bu sohbet kapsamında doğrudan kod değişiklikleri gösterilmedi).

## 2. Firebase Yapay Zeka Algoritmaları Entegrasyonu

### Eklenen Fonksiyonlar ve API Uç Noktaları:
Her bir yapay zeka özelliği için Firebase Cloud Functions (TypeScript) içinde ayrı servisler ve API uç noktaları oluşturuldu:

*   **Anomali Tespiti:**
    *   Servis: `functions/src/services/anomaly-detection-service.ts`
    *   API: `functions/src/api/anomaly-detection-api.ts` (örn: `getAnomalyDetectionData`)
    *   Fonksiyonlar: Günlük aktivite toplamları için ortalama, standart sapma ve z-skoru hesaplar.

*   **Otomatik Kategorizasyon ve Etiketleme:**
    *   Servis: `functions/src/services/auto-categorization-service.ts`
    *   API: `functions/src/api/auto-categorization-api.ts` (örn: `autoCategorizeEvent`)
    *   Fonksiyonlar: Anahtar kelime ve uygulama tabanlı kategorizasyon yapar.

*   **Davranışsal Desenler ve Trend Analizi:**
    *   Servis: `functions/src/services/behavioral-trends-service.ts`
    *   API: `functions/src/api/behavioral-trends-api.ts` (örn: `getBehavioralTrends`)
    *   Fonksiyonlar: Doğrusal regresyon kullanarak trendleri (yükselen, düşen, sabit) belirler.

*   **Topluluk Tabanlı Kural Setleri:**
    *   Servis: `functions/src/services/community-rules-service.ts`
    *   API: `functions/src/api/community-rules-api.ts` (örn: `applyCommunityRules`)
    *   Fonksiyonlar: Glob/regex desen eşleştirmesi kullanarak etkinlikleri topluluk kurallarına göre kategorize eder.

*   **Bağlamsal Kategorizasyon:**
    *   Servis: `functions/src/services/contextual-categorization-service.ts`
    *   API: `functions/src/api/contextual-categorization-api.ts` (örn: `getContextualCategories`)
    *   Fonksiyonlar: Doğal dil bağlamını önceden tanımlanmış etiketlere göre sınıflandırır.

*   **Odak Kalitesi Skoru:**
    *   Servis: `functions/src/services/focus-quality-service.ts`
    *   API: `functions/src/api/focus-quality-api.ts` (örn: `calculateFocusQuality`)
    *   Fonksiyonlar: Oturum etkinlikleri, bağlam geçişleri, pasif tüketim, sosyal medya kullanımı ve günün saatine göre odak kalitesi skorunu hesaplar.

### Class/Module/Package Değişiklikleri:
*   `functions/src/index.ts`: Tüm yeni AI servislerinin API uç noktaları bu dosyaya entegre edildi.
*   Yeni `functions/src/services/` ve `functions/src/api/` dizinleri oluşturuldu.

### Import/Library/Framework Değişiklikleri:
*   Firebase Cloud Functions ve ilgili Firebase SDK'ları (örneğin Firestore SDK) kullanıldı.
*   TypeScript ile geliştirildi.

## 3. Akıllı Kurallar ve Otomasyon Motoru (IFTTT Tarzı) - Temel Entegrasyon (Aşama 3.2)

### Eklenen Fonksiyonlar ve API Uç Noktaları:
*   **Firebase Cloud Functions (TypeScript):**
    *   Servis: `functions/src/services/automation-rule-service.ts` oluşturuldu. Bu servis, otomasyon kuralları için CRUD operasyonlarını ve temel kural değerlendirme/tetikleme mantığını içerir.
    *   API: `functions/src/api/automation-rule-api.ts` içinde aşağıdaki uç noktalar tanımlandı ve `functions/src/index.ts` dosyasına entegre edildi:
        *   `createAutomationRule`
        *   `getAutomationRule`
        *   `getAllAutomationRules`
        *   `updateAutomationRule`
        *   `deleteAutomationRule`

*   **Tauri Kural Yürütücüsü (Rust):**
    *   `aw-qt/src-tauri/src/commands.rs`: Aşağıdaki Tauri komutları eklendi:
        *   Otomasyon kuralları üzerinde CRUD işlemleri için komutlar (Firebase Cloud Functions ile iletişim kurarak).
        *   `evaluate_and_execute_rules`: Kuralları yineleyen, bekleme sürelerini kontrol eden ve eylemleri (bildirim gösterme gibi) simüle eden temel bir komut.

### Class/Module/Package Değişiklikleri:
*   `firebase-md/firestore-data-modeling.md`: `automation_rules` koleksiyon şeması eklendi. Bu şema, tetikleyici türlerini, eylem türlerini, parametreleri, önceliği ve bekleme mekanizmalarını tanımlar.
*   `aw-qt/src-tauri/src/commands.rs`: `AutomationRule`, `Trigger`, `Action` ve `Condition` için Rust yapıları tanımlandı.
*   `aw-qt/src-tauri/src/main.rs`: Yeni otomasyon kuralı komutları bu dosyaya kaydedildi.

### Import/Library/Framework Değişiklikleri:
*   Firebase Firestore ve Cloud Functions kullanıldı.
*   Tauri ve Rust'ın `tauri::command` makrosu ve diğer ilgili Tauri/Rust kütüphaneleri kullanıldı. 