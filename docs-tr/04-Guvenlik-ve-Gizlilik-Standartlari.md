# Güvenlik ve Gizlilik Standartları

PeakActivity, kullanıcı verilerinin güvenliği ve gizliliği konusunda en üst düzey önlemleri uygular.

## Veri Sınıflandırması
- **Public**: Anonimleştirilmiş özet metrikler
- **Internal**: Kullanıcı ayarları ve tercihler
- **Confidential**: Ham etkinlik verileri
- **Restricted**: Kimlik doğrulama tokenları

## Güvenlik İlkeleri
1. En az ayrıcalık (Least Privilege)
2. Şifreleme (Veri aktarımda TLS; depolamada AES-256)
3. Ortam değişkenleri içinde gizli bilgiler
4. Düzenli güvenlik taramaları (OWASP Top 10)
5. İki faktörlü kimlik doğrulama (2FA) tüm admin hesaplarında

## Gizlilik Yaklaşımı
- Privacy-by-design: Lokal işlem varsayılan
- Kullanıcı onayı olmadan hiçbir veri buluta gönderilmez
- Hassas veriler için lokal edge AI işleme
- Veri silme politikası: 30 gün içinde eski veriler temizlenir

## Yetkilendirme ve Kimlik Doğrulama
- Firebase Auth kullanılarak JWT tabanlı kimlik doğrulama
- Rol tabanlı erişim kontrolü (RBAC)
- Ara katman (middleware) içinde istek doğrulama şeması
