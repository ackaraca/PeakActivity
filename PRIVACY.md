# PeakActivity Gizlilik Politikası

**Son Güncelleme:** 2024-12-28  
**Versiyon:** 0.4.0

## 📋 Genel Bakış

PeakActivity, kullanıcı gizliliğini en üst öncelik olarak kabul eder. Bu belge, uygulamamızın nasıl veri topladığını, kullandığını, koruduğunu ve paylaştığını açıklar.

## 🔐 Veri Şifreleme ve Güvenlik

### Yerel Şifreleme
- **Veritabanı:** SQLCipher ile AES-256 şifreleme
- **Anahtar Yönetimi:** Kullanıcıya özel Argon2id anahtar türetme
- **Dosya Şifreleme:** Ayarlar ve loglar AES-256-GCM ile şifrelenir
- **Bellek Koruması:** Hassas veriler için güvenli bellek kullanımı

### Bulut Şifreleme
- **Transit:** TLS 1.3 ile end-to-end şifreleme
- **Rest:** Firestore'da şifreli veri depolama
- **Anahtarlar:** Google Secret Manager ile korumalı
- **Backup:** Şifreli yedekleme sistemi

## 📊 Veri Sınıflandırması

### 1. Ham Veri (RAW)
**Ne toplarız:**
- Pencere başlıkları ve uygulama adları
- Etkinlik süreleri ve zaman damgaları
- Klavye ve fare aktivite verileri
- Ekran görüntüleri (opsiyonel)

**Nasıl kullanırız:**
- AI destekli analiz ve öneriler
- Verimlilik raporları oluşturma
- Uygulama geliştirme ve iyileştirme
- İstatistiksel analiz

**Güvenlik:**
- Açık kullanıcı onayı gerekli
- Dilediğiniz zaman durdurabilirsiniz
- Veri minimizasyon ilkeleri uygulanır

### 2. Şifrelenmiş + AI Destekli Veri
**Ne toplarız:**
- Client-side şifrelenmiş aktivite verileri
- Anonimleştirilmiş kullanım istatistikleri
- AI işleme sonuçları

**Nasıl işleriz:**
- Veriler sadece cihazınızda çözülür
- AI işleme yerel olarak yapılır
- İşlenmiş sonuçlar şifreli olarak saklanır

**Güvenlik:**
- AES-256-GCM şifreleme
- API kötüye kullanım koruması
- Sıkı rate limiting
- Zararlı kod taraması

### 3. Şifrelenmiş + AI Desteksiz Veri
**Ne toplarız:**
- Sadece yedekleme amaçlı şifreli veriler
- Hiçbir AI işlem yapılmaz

**Nasıl kullanırız:**
- Sadece güvenli yedekleme
- Cihaz değişikliklerinde veri geri yükleme
- Senkronizasyon hizmeti

**Güvenlik:**
- En yüksek gizlilik seviyesi
- Zero-knowledge architecture
- Sadece siz verilerinizi görebilirsiniz

## 🎯 Veri Toplama Amaçları

### Zorunlu Veri Toplama
**Sistem Verileri:**
- Uygulama çökme raporları
- Performans metrikleri
- API kullanım istatistikleri
- Güvenlik olayları

**Hukuki Dayanağı:** Meşru menfaat (uygulama güvenilirliği)

### Opsiyonel Veri Toplama
**Kullanım Verileri:**
- Kategori bazlı ekran süreleri
- Uygulama kullanım süreleri
- AI önerilerine verilen tepkiler
- Özellik kullanım istatistikleri

**Hukuki Dayanağı:** Açık kullanıcı onayı

## 🛡️ Veri Koruma Hakları

### GDPR Kapsamında Haklarınız
1. **Bilgi Alma Hakkı:** Hangi verilerinizin toplandığını öğrenme
2. **Erişim Hakkı:** Kişisel verilerinizin kopyasını alma
3. **Düzeltme Hakkı:** Yanlış bilgilerin düzeltilmesi
4. **Silme Hakkı:** "Unutulma hakkı" - verilerinizin silinmesi
5. **Taşınabilirlik Hakkı:** Verilerinizi başka servise aktarma
6. **İtiraz Hakkı:** Veri işlemeye itiraz etme

### Haklarınızı Kullanma
- **Uygulama içi:** Ayarlar > Gizlilik > Veri Hakları
- **E-posta:** privacy@peakactivity.app
- **Yanıt süresi:** 30 gün içinde

## 🔄 Veri Saklama Süreleri

| Veri Türü | Saklama Süresi | Silme Koşulu |
|-----------|----------------|---------------|
| Ham aktivite verileri | Maksimum 2 yıl | Kullanıcı talebi veya hesap silme |
| Şifrelenmiş veriler | Kullanıcı kontrolünde | Kullanıcı talebi |
| Sistem logları | 90 gün | Otomatik |
| Güvenlik olayları | 1 yıl | Yasal gereklilik |
| Analytics verileri | 13 ay | GDPR uyumluluğu |

## 🤝 Veri Paylaşımı

### Üçüncü Taraflarla Paylaşım
**Paylaşmadığımız veriler:**
- Kişisel aktivite detayları
- Şifreli kullanıcı verileri
- Kimlik bilgileri
- Hassas kişisel bilgiler

**Sınırlı paylaşım:**
- **Analytics sağlayıcıları:** Anonimleştirilmiş istatistikler
- **Bulut altyapı:** Şifrelenmiş veriler (Google Cloud)
- **Güvenlik servisleri:** Tehdit tespiti için

### Yasal Gereklilikler
Sadece aşağıdaki durumlarda veri paylaşırız:
- Yasal zorunluluk
- Mahkeme kararı
- Ulusal güvenlik
- Kullanıcı güvenliğini koruma

## 🎛️ Gizlilik Kontrolü

### Kullanıcı Ayarları
**Temel Ayarlar:**
- Veri toplama seviyesi seçimi
- AI işleme tercihleri
- Paylaşım izinleri
- Otomatik silme ayarları

**Gelişmiş Ayarlar:**
- Şifreleme algoritması seçimi
- Anahtar yönetimi
- Yedekleme ayarları
- 2FA ve güvenlik

### Onay Yönetimi
- **Granüler kontrol:** Her veri türü için ayrı onay
- **Kolay geri çekme:** Tek tıkla onay iptal etme
- **Geçmiş görüntüleme:** Onay değişiklik geçmişi
- **Düzenli hatırlatma:** Yılda bir onay yenileme

## 🔐 Anahtar Yönetimi ve Kurtarma

### Master Password
- Tüm verilerinizi koruyan ana şifre
- Argon2id ile güçlendirilmiş türetme
- Asla sunucularımızda saklanmaz

### Kurtarma Yöntemleri
1. **Güvenlik Soruları:** 3 adet güvenlik sorusu
2. **2FA Backup Kodları:** One-time kullanım kodları
3. **E-posta Kurtarma:** Güvenli token ile
4. **Biometric/WebAuthn:** FIDO2 destekli

### Anahtar Kaybı
⚠️ **Önemli:** Anahtarınızı kaybederseniz verilerinizi kurtaramayız. Bu, güvenliğiniz için tasarlanmış bir özelliktir.

## 🌍 Uluslararası Veri Aktarımları

### Veri Konumları
- **Birincil:** Avrupa (Google Cloud Europe)
- **Yedek:** ABD (şifrelenmiş)
- **İşleme:** Kullanıcı cihazı (lokal)

### Güvenlik Önlemleri
- Standart Sözleşmeli Maddeler (SCC)
- Adequacy kararları
- GDPR Article 46 uyumluluğu
- Ek güvenlik önlemleri

## 📞 İletişim

### Gizlilik Sorularınız
- **E-posta:** privacy@peakactivity.app
- **Adres:** [Şirket Adresi]
- **Telefon:** [Telefon Numarası]

### Veri Koruma Sorumlusu
- **E-posta:** dpo@peakactivity.app
- **Görev:** GDPR uyumluluk ve veri koruma

### Şikayet Hakkı
AB vatandaşları için:
- Yerel veri koruma otoritesine şikayet hakkı
- [Ülkenize göre DPA iletişim bilgileri]

## 📝 Değişiklikler

### Politika Güncellemeleri
- Önemli değişiklikler 30 gün önceden bildirilir
- E-posta ve uygulama içi bildirim
- Eski versiyon geçmişi mevcut

### Versiyon Geçmişi
- **v0.4.0 (2024-12-28):** İlk kapsamlı gizlilik politikası
- Gelecek güncellemeler burada listelenecek

## ✅ Sertifikalar ve Uyumluluk

### Güvenlik Standartları
- SOC 2 Type II uyumluluğu (hedef)
- ISO 27001 sertifikasyonu (planlanan)
- OWASP Top 10 uyumluluğu

### Gizlilik Sertifikaları
- GDPR uyumluluğu
- CCPA uyumluluğu (Kaliforniya)
- Privacy Shield (varsa)

---

**Son Not:** Bu gizlilik politikası yaşayan bir belgedir ve teknolojik gelişmeler ile yasal değişikliklere göre güncellenebilir. Güncel versiyonu her zaman uygulama içinde bulabilirsiniz. 