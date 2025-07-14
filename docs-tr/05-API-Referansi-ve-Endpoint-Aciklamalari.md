# API Referansı ve Endpoint Açıklamaları

Bu belge, PeakActivity backend API’sinin tüm endpoint’lerini, parametrelerini ve kullanımlarını açıklar.

## Authentication

### POST /api/v1/auth/login
- Açıklama: Kullanıcı kimlik doğrulama
- İstek Gövdesi:
  ```json
  { "email": "user@example.com", "password": "string" }
  ```
- Başarı Cevabı (200):
  ```json
  { "token": "<jwt-token>", "expiresIn": 3600 }
  ```

### POST /api/v1/auth/register
- Açıklama: Yeni kullanıcı oluşturma
- İstek Gövdesi:
  ```json
  { "email": "user@example.com", "password": "string", "name": "John Doe" }
  ```
- Başarı Cevabı (201):
  ```json
  { "userId": "uid_12345" }
  ```

## Events

### GET /api/v1/events
- Açıklama: Kullanıcının etkinlik kayıtlarını getirir
- Query Parametreleri:
  - `startDate` (ISO string)
  - `endDate` (ISO string)
- Başarı Cevabı (200): Array of Event objects

### POST /api/v1/events
- Açıklama: Yeni etkinlik kaydı ekleme
- İstek Gövdesi: Event objesi
- Başarı Cevabı (201): Oluşturulan Event objesi

## Insights

### GET /api/v1/insights
- Açıklama: AI içgörüleri getirir
- Query Parametreleri:
  - `type` (focus|productivity)
- Başarı Cevabı (200): Array of Insight objeleri

### POST /api/v1/insights/analyze
- Açıklama: Belirtilen veri aralığı için analiz başlatır
- İstek Gövdesi:
  ```json
  { "startDate": "2025-01-01T00:00:00Z", "endDate": "2025-01-02T00:00:00Z" }
  ```
- Başarı Cevabı (202): İşlem başlatıldı mesajı
