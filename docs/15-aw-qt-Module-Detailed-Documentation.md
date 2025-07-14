# aw-qt Module Detailed Documentation

`aw-qt` is the user interface module of PeakActivity. Built on the Qt framework, it includes a desktop application, system tray integration, and a modern Tauri wrapper.

## Module Overview

### Main Responsibilities
- **User Interface**: Main dashboard and settings screens
- **System Integration**: System tray, autostart, notifications
- **Process Management**: Starting/stopping aw-server and watchers
- **User Experience**: Modern, responsive, multilingual interface
- **Data Visualization**: Charts, reports, analytics

### Technology Stack
- **Qt Framework**: PyQt5/PySide2 (Python GUI)
- **Tauri**: Modern desktop wrapper (Rust + Web)
- **Vue.js**: Web-based UI components
- **Python**: Backend logic and system integration
- **Rust**: Native system integrations

## Core Files and Functions

### 1. main.py - Main Application Entry Point

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
    """Main PeakActivity Qt application"""
    
    def __init__(self, argv: List[str]):
        super().__init__(argv)
        
        # Application metadata
        self.setApplicationName("PeakActivity")
        self.setApplicationVersion("2.0.0")
        self.setQuitOnLastWindowClosed(False)
        
        # Load configuration
        self.config = load_config()
        ...existing code...
