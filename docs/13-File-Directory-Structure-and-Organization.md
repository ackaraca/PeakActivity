# File/Directory Structure and Organization

A detailed guide to file organization and directory structure for the PeakActivity project.

## Main Project Directory Structure

```
PeakActivity/
├── 📁 aw-server/              # ActivityWatch server module
│   ├── 📁 aw_server/          # Main server code (Python)
│   ├── 📁 aw-webui/           # Web interface (Vue.js)
│   ├── 📁 firebase_datastore/ # Firebase integration layer
│   ├── 📁 praisonai_integration/ # AI agent integration
│   └── 📄 pyproject.toml      # Python dependencies
├── 📁 aw-qt/                  # Desktop Qt interface
│   ├── 📁 aw_qt/              # Qt application code
│   ├── 📁 src-tauri/          # Tauri desktop wrapper
│   └── 📄 pyproject.toml      # Python dependencies
├── 📁 aw-watcher-*/           # Activity watcher modules
│   ├── 📁 aw-watcher-afk/     # AFK (away from keyboard) tracker
│   ├── 📁 aw-watcher-window/  # Window activity tracker
│   └── 📁 aw-watcher-input/   # Keyboard/mouse input tracker
├── 📁 functions/              # Firebase Cloud Functions
│   ├── 📁 src/                # TypeScript source code
│   └── 📄 package.json        # Node.js dependencies
├── 📁 docs/                   # Project documentation
├── 📁 scripts/                # Helper scripts
├── 📁 public/                 # Static web assets
├── 📄 firebase.json           # Firebase project configuration
├── 📄 package.json            # Root Node.js dependencies
├── 📄 pyproject.toml          # Root Python dependencies
└── 📄 version.md              # Version tracking file
```

## Core Module Details

### 1. aw-server/ - ActivityWatch Server Layer

```
aw-server/
├── 📁 aw_server/
│   ├── 📄 __init__.py         # Module initialization
│   ├── 📄 main.py             # Main server entry point
│   ├── 📄 api.py              # REST API endpoints
│   ├── 📄 server.py           # Flask server configuration
│   ├── 📄 config.py           # Configuration management
│   ├── 📄 rest.py             # REST handlers
│   ├── 📄 sync.py             # Synchronization module
│   ├── 📄 log.py              # Logging system
│   ├── 📄 settings.py         # Global settings
│   ├── 📄 exceptions.py       # Custom exceptions
│   ├── 📄 custom_static.py    # Static file service
│   ├── 📁 firebase_datastore/ # Firebase storage backend
│   │   ├── 📄 __init__.py
│   │   ├── 📄 datastore.py    # Firebase Firestore adapter
│   │   ├── 📄 auth.py         # Firebase Authentication
│   │   ├── 📄 config.py       # Firebase configuration
│   │   └── 📄 sync_manager.py # Data synchronization manager
│   ├── 📁 data_anonymization/ # Data anonymization
│   │   ├── 📄 __init__.py
...existing code...
```
