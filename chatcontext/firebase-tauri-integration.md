# Firebase-Tauri Entegrasyonu: Detaylı Değişiklikler

Bu belge, Activity Watch çatalında yapılan Firebase ve Tauri entegrasyonlarına ilişkin detaylı teknik değişiklikleri içermektedir. Fonksiyon eklemeleri, hata düzeltmeleri, sınıf, modül, paket, import, kütüphane/framework seviyesindeki değişiklikler aşağıda açıklanmıştır.

## 1. Bildirim Mekanizması Geliştirmeleri

### Dosya: `aw-qt/src-tauri/src/commands.rs`

*   **Fonksiyon/Yapı Değişiklikleri:**
    *   `send_notification_command` fonksiyonu güncellendi:
        *   `sound: Option<String>` ve `action: Option<String>` adında yeni parametreler eklendi.
        *   Windows Toast bildirimleri için `tauri_winrt_notification::Toast` kütüphanesi kullanılmaya başlandı.
        *   Bildirim sesini özelleştirmek için `with_audio` metodu kullanıldı.
        *   Eylem düğmeleri (`awfork://disable-rule?id=...`) eklemek için `add_action` metodu kullanıldı.
    *   `SystemInfo` yapısı güncellendi:
        *   Sistem kaynakları izleme için `disk_io_read: u64`, `disk_io_write: u64`, `network_in: u64`, `network_out: u64` alanları eklendi.
    *   Yeni bir komut olan `get_automation_rule_by_id_command` eklendi. Bu komut, belirli bir otomasyon kuralını kimliğine göre getirmek için tasarlanmıştır. Bu komut, bir kural devre dışı bırakıldığında `user_id`'yi almak için kullanılır.
    *   `check_resource_usage_for_alerts` fonksiyonu eklendi. Bu fonksiyon, CPU ve bellek kullanımını kontrol ederek belirlenen eşikleri aşarsa bildirimler tetikler. Bu, sistem kaynakları izleme yeteneğini artırır.

### Dosya: `aw-qt/src-tauri/src/main.rs`

*   **Fonksiyon/Modül Değişiklikleri:**
    *   `invoke_handler!` makrosu güncellendi:
        *   `get_automation_rule_by_id_command` ve `check_resource_usage_for_alerts` komutları eklendi.
    *   **URL Şeması İşleme:** `awfork://` özel URL şeması işleyicisi eklendi. Bu, özellikle `awfork://disable-rule?id={rule_id}` gibi eylem URL'lerini yakalamak için kullanılır.
    *   **Arka Plan Süreç Yönetimi:**
        *   `SystemTray` bileşeni eklendi. Bu, uygulamanın sistem tepsisine küçültülmesini ve arka planda çalışmasını sağlar.
        *   Sistem tepsisi menüsü (Göster, Gizle, Çıkış) ve olay işleyicileri (`on_system_tray_event`) eklendi.
        *   Pencere kapatma olayında uygulamanın çıkış yapması yerine pencerenin gizlenmesi (`on_window_event`) sağlandı.

### Dosya: `aw-qt/src-tauri/Cargo.toml`

*   **Bağımlılık/Özellik Değişiklikleri:**
    *   `tauri-winrt-notification = "0.7.2"` bağımlılığı eklendi. Bu kütüphane, gelişmiş Windows Toast bildirimleri için kullanılır.
    *   `sysinfo = "0.29.0"` bağımlılığı eklendi. Bu kütüphane, sistem kaynakları (CPU, bellek, disk G/Ç, ağ) izleme için kullanılır.
    *   `rusqlite` bağımlılığına `features = ["sqlcipher"]` özelliği eklendi. Bu, yerel SQLite veritabanı için şifreleme desteği sağlar.
    *   `tauri` bağımlılığı için `features` listesine `"notification"` ve `"system-tray"` eklendi.

### Dosya: `aw-qt/src-tauri/tauri.conf.json`

*   **Yapılandırma Değişiklikleri:**
    *   `updater` özelliği etkinleştirildi ve bir `endpoints` placeholder'ı ile `pubkey` alanı eklendi. Bu, otomatik güncelleme mekanizmasını etkinleştirir.

## 2. Yerel Veritabanı Optimizasyonu

### Dosya: `aw-qt/src-tauri/src/commands.rs`

*   **Fonksiyon Değişiklikleri:**
    *   `init_db()` fonksiyonu güncellendi:
        *   SQLite veritabanının bir şifreleme anahtarıyla açılması için `PRAGMA key` komutu eklendi. Bu, yerel veritabanı şifrelemesini sağlar.

## 3. Genel İyileştirmeler

### Dosya: `version.md` ve `checklist.md`

*   **Dokümantasyon Güncellemeleri:**
    *   `version.md` dosyası, uygulanan tüm yeni özellikler (yerel bildirimler, arka plan süreç yönetimi, otomatik güncellemeler, veritabanı şifreleme, sistem kaynakları izleme, Firebase/GCP optimizasyonları, gelişmiş AI özellikleri ve harici servis entegrasyonları) ile güncellendi.
    *   `checklist.md` dosyasındaki ilgili maddeler tamamlandı olarak işaretlendi.

Bu değişiklikler, uygulamanın performansını, güvenliğini ve kullanıcı deneyimini önemli ölçüde artırmıştır. 