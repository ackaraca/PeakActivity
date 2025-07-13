# PeakActivity - Akıllı Üretkenlik ve Dijital Sağlık Koçu

**Son Güncelleme:** 2025-07-09 03:10:34

PeakActivity, ActivityWatch projesini temel alarak geliştirilmiş yeni nesil bir SaaS ürünüdür. Ham veri yığınları sunmak yerine, yapay zeka aracılığıyla veriyi eyleme geçirilebilir, kişiselleştirilmiş ve bağlamsal bilgelere dönüştürür.

## 🎯 Proje Vizyonu

ActivityWatch'ın güçlü veri toplama altyapısını kullanarak, kullanıcıların sadece zamanlarını nereye harcadıklarını görmelerini değil, aynı zamanda üretkenliklerini, odaklanma kalitelerini ve dijital refahlarını proaktif olarak artırmalarını sağlayan kapsamlı bir çözüm.

## 🏗️ Teknik Mimari

### Hibrit Mimari Yapısı
- **Yerel Veri Toplama**: ActivityWatch modifiye edilmiş izleyicileri
- **Bulut Omurgası**: Google Firebase ekosistemi
- **Frontend Katmanları**: Windows masaüstü (Tauri) + Web paneli (Vue.js)

### Teknoloji Yığını
- **Desktop App**: Tauri + Vue.js 3 + TypeScript
- **Web Panel**: Vue.js 3 + Composition API + TypeScript  
- **Backend**: Firebase Cloud Functions (Python)
- **Database**: Cloud Firestore
- **Authentication**: Firebase Auth
- **Hosting**: Firebase Hosting + Google Cloud Platform

## 📁 Proje Yapısı

```
awfork/
├── desktop-app/          # Tauri Windows uygulaması
├── web-panel/           # Vue.js web paneli
├── cloud-functions/     # Firebase Cloud Functions (Python)
├── shared/              # Ortak TypeScript tipleri
├── .cursor/rules/       # Cursor IDE geliştirme kuralları
├── docs/               # Proje dokümantasyonu
├── firebase.json       # Firebase yapılandırması
├── .firebaserc        # Firebase proje ayarları
└── README.md          # Bu dosya
```

## 🚀 Geliştirme Kuralları

### Kodlama Standartları
- **Dil**: Tüm kod ve dosya isimleri İngilizce
- **Açıklamalar**: Kullanıcı arayüzü metinleri ve açıklamalar Türkçe
- **Commit**: İngilizce commit mesajları
- **Çalışma Akışı**: 3 prompt geliştirme döngüsü

### Geliştirme Ortamı Kurulumu

#### Ön Gereksinimler
- Node.js 18+ 
- Python 3.9+
- Rust (Tauri için)
- Firebase CLI
- Git

#### Kurulum Adımları

1.  **Ön Gereksinimleri Kurun**
    *   **Node.js**: Eğer yüklü değilse, [Node.js resmi web sitesi](https://nodejs.org/) adresinden LTS sürümünü indirin ve kurun. Kurulumdan sonra `node -v` ve `npm -v` komutlarını çalıştırarak doğru şekilde kurulduğunu doğrulayın.
    *   Diğer tüm ön gereksinimlerin (Python, Rust, Firebase CLI, Git) yüklü olduğundan emin olun.

2.  **Depoyu Klonlayın**
    ```bash
    git clone <repository-url>
    cd PeakActivityMain
    ```

3.  **JavaScript Bağımlılıklarını Kurun**
    ```bash
    npm install
    cd functions
    npm install
    cd ../aw-server/aw-webui
    npm install
    cd ../../..
    ```

4.  **Python Bağımlılıklarını Kurun**
    ```bash
    cd aw-server
    pip install -r requirements.txt
    cd ..
    ```

5.  **Firebase Kurulumu**
   ```bash
   npm install -g firebase-tools
   firebase login
   firebase init
   ```

6. **Desktop App Kurulumu**
   ```bash
   cd desktop-app
   npm install
   npm run tauri dev
   ```

7. **Web Panel Kurulumu**
   ```bash
   cd web-panel
   npm install
   npm run dev
   ```

8. **Cloud Functions Kurulumu**
   ```bash
   cd cloud-functions
   pip install -r requirements.txt
   firebase emulators:start
   ```

## 🔧 Geliştirme Araçları


### Git İş Akışı
```bash
# Özellik geliştirme
git checkout -b feature/yeni-ozellik
git commit -m "feat: add new feature"
git push origin feature/yeni-ozellik

# Güncellemeler
git checkout main
git pull origin main
git merge feature/yeni-ozellik
```

## 📊 Özellik Katmanları

### Free Katman
- Temel aktivite takibi
- Basit raporlama
- 3 otomatik kural

### Premium Katman
- AI destekli içgörüler
- Haftalık detaylı raporlar
- Sınırsız otomasyon kuralları
- Gelişmiş hedef takibi

### Pro Katman
- Takım özellikleri
- Anonim benchmarking
- API erişimi
- Öncelikli destek

## 🔒 Güvenlik ve Gizlilik

- **Veri Şifreleme**: Uçtan uca şifreleme
- **Gizlilik**: Kullanıcı verilerinin anonim işlenmesi
- **GDPR Uyumu**: Avrupa veri koruma standardları
- **Yerel İşleme**: Hassas veriler yerel olarak işlenir

## 📚 Dokümantasyon

Detaylı dokümantasyon için `docs/` dizinini inceleyin:
- Mimari tasarım dokümanları
- API referansları  
- Kullanıcı kılavuzları
- Geliştirici rehberleri


## 📝 Lisans

Bu proje MIT lisansı altında lisanslanmıştır. Detaylar için `LICENSE` dosyasına bakın.

## 🔗 Bağlantılar

- [ActivityWatch](https://github.com/ActivityWatch/activitywatch) - Temel proje
- [Firebase](https://firebase.google.com/) - Backend platform
- [Tauri](https://tauri.app/) - Desktop uygulama framework'ü
- [Vue.js](https://vuejs.org/) - Frontend framework

---

**Not**: Bu proje aktif geliştirme aşamasındadır. Üretim ortamında kullanmadan önce dokümantasyonu dikkatlice okuyun. 

