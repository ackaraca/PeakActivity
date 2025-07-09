# ActivityWatch Qt Firebase Entegrasyonu

**Oluşturulma Tarihi:** 2025-01-21 04:55:00  
**Modül:** aw-qt Firebase Integration  
**Amaç:** aw-qt tray icon ve module manager'ın Firebase ile tam entegrasyonu

## 1. Mevcut aw-qt Analizi

### 1.1 Ana Bileşenler
```python
# Mevcut aw-qt yapısı
- TrayIcon: Sistem tray icon ve context menu
- Manager: Module discovery ve process management
- Module: Individual module representation ve control
- Config: autostart_modules ve diğer ayarlar
```

### 1.2 Temel İşlevler
```python
# manager.py - Module Management
def _discover_modules_bundled() -> List[Module]
def _discover_modules_system() -> List[Module]
class Manager:
    def autostart(self, autostart_modules: List[str])
    def start/stop/toggle module operations
    
# trayicon.py - UI Integration  
class TrayIcon:
    def _build_rootmenu() -> context menu
    def open_webui(root_url) -> localhost dashboard
```

## 2. Firebase Qt Integration Mimarisi

### 2.1 Firebase SDK Integration
```python
# Firebase Qt Client
import firebase_admin
from firebase_admin import credentials, firestore, auth
from google.cloud.firestore_v1 import Client
from PyQt6.QtCore import QThread, pyqtSignal

class FirebaseQtClient(QObject):
    # Authentication signals
    auth_success = pyqtSignal(dict)  # user_info
    auth_failed = pyqtSignal(str)    # error_message
    
    # Module status signals  
    module_status_changed = pyqtSignal(str, bool)  # module_name, is_running
    config_updated = pyqtSignal(dict)              # new_config
    
    def __init__(self):
        self.db = firestore.client()
        self.current_user = None
        self.device_id = self._generate_device_id()
        
    def authenticate(self, email: str, password: str):
        # Firebase Auth integration
        
    def sync_module_status(self, module_name: str, status: bool):
        # Real-time module status sync
        
    def sync_configuration(self, config: dict):
        # Cross-device config synchronization
```

### 2.2 Cloud-enabled Module Manager
```python
class FirebaseManager(Manager):
    def __init__(self, testing: bool = False):
        super().__init__(testing)
        self.firebase_client = FirebaseQtClient()
        self.cloud_modules = {}  # Firebase-enabled modules
        self.sync_enabled = True
        
        # Firebase listeners
        self.firebase_client.auth_success.connect(self.on_auth_success)
        self.firebase_client.module_status_changed.connect(self.on_remote_module_change)
        
    def discover_modules(self):
        # Hybrid discovery: local + cloud modules
        local_modules = super().discover_modules()
        cloud_modules = self._discover_cloud_modules()
        return self._merge_module_lists(local_modules, cloud_modules)
        
    def _discover_cloud_modules(self) -> List[CloudModule]:
        # Firebase-based module discovery
        if not self.firebase_client.current_user:
            return []
            
        user_config = self.firebase_client.get_user_config()
        enabled_cloud_modules = user_config.get('cloud_modules', [])
        
        cloud_modules = []
        for module_config in enabled_cloud_modules:
            module = CloudModule(
                name=module_config['name'],
                type='cloud',
                endpoint=module_config['endpoint'],
                region=module_config['region']
            )
            cloud_modules.append(module)
        return cloud_modules
        
    def start(self, module_name: str):
        module = self._get_module(module_name)
        if isinstance(module, CloudModule):
            # Start cloud module via Firebase Cloud Functions
            success = self._start_cloud_module(module)
        else:
            # Start local module
            success = super().start(module_name)
            
        if success and self.sync_enabled:
            # Sync status to Firebase
            self.firebase_client.sync_module_status(module_name, True)
```

## 3. Real-time Module Status Synchronization

### 3.1 Firebase Realtime Listeners
```python
class ModuleStatusSync(QThread):
    status_changed = pyqtSignal(str, bool, str)  # module, status, device_id
    
    def __init__(self, firebase_client: FirebaseQtClient):
        super().__init__()
        self.firebase_client = firebase_client
        self.user_id = None
        
    def run(self):
        # Firestore real-time listener
        def on_snapshot(doc_snapshot, changes, read_time):
            for doc in doc_snapshot:
                module_data = doc.to_dict()
                self.status_changed.emit(
                    module_data['name'],
                    module_data['status'],
                    module_data['device_id']
                )
                
        # Listen to user's module status collection
        doc_ref = self.firebase_client.db.collection('users')\
                      .document(self.user_id)\
                      .collection('module_status')
        doc_watch = doc_ref.on_snapshot(on_snapshot)
        
    def sync_status(self, module_name: str, status: bool):
        doc_ref = self.firebase_client.db.collection('users')\
                      .document(self.user_id)\
                      .collection('module_status')\
                      .document(module_name)
        doc_ref.set({
            'name': module_name,
            'status': status,
            'device_id': self.firebase_client.device_id,
            'timestamp': firestore.SERVER_TIMESTAMP,
            'device_info': {
                'hostname': platform.node(),
                'platform': platform.system(),
                'python_version': platform.python_version()
            }
        })
```

### 3.2 Cross-device Status Handling
```python
class DeviceStatusManager:
    def __init__(self, firebase_manager: FirebaseManager):
        self.manager = firebase_manager
        self.device_conflicts = {}
        
    def handle_remote_status_change(self, module_name: str, status: bool, source_device: str):
        local_module = self.manager._get_module(module_name)
        if not local_module:
            return
            
        current_local_status = local_module.is_alive()
        
        if current_local_status != status:
            # Status conflict between devices
            self._handle_status_conflict(module_name, status, source_device)
            
    def _handle_status_conflict(self, module_name: str, remote_status: bool, source_device: str):
        # Conflict resolution strategies:
        # 1. Last-write-wins
        # 2. Master device priority  
        # 3. User confirmation dialog
        
        conflict_resolution = self.manager.config.get('conflict_resolution', 'user_confirm')
        
        if conflict_resolution == 'user_confirm':
            self._show_conflict_dialog(module_name, remote_status, source_device)
        elif conflict_resolution == 'last_write_wins':
            self._apply_remote_status(module_name, remote_status)
        elif conflict_resolution == 'master_device':
            self._apply_master_device_logic(module_name, remote_status, source_device)
```

## 4. Firebase-hosted Web UI Integration

### 4.1 Dynamic URL Configuration
```python
class FirebaseWebUIManager:
    def __init__(self, firebase_client: FirebaseQtClient):
        self.firebase_client = firebase_client
        self.web_ui_urls = {
            'local': 'http://localhost:5600',
            'cloud': None  # Will be fetched from Firebase config
        }
        
    def get_dashboard_url(self) -> str:
        if self.firebase_client.current_user:
            # Get user's Firebase-hosted dashboard URL
            user_config = self.firebase_client.get_user_config()
            cloud_dashboard = user_config.get('web_ui_endpoint')
            
            if cloud_dashboard and self._is_cloud_dashboard_available(cloud_dashboard):
                return f"{cloud_dashboard}/dashboard"
        
        # Fallback to local dashboard
        return f"{self.web_ui_urls['local']}/dashboard"
        
    def get_api_browser_url(self) -> str:
        base_url = self.get_dashboard_url().replace('/dashboard', '')
        return f"{base_url}/api"
        
    def _is_cloud_dashboard_available(self, url: str) -> bool:
        try:
            response = requests.head(url, timeout=3)
            return response.status_code == 200
        except:
            return False
```

### 4.2 Enhanced Tray Icon Menu
```python
class FirebaseTrayIcon(TrayIcon):
    def __init__(self, manager: FirebaseManager, icon: QIcon, parent=None, testing=False):
        super().__init__(manager, icon, parent, testing)
        self.firebase_manager = manager
        self.web_ui_manager = FirebaseWebUIManager(manager.firebase_client)
        
        # Connect Firebase signals
        manager.firebase_client.auth_success.connect(self._on_firebase_auth)
        manager.firebase_client.auth_failed.connect(self._on_firebase_auth_failed)
        
    def _build_rootmenu(self):
        menu = QMenu(self._parent)
        
        # Authentication section
        if self.firebase_manager.firebase_client.current_user:
            user_info = self.firebase_manager.firebase_client.current_user
            menu.addAction(f"Logged in as: {user_info['email']}").setEnabled(False)
            menu.addAction("🔄 Sync Status", self._sync_all_modules)
            menu.addAction("⚙️ Cloud Settings", self._open_cloud_settings)
            menu.addSeparator()
        else:
            menu.addAction("🔐 Login to Firebase", self._show_login_dialog)
            menu.addSeparator()
            
        # Web UI links (dynamic based on auth status)
        dashboard_url = self.web_ui_manager.get_dashboard_url()
        api_url = self.web_ui_manager.get_api_browser_url()
        
        menu.addAction("📊 Open Dashboard", lambda: open_webui(dashboard_url))
        menu.addAction("🔧 Open API Browser", lambda: open_webui(api_url))
        menu.addSeparator()
        
        # Enhanced modules menu
        modulesMenu = menu.addMenu("📁 Modules")
        self._build_firebase_modulemenu(modulesMenu)
        
        # Rest of the menu...
        super()._build_rootmenu_base(menu)
        
    def _build_firebase_modulemenu(self, moduleMenu: QMenu):
        moduleMenu.clear()
        
        # Local modules section
        local_header = moduleMenu.addAction("💻 Local Modules")
        local_header.setEnabled(False)
        
        for module in self.firebase_manager.modules_bundled + self.firebase_manager.modules_system:
            self._add_module_menuitem(moduleMenu, module)
            
        moduleMenu.addSeparator()
        
        # Cloud modules section (if authenticated)
        if self.firebase_manager.firebase_client.current_user:
            cloud_header = moduleMenu.addAction("☁️ Cloud Modules")
            cloud_header.setEnabled(False)
            
            for module in self.firebase_manager.cloud_modules.values():
                self._add_cloud_module_menuitem(moduleMenu, module)
                
        # Sync status indicator
        moduleMenu.addSeparator()
        sync_status = "🟢 Sync Enabled" if self.firebase_manager.sync_enabled else "🔴 Sync Disabled"
        sync_action = moduleMenu.addAction(sync_status, self._toggle_sync)
```

## 5. Authentication & User Management

### 5.1 Firebase Authentication Dialog
```python
class FirebaseAuthDialog(QDialog):
    auth_success = pyqtSignal(dict)
    auth_failed = pyqtSignal(str)
    
    def __init__(self, parent=None):
        super().__init__(parent)
        self.setupUI()
        
    def setupUI(self):
        layout = QVBoxLayout()
        
        # Title
        title = QLabel("Firebase Authentication")
        title.setStyleSheet("font-size: 16px; font-weight: bold;")
        
        # Form
        self.email_input = QLineEdit()
        self.email_input.setPlaceholderText("Email")
        
        self.password_input = QLineEdit()
        self.password_input.setEchoMode(QLineEdit.EchoMode.Password)
        self.password_input.setPlaceholderText("Password")
        
        # Buttons
        button_layout = QHBoxLayout()
        login_btn = QPushButton("Login")
        register_btn = QPushButton("Register")
        cancel_btn = QPushButton("Cancel")
        
        login_btn.clicked.connect(self.login)
        register_btn.clicked.connect(self.register)
        cancel_btn.clicked.connect(self.reject)
        
        # Layout
        layout.addWidget(title)
        layout.addWidget(self.email_input)
        layout.addWidget(self.password_input)
        button_layout.addWidget(login_btn)
        button_layout.addWidget(register_btn)
        button_layout.addWidget(cancel_btn)
        layout.addLayout(button_layout)
        
        self.setLayout(layout)
        
    def login(self):
        email = self.email_input.text()
        password = self.password_input.text()
        
        # Firebase authentication
        try:
            # Use Firebase Admin SDK or REST API
            auth_result = self._authenticate_with_firebase(email, password)
            self.auth_success.emit(auth_result)
            self.accept()
        except Exception as e:
            self.auth_failed.emit(str(e))
            QMessageBox.warning(self, "Authentication Failed", str(e))
```

## 6. Configuration Synchronization

### 6.1 Firebase Config Management
```python
class FirebaseConfigManager:
    def __init__(self, firebase_client: FirebaseQtClient):
        self.firebase_client = firebase_client
        self.local_config_path = Path.home() / '.config' / 'activitywatch' / 'aw-qt'
        
    def sync_config_to_firebase(self, config: dict):
        if not self.firebase_client.current_user:
            return False
            
        user_doc = self.firebase_client.db.collection('users')\
                       .document(self.firebase_client.current_user['uid'])
        
        user_doc.update({
            'aw_qt_config': config,
            'last_updated': firestore.SERVER_TIMESTAMP,
            'updated_from_device': self.firebase_client.device_id
        })
        return True
        
    def sync_config_from_firebase(self) -> dict:
        if not self.firebase_client.current_user:
            return {}
            
        user_doc = self.firebase_client.db.collection('users')\
                       .document(self.firebase_client.current_user['uid'])\
                       .get()
        
        if user_doc.exists:
            return user_doc.to_dict().get('aw_qt_config', {})
        return {}
        
    def merge_configs(self, local_config: dict, cloud_config: dict) -> dict:
        # Intelligent config merging
        merged = local_config.copy()
        
        # Cloud config takes precedence for certain keys
        cloud_priority_keys = ['autostart_modules', 'cloud_modules', 'sync_settings']
        
        for key in cloud_priority_keys:
            if key in cloud_config:
                merged[key] = cloud_config[key]
                
        # Merge device-specific settings
        device_settings = merged.get('device_settings', {})
        cloud_device_settings = cloud_config.get('device_settings', {})
        device_settings.update(cloud_device_settings)
        merged['device_settings'] = device_settings
        
        return merged
```

## 7. Performance & Offline Support

### 7.1 Offline Mode Management
```python
class OfflineManager:
    def __init__(self, firebase_manager: FirebaseManager):
        self.manager = firebase_manager
        self.offline_queue = []
        self.is_online = True
        
        # Network monitoring
        self.network_monitor = QNetworkConfigurationManager()
        self.network_monitor.onlineStateChanged.connect(self._on_network_state_changed)
        
    def _on_network_state_changed(self, is_online: bool):
        self.is_online = is_online
        
        if is_online:
            self._process_offline_queue()
        else:
            self._enable_offline_mode()
            
    def queue_offline_action(self, action: dict):
        self.offline_queue.append({
            'action': action,
            'timestamp': time.time(),
            'device_id': self.manager.firebase_client.device_id
        })
        
    def _process_offline_queue(self):
        while self.offline_queue:
            queued_action = self.offline_queue.pop(0)
            try:
                self._execute_firebase_action(queued_action['action'])
            except Exception as e:
                logger.error(f"Failed to process offline action: {e}")
                # Re-queue if still failing
                self.offline_queue.insert(0, queued_action)
                break
```

### 7.2 Local Cache Management
```python
class FirebaseCache:
    def __init__(self, cache_dir: Path):
        self.cache_dir = cache_dir / 'firebase_cache'
        self.cache_dir.mkdir(exist_ok=True)
        
        self.module_status_cache = self.cache_dir / 'module_status.json'
        self.config_cache = self.cache_dir / 'config.json'
        self.user_cache = self.cache_dir / 'user.json'
        
    def cache_module_status(self, status_data: dict):
        with open(self.module_status_cache, 'w') as f:
            json.dump(status_data, f, indent=2)
            
    def get_cached_module_status(self) -> dict:
        if self.module_status_cache.exists():
            with open(self.module_status_cache, 'r') as f:
                return json.load(f)
        return {}
        
    def cache_config(self, config: dict):
        with open(self.config_cache, 'w') as f:
            json.dump(config, f, indent=2)
            
    def get_cached_config(self) -> dict:
        if self.config_cache.exists():
            with open(self.config_cache, 'r') as f:
                return json.load(f)
        return {}
        
    def clear_cache(self):
        for cache_file in [self.module_status_cache, self.config_cache, self.user_cache]:
            if cache_file.exists():
                cache_file.unlink()
```

## 8. Migration Strategy

### 8.1 Gradual Migration Approach
```python
class MigrationManager:
    def __init__(self):
        self.migration_steps = [
            'backup_local_config',
            'setup_firebase_client', 
            'migrate_user_settings',
            'sync_module_configurations',
            'enable_real_time_sync',
            'cleanup_legacy_files'
        ]
        
    def execute_migration(self) -> bool:
        try:
            for step in self.migration_steps:
                logger.info(f"Executing migration step: {step}")
                method = getattr(self, f"_{step}")
                if not method():
                    logger.error(f"Migration step failed: {step}")
                    return False
            return True
        except Exception as e:
            logger.error(f"Migration failed: {e}")
            return False
            
    def _backup_local_config(self) -> bool:
        # Backup existing configuration
        pass
        
    def _setup_firebase_client(self) -> bool:
        # Initialize Firebase connection
        pass
        
    def _migrate_user_settings(self) -> bool:
        # Transfer local settings to Firebase
        pass
```

## 9. Güvenlik Considerations

### 9.1 Secure Credential Management
```python
class CredentialManager:
    def __init__(self):
        self.keyring_service = "ActivityWatch-Firebase"
        
    def store_credentials(self, email: str, token: str):
        import keyring
        keyring.set_password(self.keyring_service, email, token)
        
    def get_credentials(self, email: str) -> str:
        import keyring
        return keyring.get_password(self.keyring_service, email)
        
    def remove_credentials(self, email: str):
        import keyring
        keyring.delete_password(self.keyring_service, email)
```

## 10. Gelecek Özellikler

### 10.1 Advanced Features
- **Multi-tenant Support**: Organizasyon hesapları
- **Advanced Conflict Resolution**: Machine learning-based conflict resolution
- **Plugin Architecture**: Third-party Firebase extensions
- **Advanced Analytics**: Cross-device usage patterns
- **Team Collaboration**: Shared module configurations

Bu tasarım aw-qt modülünün Firebase ile tam entegrasyonunu sağlar ve kullanıcılara seamless bir cross-device deneyim sunar. 