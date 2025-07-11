
# Firebase Cloud Fonksiyonları Dokümantasyonu

Bu belge, PeakActivity projesinde kullanılan Firebase Cloud Fonksiyonlarını detaylandırmaktadır. Her bir fonksiyonun amacı, tetikleyicisi, giriş formatları ve beklenen çıkışları açıklanmaktadır.

## Fonksiyon Kaynak Dizini

`functions/src/index.ts` dosyası, ana Firebase fonksiyonlarını dışa aktarır ve diğer API dosyalarından fonksiyonları içe aktarır.

## API Fonksiyonları

### functions/src/api/goal-api.ts

*   **`createGoal`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: `name`, `description`, `targetValue`, `currentValue`, `startDate`, `endDate`, `userId` gibi hedefe özgü alanları içeren bir JSON nesnesi.
    *   **Çıkış**: Oluşturulan hedefin ID'si ile birlikte başarı durumu.
    *   **İşlev**: Yeni bir kullanıcı hedefi oluşturur.

*   **`getGoals`**:
    *   **Tetikleyici**: HTTP GET isteği.
    *   **Giriş**: `userId` (isteğe bağlı), `status` (isteğe bağlı).
    *   **Çıkış**: Kullanıcı hedeflerinin listesi.
    *   **İşlev**: Kullanıcı hedeflerini alır.

*   **`updateGoal`**:
    *   **Tetikleyici**: HTTP PUT isteği.
    *   **Giriş**: `goalId` ve güncellenecek alanları içeren bir JSON nesnesi.
    *   **Çıkış**: Güncelleme durumu.
    *   **İşlev**: Mevcut bir kullanıcı hedefini günceller.

*   **`deleteGoal`**:
    *   **Tetikleyici**: HTTP DELETE isteği.
    *   **Giriş**: `goalId`.
    *   **Çıkış**: Silme durumu.
    *   **İşlev**: Bir kullanıcı hedefini siler.

### functions/src/triggers/firestore-triggers.ts

*   **`onActivityCreate`**:
    *   **Tetikleyici**: Firestore'da `activities` koleksiyonuna yeni bir belge eklendiğinde.
    *   **Giriş**: Yeni aktivite belgesinin verileri.
    *   **Çıkış**: Yok (arka plan işlemi).
    *   **İşlev**: Yeni aktivite oluşturulduğunda belirli işlemleri tetikler (örneğin, AI analizi).

*   **`onActivityUpdate`**:
    *   **Tetikleyici**: Firestore'da `activities` koleksiyonundaki bir belge güncellendiğinde.
    *   **Giriş**: Güncellenen aktivite belgesinin eski ve yeni verileri.
    *   **Çıkış**: Yok (arka plan işlemi).
    *   **İşlev**: Mevcut bir aktivite güncellendiğinde belirli işlemleri tetikler.

*   **`onUserCreate`**:
    *   **Tetikleyici**: Yeni bir kullanıcı Auth'ta oluşturulduğunda.
    *   **Giriş**: Yeni kullanıcının verileri.
    *   **Çıkış**: Yok (arka plan işlemi).
    *   **İşlev**: Yeni kullanıcı kaydolduğunda varsayılan ayarları veya profilleri oluşturur.

*   **`onUserDelete`**:
    *   **Tetikleyici**: Bir kullanıcı Auth'ta silindiğinde.
    *   **Giriş**: Silinen kullanıcının verileri.
    *   **Çıkış**: Yok (arka plan işlemi).
    *   **İşlev**: Bir kullanıcı silindiğinde ilgili tüm verileri temizler.

### functions/src/api/activity-api.ts

*   **`getActivities`**:
    *   **Tetikleyici**: HTTP GET isteği.
    *   **Giriş**: `userId`, `startDate`, `endDate`, `category` gibi filtreleme parametreleri.
    *   **Çıkış**: Filtrelenen aktivite etkinliklerinin listesi.
    *   **İşlev**: Kullanıcının aktivite etkinliklerini belirli kriterlere göre alır.

*   **`createActivity`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: Yeni aktivite verileri.
    *   **Çıkış**: Oluşturulan aktivite ID'si.
    *   **İşlev**: Yeni bir aktivite etkinliği oluşturur.

*   **`updateActivity`**:
    *   **Tetikleyici**: HTTP PUT isteği.
    *   **Giriş**: `activityId` ve güncellenecek aktivite verileri.
    *   **Çıkış**: Güncelleme durumu.
    *   **İşlev**: Mevcut bir aktivite etkinliğini günceller.

*   **`deleteActivity`**:
    *   **Tetikleyici**: HTTP DELETE isteği.
    *   **Giriş**: `activityId`.
    *   **Çıkış**: Silme durumu.
    *   **İşlev**: Bir aktivite etkinliğini siler.

### functions/src/api/ai-insight-api.ts

*   **`generateInsight`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: Kullanıcının aktivite verileri veya özetleri, `insightType` (örneğin, "productivity", "focus").
    *   **Çıkış**: Oluşturulan yapay zeka tabanlı içgörü metni veya yapılandırılmış veri.
    *   **İşlev**: Kullanıcı aktivite verilerine dayanarak yapay zeka içgörüleri oluşturur.

### functions/src/api/ai-notification-api.ts

*   **`sendAINotification`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: `userId`, `message`, `notificationType` (örneğin, "focus_reminder", "break_suggestion").
    *   **Çıkış**: Bildirim gönderme durumu.
    *   **İşlev**: Yapay zeka tarafından tetiklenen bildirimleri kullanıcılara gönderir.

### functions/src/api/anomaly-detection-api.ts

*   **`detectAnomaly`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: Belirli bir zaman aralığındaki kullanıcı aktivite verileri.
    *   **Çıkış**: Tespit edilen anormalliklerin listesi veya bir anormallik puanı.
    *   **İşlev**: Kullanıcı aktivite verilerindeki anormal kalıpları tespit eder.

### functions/src/api/auto-categorization-api.ts

*   **`categorizeActivity`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: `activityData` (örneğin, URL, uygulama adı, pencere başlığı).
    *   **Çıkış**: Otomatik olarak atanan kategori.
    *   **İşlev**: Verilen aktivite verilerini kullanarak otomatik olarak bir kategori atar.

*   **`getCategorySuggestions`**:
    *   **Tetikleyici**: HTTP GET isteği.
    *   **Giriş**: `query` (kullanıcının arama sorgusu).
    *   **Çıkış**: Olası kategori önerilerinin listesi.
    *   **İşlev**: Kullanıcı girişine veya geçmiş aktivitelere göre kategori önerileri sunar.

### functions/src/api/automatic-event-api.ts

*   **`processAutomaticEvent`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: Otomatik olarak toplanan etkinlik verileri (örneğin, uygulama kullanımı, pencere değişimi).
    *   **Çıkış**: İşleme durumu.
    *   **İşlev**: Otomatik olarak toplanan ham etkinlik verilerini işler ve kaydeder.

### functions/src/api/automation-rule-api.ts

*   **`createAutomationRule`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: `ruleName`, `conditions`, `actions`, `userId` gibi otomasyon kuralı tanımlarını içeren bir JSON nesnesi.
    *   **Çıkış**: Oluşturulan kuralın ID'si.
    *   **İşlev**: Yeni bir otomasyon kuralı oluşturur.

*   **`getAutomationRules`**:
    *   **Tetikleyici**: HTTP GET isteği.
    *   **Giriş**: `userId` (isteğe bağlı).
    *   **Çıkış**: Otomasyon kurallarının listesi.
    *   **İşlev**: Kullanıcının otomasyon kurallarını alır.

*   **`updateAutomationRule`**:
    *   **Tetikleyici**: HTTP PUT isteği.
    *   **Giriş**: `ruleId` ve güncellenecek kural verileri.
    *   **Çıkış**: Güncelleme durumu.
    *   **İşlev**: Mevcut bir otomasyon kuralını günceller.

*   **`deleteAutomationRule`**:
    *   **Tetikleyici**: HTTP DELETE isteği.
    *   **Giriş**: `ruleId`.
    *   **Çıkış**: Silme durumu.
    *   **İşlev**: Bir otomasyon kuralını siler.

### functions/src/api/behavioral-analysis-api.ts

*   **`analyzeBehavioralPatterns`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: Belirli bir zaman aralığındaki kullanıcı aktivite verileri.
    *   **Çıkış**: Tespit edilen davranışsal kalıpların ve eğilimlerin analizi.
    *   **İşlev**: Kullanıcı aktivite verilerindeki davranışsal kalıpları ve eğilimleri analiz eder.

### functions/src/api/community-rules-api.ts

*   **`getCommunityRules`**:
    *   **Tetikleyici**: HTTP GET isteği.
    *   **Giriş**: `category` (isteğe bağlı), `searchQuery` (isteğe bağlı).
    *   **Çıkış**: Topluluk tarafından oluşturulan kuralların listesi.
    *   **İşlev**: Topluluk tarafından oluşturulan kategori ve otomasyon kurallarını alır.

*   **`submitCommunityRule`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: Yeni topluluk kuralı verileri (örneğin, `ruleDefinition`, `suggestedCategory`).
    *   **Çıkış**: Gönderme durumu.
    *   **İşlev**: Kullanıcıların yeni topluluk kuralları göndermesine izin verir.

### functions/src/api/contextual-categorization-api.ts

*   **`categorizeByContext`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: `activityData`, `contextualInfo` (örneğin, günün saati, konum, takvim etkinlikleri).
    *   **Çıkış**: Bağlama göre atanmış kategori.
    *   **İşlev**: Aktivite verilerini ek bağlamsal bilgilerle birlikte kullanarak daha doğru kategorizasyon sağlar.

### functions/src/api/custom-event-api.ts

*   **`createCustomEvent`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: `eventName`, `details`, `timestamp`, `userId` gibi özel etkinlik verileri.
    *   **Çıkış**: Oluşturulan özel etkinliğin ID'si.
    *   **İşlev**: Kullanıcıların manuel olarak özel etkinlikler oluşturmasına izin verir.

*   **`getCustomEvents`**:
    *   **Tetikleyici**: HTTP GET isteği.
    *   **Giriş**: `userId`, `startDate`, `endDate`, `eventName` gibi filtreleme parametreleri.
    *   **Çıkış**: Özel etkinliklerin listesi.
    *   **İşlev**: Kullanıcı tarafından oluşturulan özel etkinlikleri alır.

### functions/src/api/focus-mode-api.ts

*   **`startFocusMode`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: `userId`, `duration`, `blockedApps`, `blockedWebsites`.
    *   **Çıkış**: Odaklanma modunun başlangıç durumu.
    *   **İşlev**: Kullanıcı için odaklanma modunu başlatır, dikkat dağıtıcıları engeller.

*   **`endFocusMode`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: `userId`.
    *   **Çıkış**: Odaklanma modunun bitiş durumu.
    *   **İşlev**: Odaklanma modunu sonlandırır.

### functions/src/api/focus-quality-score-api.ts

*   **`calculateFocusQualityScore`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: Belirli bir zaman aralığındaki kullanıcı aktivite verileri.
    *   **Çıkış**: Odaklanma kalitesi puanı (sayısal değer).
    *   **İşlev**: Kullanıcının odaklanma seviyesini ve kalitesini değerlendiren bir puan hesaplar.

### functions/src/api/goal-management-api.ts

*   **`manageGoalProgress`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: `goalId`, `progressUpdate`, `timestamp`.
    *   **Çıkış**: Güncellenmiş hedef durumu.
    *   **İşlev**: Kullanıcı hedeflerinin ilerlemesini yönetir ve günceller.

### functions/src/api/insight-generation-api.ts

*   **`generateComprehensiveInsight`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: Çok çeşitli kullanıcı aktivite verileri, hedef ilerlemesi ve davranışsal analiz sonuçları.
    *   **Çıkış**: Birden fazla kaynaktan toplanan verilere dayalı kapsamlı bir içgörü raporu.
    *   **İşlev**: Çeşitli veri noktalarını birleştirerek kapsamlı yapay zeka içgörüleri oluşturur.

### functions/src/api/ml-data-api.ts

*   **`submitMLData`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: Makine öğrenimi modellerini eğitmek için ham veya işlenmiş veri noktaları (örneğin, etiketli aktivite verileri).
    *   **Çıkış**: Veri gönderme durumu.
    *   **İşlev**: Makine öğrenimi modellerini eğitmek için veri toplar.

*   **`getMLPredictions`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: Modelden tahmin almak için giriş verileri.
    *   **Çıkış**: Makine öğrenimi modelinden gelen tahmin sonuçları.
    *   **İşlev**: Eğitilmiş makine öğrenimi modellerinden tahminler alır.

### functions/src/api/notification-api.ts

*   **`sendNotification`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: `userId`, `message`, `type`, `timestamp`.
    *   **Çıkış**: Bildirim gönderme durumu.
    *   **İşlev**: Genel bildirimleri kullanıcılara gönderir (yapay zeka tarafından tetiklenmeyenler dahil).

*   **`getNotifications`**:
    *   **Tetikleyici**: HTTP GET isteği.
    *   **Giriş**: `userId`, `readStatus` (isteğe bağlı).
    *   **Çıkış**: Kullanıcı bildirimlerinin listesi.
    *   **İşlev**: Kullanıcının bildirimlerini alır.

### functions/src/api/project-prediction-ai-api.ts

*   **`predictProjectCompletionAI`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: Proje verileri, geçmiş aktivite verileri ve ilgili AI modelleri için diğer özellikler.
    *   **Çıkış**: Yapay zeka destekli proje tamamlama tahmini (örneğin, tahmini bitiş tarihi, başarı olasılığı).
    *   **İşlev**: Yapay zeka algoritmalarını kullanarak proje tamamlama sürelerini tahmin eder.

### functions/src/api/project-prediction-api.ts

*   **`predictProjectCompletion`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: Proje verileri, geçmiş aktivite verileri.
    *   **Çıkış**: Proje tamamlama tahmini (AI desteği olmadan).
    *   **İşlev**: Basit algoritmalar veya geçmiş verilere dayanarak proje tamamlama sürelerini tahmin eder.

### functions/src/api/report-management-api.ts

*   **`generateReport`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: `reportType`, `startDate`, `endDate`, `userId` gibi rapor parametreleri.
    *   **Çıkış**: Oluşturulan rapor verileri veya bir rapor URL'si.
    *   **İşlev**: Kullanıcı aktivite verilerine dayalı çeşitli raporlar oluşturur.

*   **`getReports`**:
    *   **Tetikleyici**: HTTP GET isteği.
    *   **Giriş**: `userId`, `reportType` (isteğe bağlı).
    *   **Çıkış**: Kullanıcının oluşturulan raporlarının listesi.
    *   **İşlev**: Kullanıcının daha önce oluşturulmuş raporlarını alır.

### functions/src/api/task-completion-prediction-api.ts

*   **`predictTaskCompletion`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: Görev verileri, ilgili geçmiş aktivite verileri.
    *   **Çıkış**: Görev tamamlama tahmini (örneğin, tahmini bitiş tarihi, başarı olasılığı).
    *   **İşlev**: Görev tamamlama sürelerini tahmin eder.

### functions/src/api/trello-jira-api.ts

*   **`syncTrelloJira`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: Entegrasyon kimlik bilgileri, senkronize edilecek öğeler (kartlar, görevler).
    *   **Çıkış**: Senkronizasyon durumu ve sonuçları.
    *   **İşlev**: Trello ve Jira ile entegrasyonu yönetir, görevleri ve kartları senkronize eder.

*   **`getTrelloJiraData`**:
    *   **Tetikleyici**: HTTP GET isteği.
    *   **Giriş**: Kimlik bilgileri, alınacak veri türü.
    *   **Çıkış**: Trello veya Jira'dan alınan veriler.
    *   **İşlev**: Trello veya Jira'dan veri alır.

### functions/src/api/trello-jira-webhook-api.ts

*   **`trelloWebhook`**:
    *   **Tetikleyici**: Trello webhook'u.
    *   **Giriş**: Trello'dan gelen etkinlik verileri.
    *   **Çıkış**: Webhook işleme durumu.
    *   **İşlev**: Trello webhook olaylarını işler, ActivityWatch'a entegrasyonu sağlar.

*   **`jiraWebhook`**:
    *   **Tetikleyici**: Jira webhook'u.
    *   **Giriş**: Jira'dan gelen etkinlik verileri.
    *   **Çıkış**: Webhook işleme durumu.
    *   **İşlev**: Jira webhook olaylarını işler, ActivityWatch'a entegrasyonu sağlar.

### functions/src/api/google-calendar-api.ts

*   **`syncGoogleCalendar`**:
    *   **Tetikleyici**: HTTP POST isteği.
    *   **Giriş**: Google Calendar kimlik bilgileri, senkronize edilecek etkinlikler.
    *   **Çıkış**: Senkronizasyon durumu ve sonuçları.
    *   **İşlev**: Google Takvim ile senkronizasyonu yönetir, etkinlikleri alır ve ActivityWatch'a entegre eder.

*   **`getGoogleCalendarEvents`**:
    *   **Tetikleyici**: HTTP GET isteği.
    *   **Giriş**: Kimlik bilgileri, zaman aralığı.
    *   **Çıkış**: Google Takvim'den alınan etkinlikler.
    *   **İşlev**: Google Takvim'den etkinlikleri alır. 