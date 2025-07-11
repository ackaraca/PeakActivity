# Başlangıç Aşaması Geliştirme Detayları

Bu belge, bu sohbet oturumunda PeakActivity projesine yapılan teknik değişiklikleri detaylandırmaktadır.

## 1. Yeni Dosyalar ve Şemalar
- **`aw-core/aw_core/schemas/manualactivity.json`**: Manuel/offline aktivite olayları için JSON şeması eklendi.
  - Açıklama: Kullanıcıların elle girdiği veya çevrimdışı kaydedilen aktivitelerin yapısını tanımlar.
  - İçerdiği Alanlar: `timestamp`, `duration`, `data` (`label`, `category`, `description`, `tags`, `project`, `offline`).
- **`aw-core/aw_core/schemas/microsurvey.json`**: Duygu ve bağlam mikro anket yanıtları için JSON şeması eklendi.
  - Açıklama: Kullanıcıların duygu durumları ve mevcut bağlamları hakkında verdiği kısa anket yanıtlarının yapısını tanımlar.
  - İçerdiği Alanlar: `timestamp`, `data` (`emotion`, `context`, `energy`, `focus`, `notes`).
- **`aw-core/aw_core/constants.py`**: Yeni sabitler tanımlamak için oluşturuldu.
  - İçerdiği Sabitler: `MANUAL_ACTIVITY_EVENT_TYPE = "manualactivity"`, `MICROSURVEY_EVENT_TYPE = "microsurvey"`.
- **`aw-server/aw-webui/src/components/ManualActivityForm.vue`**: Manuel aktivite girişi için Vue.js bileşeni eklendi.
  - İşlevsellik: Etkinlik etiketi, süresi, kategorisi ve açıklaması girişi, sunucuya POST isteği gönderme.
- **`aw-server/aw-webui/src/components/MicroSurveyModal.vue`**: Mikro anket yanıtları için Vue.js modal bileşeni eklendi.
  - İşlevsellik: Duygu, bağlam, enerji, odaklanma seviyesi ve not girişi, sunucuya POST isteği gönderme.
- **`aw-qt/aw_qt/manual_activity_dialog.py`**: Manuel aktivite girişi için PyQt tabanlı bir diyalog penceresi eklendi.
  - İşlevsellik: Kullanıcıdan etiket, süre, kategori ve açıklama alıp sunucuya gönderir.

## 2. Mevcut Dosyalardaki Değişiklikler

### `aw-core/aw_core/__init__.py`
- **İçe Aktarmalar**:
  ```python
  from .constants import MANUAL_ACTIVITY_EVENT_TYPE
  from .constants import MICROSURVEY_EVENT_TYPE
  ```
- **`__all__` Listesi**: `MANUAL_ACTIVITY_EVENT_TYPE` ve `MICROSURVEY_EVENT_TYPE` sabitleri `__all__` listesine eklendi.
  - Amaç: Bu sabitlerin dışarıdan erişilebilir olmasını sağlamak.

### `aw-server/aw_server/api.py`
- **İçe Aktarmalar**:
  ```python
  from aw_core import MANUAL_ACTIVITY_EVENT_TYPE
  from aw_core import MICROSURVEY_EVENT_TYPE
  ```
- **Yeni Fonksiyon**: `log_manual_activity`
  - Açıklama: Manuel aktivite olaylarını işlemek için yeni bir metod. Belirtilen `bucket_id` (varsayılan: `manual_<hostname>`) ile bir bucket oluşturur (yoksa) ve olayları ekler.
  - Parametreler: `event_data` (dict veya list[dict]), `bucket_id` (opsiyonel), `client` (varsayılan: "manual"), `hostname` (varsayılan: "!local").
  - Dönüş Değeri: Eklenen tek bir olay için `Event` nesnesi, liste için `None`.
- **Yeni Fonksiyon**: `log_microsurvey`
  - Açıklama: Mikro anket yanıtı olaylarını işlemek için yeni bir metod. Belirtilen `bucket_id` (varsayılan: `microsurvey_<hostname>`) ile bir bucket oluşturur (yoksa) ve olayları ekler.
  - Parametreler: `event_data` (Any), `bucket_id` (opsiyonel), `client` (varsayılan: "survey"), `hostname` (varsayılan: "!local").
  - Dönüş Değeri: Eklenen tek bir olay için `Event` nesnesi, liste için `None`.

### `aw-server/aw_server/rest.py`
- **Yeni Endpoint**: `/0/manualactivity` (POST)
  - Açıklama: Manuel/offline aktivite olaylarını almak için RESTful endpoint.
  - `ManualActivityResource` sınıfı tarafından işlenir.
  - `ServerAPI.log_manual_activity` metodunu çağırır.
- **Yeni Endpoint**: `/0/microsurvey` (POST)
  - Açıklama: Mikro anket yanıtı olaylarını almak için RESTful endpoint.
  - `MicroSurveyResource` sınıfı tarafından işlenir.
  - `ServerAPI.log_microsurvey` metodunu çağırır.

### `aw-client/aw_client/client.py`
- **Yeni Fonksiyon**: `log_manual_activity`
  - Açıklama: Manuel/offline aktivite olaylarını sunucuya (`/api/0/manualactivity` endpoint'ine) gönderen istemci tarafı metod.
  - Parametreler: `event_data` (dict veya list[dict]), `bucket_id` (opsiyonel).
  - Dönüş Değeri: Sunucudan gelen JSON yanıtı.
- **Yeni Fonksiyon**: `log_microsurvey`
  - Açıklama: Mikro anket yanıtı olaylarını sunucuya (`/api/0/microsurvey` endpoint'ine) gönderen istemci tarafı metod.
  - Parametreler: `event_data` (dict veya list[dict]), `bucket_id` (opsiyonel).
  - Dönüş Değeri: Sunucudan gelen JSON yanıtı.

### `aw-client/aw_client/cli.py`
- **Yeni Komut**: `manual`
  - Açıklama: Komut satırından manuel/offline aktivite girişi yapmak için kullanılır.
  - Opsiyonlar: `--label` (zorunlu), `--start`, `--duration`, `--category`, `--description`, `--tag` (birden fazla), `--bucket-id`.
  - Kullanım: `aw-client manual --label "Rapor Yazma" --start "2025-07-11T09:00:00" --duration 3600 --category "Work" --tag üretkenlik`
- **Yeni Komut**: `survey`
  - Açıklama: Komut satırından mikro anket yanıtı göndermek için kullanılır.
  - Opsiyonlar: `--emotion` (zorunlu), `--context` (zorunlu), `--energy`, `--focus`, `--notes`, `--bucket-id`, `--time`.
  - Kullanım: `aw-client survey --emotion "happy" --context "coding" --energy 4`

### `aw-notify/aw_notify/main.py`
- **Yeni Fonksiyon**: `prompt_microsurvey`
  - Açıklama: Kullanıcıya mikro anket doldurması için bildirim gönderir.
- **Yeni Fonksiyon**: `start_microsurvey_prompts`
  - Açıklama: Her 2 saatte bir `prompt_microsurvey`'i çağıran arka plan iş parçacığını başlatır.

--- 