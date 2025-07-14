# Dosya/Dizin Yapısı ve Organizasyon

PeakActivity projesi için detaylı dosya organizasyonu ve dizin yapısı rehberi.

## Proje Ana Dizin Yapısı

```
PeakActivity/
├── 📁 aw-server/              # ActivityWatch sunucu modülü
│   ├── 📁 aw_server/          # Ana sunucu kodu (Python)
│   ├── 📁 aw-webui/           # Web arayüzü (Vue.js)
│   ├── 📁 firebase_datastore/ # Firebase entegrasyon katmanı
│   ├── 📁 praisonai_integration/ # AI agent entegrasyonu
│   └── 📄 pyproject.toml      # Python dependencies
├── 📁 aw-qt/                  # Masaüstü Qt arayüzü
│   ├── 📁 aw_qt/              # Qt uygulama kodu
│   ├── 📁 src-tauri/          # Tauri desktop wrapper
│   └── 📄 pyproject.toml      # Python dependencies
├── 📁 aw-watcher-*/           # Etkinlik izleyici modülleri
│   ├── 📁 aw-watcher-afk/     # AFK (away from keyboard) tracker
│   ├── 📁 aw-watcher-window/  # Pencere aktivite tracker
│   └── 📁 aw-watcher-input/   # Klavye/fare input tracker
├── 📁 functions/              # Firebase Cloud Functions
│   ├── 📁 src/                # TypeScript kaynak kodları
│   └── 📄 package.json        # Node.js dependencies
├── 📁 docs/                   # Proje dokümantasyonu
├── 📁 scripts/                # Yardımcı scriptler
├── 📁 public/                 # Static web assets
├── 📄 firebase.json           # Firebase proje konfigürasyonu
├── 📄 package.json            # Root Node.js dependencies
├── 📄 pyproject.toml          # Root Python dependencies
└── 📄 version.md              # Sürüm takip dosyası
```

## Core Modülleri Detayı

### 1. aw-server/ - ActivityWatch Sunucu Katmanı

```
aw-server/
├── 📁 aw_server/
│   ├── 📄 __init__.py         # Modül initializasyonu
│   ├── 📄 main.py             # Ana sunucu entry point
│   ├── 📄 api.py              # REST API endpoints
│   ├── 📄 server.py           # Flask sunucu konfigürasyonu
│   ├── 📄 config.py           # Konfigürasyon yönetimi
│   ├── 📄 rest.py             # REST handler'ları
│   ├── 📄 sync.py             # Senkronizasyon modülü
│   ├── 📄 log.py              # Logging sistemi
│   ├── 📄 settings.py         # Global ayarlar
│   ├── 📄 exceptions.py       # Custom exception'lar
│   ├── 📄 custom_static.py    # Static dosya servisi
│   ├── 📁 firebase_datastore/ # Firebase storage backend
│   │   ├── 📄 __init__.py
│   │   ├── 📄 datastore.py    # Firebase Firestore adapter
│   │   ├── 📄 auth.py         # Firebase Authentication
│   │   ├── 📄 config.py       # Firebase konfigürasyonu
│   │   └── 📄 sync_manager.py # Veri senkronizasyon yöneticisi
│   ├── 📁 data_anonymization/ # Veri anonimleştirme
│   │   ├── 📄 __init__.py
...existing code...
```
