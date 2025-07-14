# aw-qt Modülü Detaylı Dokümantasyon

`aw-qt`, PeakActivity'nin kullanıcı arayüzü modülüdür. Qt framework'ü üzerinde inşa edilmiş masaüstü uygulaması, sistem tray entegrasyonu ve modern Tauri wrapper'ı içerir.

## Modül Genel Bakışı

### Ana Sorumluluklar
- **Kullanıcı Arayüzü**: Ana dashboard ve ayarlar ekranları
- **Sistem Entegrasyonu**: System tray, autostart, bildirimler
- **Process Yönetimi**: aw-server ve watcher'ların başlatılması/durdurulması
- **Kullanıcı Deneyimi**: Modern, responsive, çok dilli arayüz
- **Veri Görselleştirme**: Grafikler, raporlar, analytics

### Teknoloji Stack
- **Qt Framework**: PyQt5/PySide2 (Python GUI)
- **Tauri**: Modern desktop wrapper (Rust + Web)
- **Vue.js**: Web-based UI components
- **Python**: Backend logic ve sistem entegrasyonu
- **Rust**: Native system integrations

## Core Dosyalar ve İşlevleri

### 1. main.py - Ana Uygulama Entry Point

```python
# aw-qt/aw_qt/main.py
import sys
import signal
import logging
from typing import List, Optional
from pathlib import Path

from PyQt5.QtWidgets import QApplication, QSystemTrayIcon
from PyQt5.QtCore import QTimer, QThread, pyqtSignal
from PyQt5.QtGui import QIcon

from aw_core.log import setup_logging
from aw_core.dirs import get_data_dir

from .manager import Manager
from .trayicon import TrayIcon
from .config import load_config, save_config
from .manual_activity_dialog import ManualActivityDialog

logger = logging.getLogger(__name__)

class PeakActivityApp(QApplication):
    """Ana PeakActivity Qt uygulaması"""
    
    def __init__(self, argv: List[str]):
        super().__init__(argv)
        
        # Uygulama metadata
        self.setApplicationName("PeakActivity")
        self.setApplicationVersion("2.0.0")
        self.setQuitOnLastWindowClosed(False)
        
        # Konfigürasyon yükle
        self.config = load_config()
        ...existing code...
