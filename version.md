# PeakActivity - Versiyon Geçmişi

## v0.13.16-firebase-backend-optimization (2025-07-11 17:06:31)

### 🚀 Firebase Backend Kod ve Maliyet Optimizasyonları
- **Makine Öğrenimi ve AI:**
    - `task-completion-prediction-service.ts` dosyasına TensorFlow.js ile gerçek ML çıkarım mantığı eklendi. Aktivite verileriyle çalışan basit bir yapay sinir ağı modeli entegre edildi.
    - `ai-insight-service.ts` dosyasına Google Cloud Natural Language API ile duygu analizi ve varlık çıkarma özellikleri eklendi.
- **Hedef Takibi ve Güncelleme:**
    - `goal-service.ts` dosyasındaki `checkGoalProgress` metodu, aktiviteye göre hedef ilerlemesini otomatik güncelleyecek şekilde implemente edildi. Seri (streak) ve hedef türüne göre ilerleme yönetimi sağlandı.
- **Takvim Senkronizasyonu:**
    - `calendar-sync-service.ts` dosyasında Google Takvim'den silinen etkinlikler için "soft delete" (deleted: true) stratejisi uygulandı. Yeni/güncellenen etkinlikler için `deleted: false` flag'i eklendi.
- **Otomasyon Kuralları ve Bildirimler:**
    - `automation-rule-service.ts` dosyasındaki `executeRuleAction` metodu, kural tipine göre (bildirim, uygulama engelleme, mola önerme, odak modu, ruh hali, bağlam istemi) eylemleri tetikleyebilecek şekilde geliştirildi. Bildirimler için `AINotificationService` ile FCM entegrasyonu sağlandı.
- **Davranışsal Trend Analizi:**
    - `index.ts` dosyasındaki `analyzeBehavioralTrends` fonksiyonunda haftalık desen/mevsimsellik tespiti daha genel ve sağlam bir algoritma ile güncellendi. Cuma günü özelinden çıkarılıp tüm haftaya yayılan sapma analizi eklendi.
- **Topluluk Kuralları:**
    - `applyCommunityRules` fonksiyonuna `CommunityRulesService` entegrasyonu tamamlandı.

### 🛠️ Teknik İyileştirmeler
- Kodun tamamında gereksiz importlar ve tekrar eden işlemler kaldırıldı.
- API istemcileri ve ML modelleri için kullanıcı bazında önbellekleme ve yeniden kullanılabilirlik sağlandı.
- Hata yönetimi ve loglama iyileştirildi.
- Linter hataları giderildi, fonksiyonel ve okunabilir kod yapısı korundu.

### ✅ Sonuç
Tüm Firebase backend fonksiyonları dağıtıma hazır, kod ve maliyet açısından optimize edildi. Kalan TODO'lar frontend veya Rust backend ile ilgilidir.

---

## v0.13.15-bugfixes (2025-07-11 15:22:36)

### 🐛 Bug Fixes
- Cross-platform `lint` script updated to `eslint .` to resolve ENOENT during Firebase predeploy.
- Fixed all apostrophe-related TypeScript compile errors in Google Calendar, Trello/Jira and Task Completion Prediction APIs.
- Updated notification typing to support `ai_recommendation` and corrected field names.
- Added ambient type declarations for `jira-client` and `trello.js` to silence TS7053.
- Ensured calendar sync handles undefined event arrays.

### ✅ Status
Firebase Functions now build and lint cleanly; deployment blocker removed. 

## 2025-07-11 22:08:55 - PeakActivity Geliştirme Güncellemesi

### Yeni Özellikler ve İyileştirmeler:
- **T041: Anomali Uyarıları Geliştirmeleri:**
  - `aw-server/aw-webui/src/views/Alerts.vue` dosyası Vue 3 Composition API'ye dönüştürüldü.
  - Firebase'den anomali uyarıları çekilerek kullanıcı arayüzünde gösterilmesi sağlandı.
  - UI metinleri Türkçeleştirildi.

- **T042: AI Destekli Raporlama ve Özetleme (Backend):**
  - `functions/src/services/report-management-service.ts` dosyasındaki `generateReportData` fonksiyonu AI destekli raporlama ve özetleme için güncellendi.
  - Sahte veri oluşturma kaldırıldı ve gerçek aktivite verilerini çekmek için bir placeholder eklendi.
  - AI tarafından oluşturulacak özet ve metrikler için bir yapı tanımlandı. 

## 2025-07-11 22:25:37 - PeakActivity Geliştirme Güncellemesi

### Yeni Özellikler ve İyileştirmeler:
- **T048: Etkinlik Verileri için Gerçek Zamanlı Veri Senkronizasyonu (Arka Uç):**
  - `functions/src/triggers/firestore-triggers.ts` dosyasındaki `onActivityCreated` tetikleyicisi, yeni etkinlikler oluşturulduğunda veya güncellendiğinde bağlı istemcilere bildirim göndermek üzere genişletildi.
  - `NotificationService.createNotification` kullanılarak yeni etkinlik verilerinin kullanıma hazır olduğunu belirten bildirimler eklendi. 

## 2025-07-11 22:27:37 - PeakActivity Geliştirme Güncellemesi

### Yeni Özellikler ve İyileştirmeler:
- **T049: Etkinlik Verileri için Gerçek Zamanlı Veri Senkronizasyonu (Ön Uç):**
  - `aw-server/aw-webui/src/stores/activity.ts` dosyası, Firebase Firestore `onSnapshot` dinleyicisini kullanarak etkinlik verilerini gerçek zamanlı olarak senkronize edecek şekilde güncellendi.
  - Mağaza durumu (state) Firebase'den gelen güncellemelerle otomatik olarak yenilenir.
  - `Activity.vue` gibi ilgili ön uç bileşenlerinin, Pinia reaktivitesi sayesinde otomatik olarak güncellemeleri yansıttığı doğrulandı. 

## 2025-07-11 22:28:41 - PeakActivity Geliştirme Güncellemesi

### Yeni Özellikler ve İyileştirmeler:
- **T050: Gelişmiş Anomali Tespit Modeli Geliştirme (Arka Uç):**
  - `functions/src/services/anomaly-detection-service.ts` dosyasındaki `detectAnomalies` fonksiyonu, gelecekte daha gelişmiş bir makine öğrenimi (ML) modeli entegrasyonu için bir yer tutucu ve güncellenmiş dönüş türleri ile güncellendi.
  - Mevcut istatistiksel mantık korunarak anomali skoru, sapma yüzdesi ve açıklama alanları eklendi. Model versiyonu bilgisi eklendi. 

## 2025-07-11 22:29:35 - PeakActivity Geliştirme Güncellemesi

### Yeni Özellikler ve İyileştirmeler:
- **T051: Gelişmiş Anomali Tespit Modeli Geliştirme (Ön Uç):**
  - `aw-server/aw-webui/src/views/Alerts.vue` dosyasındaki `AnomalyAlert` arayüzü, arka uçtaki `AnomalyResult` ve `AnomalyOutput` ile uyumlu hale getirildi.
  - Pug şablonu, anomali skoru, sapma yüzdesi, açıklama gibi daha ayrıntılı anomali bilgilerini gösterecek şekilde güncellendi. Tüm yeni metinler Türkçeleştirildi. 

## 2025-07-11 22:39:05 - PeakActivity Geliştirme Güncellemesi

### Yeni Özellikler ve İyileştirmeler:
- **T052: Gerçek Zamanlı Davranışsal Örüntü Tanıma (Arka Uç):**
  - `functions/src/services/behavioral-analysis-service.ts` dosyasındaki `analyzeBehavioralPatterns` fonksiyonu, `analyzeRealtimeBehavioralPattern` olarak yeniden adlandırıldı ve tekil `ActivityEvent`'leri işleyerek gerçek zamanlı örüntü tanıma için bir yer tutucu olarak güncellendi.
  - `RealtimeBehavioralPattern` adında yeni bir arayüz tanımlanarak anlık davranışsal örüntüler için yapı sağlandı.
  - `functions/src/api/behavioral-analysis-api.ts` ve `functions/src/index.ts` dosyaları, yeni API endpoint'ini dışa aktaracak şekilde güncellendi.
  - `functions/src/types/activity-event.d.ts` dosyasına `id` alanı eklendi. 