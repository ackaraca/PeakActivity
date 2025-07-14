# Mimari Karar Kayıtları (ADR’ler)

Bu belgede PeakActivity projesinde alınan önemli mimari kararlar (Architecture Decision Records - ADR) listelenir ve her bir kararın bağlamı, alternatifler ve sonuçları açıklanır.

## ADR-001: Firestore Kullanımı
### Bağlam
- Ölçeklenebilir, gerçek zamanlı bir veritabanına ihtiyaç var
- Kullanıcı verileri farklı cihazlardan senkronize olacak

### Karar
Firestore, birincil veri deposu olarak benimsendi.

### Alternatifler
- Geleneksel SQL (PostgreSQL, MySQL)
- Self-hosted NoSQL (MongoDB)

### Sonuç
- Gerçek zamanlı senkronizasyon imkânı
- Otomatik ölçeklenebilirlik
- Bulut maliyetlerinde potansiyel artış

---

## ADR-002: Hibrit AI Mimarisi
### Bağlam
- Gizlilik önceliği, bazen lokal sınıflandırma yeterli
- Karmaşık analizler için bulut AI gerek

### Karar
Lokal sınıflandırma için TensorFlow.js, ileri analizler için OpenAI/Gemini kullanıldı.

### Alternatifler
- Tamamen lokal ML modelleri (TensorFlow Python)
- Tamamen bulut tabanlı ML

### Sonuç
- Gizlilik ve performans dengesi
- Model güncellemeleri için bulut bağlantısı

---

## ADR-003: PraisonAI Agent Entegrasyonu
### Bağlam
- Otomasyon ve öneri katmanı

### Karar
PraisonAI agent framework kullanıldı.

### Alternatifler
- Kendi agent altyapısı geliştirme
- Başka bir açık kaynak agent

### Sonuç
- Hızlı prototipleme
- Topluluk desteği
