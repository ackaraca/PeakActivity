# aw-server Modülü Detaylı Dokümantasyon

`aw-server`, PeakActivity'nin kalbi olan ActivityWatch sunucu modülüdür. Veri toplama, işleme, depolama ve API servisleri sunar.

## Modül Genel Bakışı

### Ana Sorumluluklar
- **Veri Toplama**: Watcher'lardan gelen etkinlik verilerini toplama
- **Veri Depolama**: Lokal (SQLite/Peewee) ve bulut (Firestore) depolama
- **API Sunumu**: REST API ile veri erişimi
- **Veri İşleme**: Anonymization, kategorilendirme, analiz
- **Senkronizasyon**: Firebase ile bulut senkronizasyonu

### Teknoloji Stack
- **Backend**: Python 3.9+ (Flask framework)
- **Database**: SQLite/PostgreSQL (Peewee ORM) + Firestore
- **API**: RESTful endpoints
- **Authentication**: Firebase Auth
- **Logging**: Python logging + structured logging

## Core Dosyalar ve İşlevleri

### 1. main.py - Ana Entry Point

```python
# aw-server/aw_server/main.py
import argparse
import logging
from typing import Optional

from aw_core.log import setup_logging
from aw_datastore import get_storage_methods

from .server import create_app
from .config import load_config

def main() -> None:
    """
    Ana server başlatma fonksiyonu
    - Konfigürasyon yükleme
    - Storage backend seçimi
    - Flask app başlatma
    """
    parser = argparse.ArgumentParser(description="ActivityWatch server")
    parser.add_argument("--testing", action="store_true", help="Run in testing mode")
    parser.add_argument("--verbose", "-v", action="store_true", help="Verbose logging")
    parser.add_argument("--log-json", action="store_true", help="Output logs in JSON format")
    parser.add_argument("--host", default="127.0.0.1", help="Host to bind to")
    parser.add_argument("--port", default=5600, type=int, help="Port to bind to")
    parser.add_argument("--storage", choices=get_storage_methods().keys(), 
                       help="Storage method to use")
    
    args = parser.parse_args()
    
    # Logging setup
    setup_logging(
        "aw-server", 
        testing=args.testing, 
        verbose=args.verbose, 
        log_stderr=True,
    ...existing code...
```
