# Yapay Zeka Entegrasyonu Aşama 2 - Teknik Detaylar

Bu belge, ActivityWatch çatalına Yapay Zeka (YZ) algoritmalarının entegrasyonu sırasında yapılan teknik değişiklikleri ayrıntılı olarak açıklamaktadır. Her bir bileşenin, fonksiyonun ve modülün nasıl etkilendiği aşağıda belirtilmiştir.

## 1. Firebase Ortamı ve Fonksiyonları Kurulumu

*   **Dizin Yapısı:** `awfork/functions` dizini oluşturuldu.
*   **Paket Yönetimi:** `functions/package.json` dosyası Node.js proje bilgileri, Firebase Functions (`firebase-functions`, `firebase-admin`) ve geliştirme bağımlılıkları (`typescript`, `@types/node`, `@types/firebase-functions`, `@types/firebase-admin`) ile güncellendi.
    ```json
    // ... existing code ...
    "main": "lib/index.js",
    "scripts": {
        "lint": "eslint --ext .js,.ts .",
        "build": "tsc",
        "serve": "npm run build && firebase emulators:start --only functions",
        "shell": "npm run build && firebase functions:shell",
        "start": "npm run shell",
        "deploy": "firebase deploy --only functions",
        "logs": "firebase functions:log"
    },
    // ... existing code ...
    "dependencies": {
        "firebase-admin": "^11.11.0",
        "firebase-functions": "^4.4.1",
        "simple-statistics": "^7.8.3" // Davranışsal Desenler ve Trend Analizi için eklendi
    },
    "devDependencies": {
        "@typescript-eslint/eslint-plugin": "^6.4.0",
        "@typescript-eslint/parser": "^6.4.0",
        "@types/node": "^20.14.9",
        "@types/firebase-functions": "^3.1.0",
        "@types/firebase-admin": "^8.12.0",
        "eslint": "^8.57.0",
        "eslint-config-google": "^0.14.0",
        "eslint-plugin-import": "^2.29.1",
        "firebase-functions-test": "^3.1.0",
        "typescript": "^5.5.3"
    }
    // ... existing code ...
    ```
*   **TypeScript Yapılandırması:** `functions/tsconfig.json` dosyası, kaynak dosyaların `src` dizininden derlenip çıktının `lib` dizinine gitmesini sağlayacak şekilde yapılandırıldı.
    ```json
    // ... existing code ...
    "rootDir": "src",
    "outDir": "lib",
    // ... existing code ...
    ```
*   **Ana Firebase Fonksiyonları Dosyası:** `functions/src/index.ts` dosyası oluşturuldu ve tüm YZ algoritmaları için fonksiyon tanımları buraya eklendi.
    ```typescript
    // functions/src/index.ts
    import * as functions from 'firebase-functions';
    import * as admin from 'firebase-admin';
    import * as ss from 'simple-statistics'; // Davranışsal Desenler için

    admin.initializeApp();

    export const calculateFocusQualityScore = functions.https.onCall(async (data, context) => {
        // ... fonksiyon içeriği ...
    });

    export const analyzeBehavioralTrends = functions.https.onCall(async (data, context) => {
        // ... fonksiyon içeriği ...
    });

    export const detectAnomalies = functions.https.onCall(async (data, context) => {
        // ... fonksiyon içeriği ...
    });

    export const autoCategorize = functions.https.onCall(async (data, context) => {
        // ... fonksiyon içeriği ...
    });

    export const applyCommunityRules = functions.https.onCall(async (data, context) => {
        // ... fonksiyon içeriği ...
    });

    export const contextualCategorization = functions.https.onCall(async (data, context) => {
        // ... fonksiyon içeriği ...
    });
    ```

## 2. `aw-server` API Uç Noktaları

`aw-server/aw_server/rest.py` dosyasına her bir YZ algoritması için yeni API uç noktaları ve ilgili Marshmallow şemaları eklendi. Bu, `aw-webui`'nin Firebase Fonksiyonları ile iletişim kurmasını sağlar.

*   **İmportlar:** Gerekli modüller (örneğin `web`, `marshmallow`, `fields`, `validate`) eklendi.
*   **Şema Tanımları:** Her bir uç nokta için Request ve Response şemaları tanımlandı. Örneğin:
    ```python
    # aw-server/aw_server/rest.py
    # ... existing code ...
    class FocusQualityScoreRequestSchema(Schema):
        events = fields.List(fields.Dict(), required=True)
        config = fields.Dict(required=False)

    class FocusQualityScoreResponseSchema(Schema):
        score = fields.Float(required=True)
        insight = fields.String(required=True)

    class BehavioralTrendsRequestSchema(Schema):
        events = fields.List(fields.Dict(), required=True)
        config = fields.Dict(required=False)

    class BehavioralTrendsResponseSchema(Schema):
        trends = fields.Dict(required=True)
        summary = fields.String(required=True)
    # ... benzer şekilde diğer algoritmalar için şemalar ...
    
    # ... existing code ...
    @web.route("/0/ai/focus-quality-score", methods=["POST"])
    @returns_json
    @loads_json(FocusQualityScoreRequestSchema)
    def focus_quality_score(data):
        # Firebase Fonksiyonuna çağrı ve yanıt işleme
        pass

    @web.route("/0/ai/behavioral-trends", methods=["POST"])
    @returns_json
    @loads_json(BehavioralTrendsRequestSchema)
    def behavioral_trends(data):
        # Firebase Fonksiyonuna çağrı ve yanıt işleme
        pass
    # ... benzer şekilde diğer algoritmalar için uç noktalar ...
    ```

## 3. `aw-webui` Kullanıcı Arayüzü Bileşenleri ve İstemci Entegrasyonu

*   **İstemci Yardımcı Fonksiyonları:** `aw-server/aw-webui/src/util/awclient.ts` dosyasına her bir YZ API uç noktasını çağırmak için yeni yardımcı fonksiyonlar eklendi.
    ```typescript
    // aw-server/aw-webui/src/util/awclient.ts
    // ... existing code ...
    export async function getFocusQualityScore(events: any[], config: object = {}) {
        return (await this.post('/0/ai/focus-quality-score', { events, config })).data;
    }

    export async function getBehavioralTrends(events: any[], config: object = {}) {
        return (await this.post('/0/ai/behavioral-trends', { events, config })).data;
    }
    // ... benzer şekilde diğer algoritmalar için fonksiyonlar ...
    ```
*   **Vue UI Bileşenleri:** Her bir YZ algoritması için `aw-server/aw-webui/src/components/` dizininde yeni Vue bileşenleri oluşturuldu. Bu bileşenler, ilgili yardımcı fonksiyonları kullanarak verileri alır ve kullanıcı arayüzünde görüntüler.
    *   `FocusQualityScoreDisplay.vue`
    *   `BehavioralTrendsDisplay.vue`
    *   `AnomalyDetectionDisplay.vue`
    *   `AutoCategorizationDisplay.vue`
    *   `CommunityRulesDisplay.vue`
    *   `ContextualCategorizationDisplay.vue`

    Her bir bileşen temel olarak şuna benzer bir yapıya sahiptir:
    ```vue
    <!-- aw-server/aw-webui/src/components/FocusQualityScoreDisplay.vue -->
    <template>
      <div>
        <h2>Odaklanma Kalitesi Skoru</h2>
        <p v-if="score !== null">Skor: {{ score }}</p>
        <p v-if="insight">Değerlendirme: {{ insight }}</p>
        <button @click="fetchScore">Skor Hesapla</button>
      </div>
    </template>

    <script lang="ts">
    import { defineComponent, ref } from 'vue';
    import { getFocusQualityScore } from '@/util/awclient'; // Import düzeltildi

    export default defineComponent({
      name: 'FocusQualityScoreDisplay',
      setup() {
        const score = ref<number | null>(null);
        const insight = ref<string | null>(null);

        const fetchScore = async () => {
          try {
            // Örnek veri, gerçek uygulamada EventList'ten alınacak
            const dummyEvents = [/* ... event verisi ... */];
            const result = await getFocusQualityScore(dummyEvents);
            score.value = result.score;
            insight.value = result.insight;
          } catch (error) {
            console.error('Odaklanma kalitesi skoru alınırken hata oluştu:', error);
          }
        };

        return {
          score,
          insight,
          fetchScore,
        };
      },
    });
    </script>

    <style scoped>
    /* Bileşene özel stiller */
    </style>
    ```

## 4. Git Deposu ve Dokümantasyon Değişiklikleri

*   **`.gitignore` Güncellemesi:** `functions/lib/` ve `functions/node_modules/` gibi yeni dizinler `.gitignore`'a eklendi.
*   **Dosya Kaldırmaları:** Eski `mds/` dizini ve `diagram.svg` dosyası kaldırıldı.
*   **Yeni Dosyalar:** `aw-component-relationships.txt`, `checklist.md`, `firestore.rules`, `storage.rules` gibi yeni dosyalar eklendi ve takip edildi.
*   **`version.md` Güncellemesi:** Sürüm `v0.13.4-ai-integration-completed` olarak güncellendi ve yapılan ana değişiklikler özetlendi.
*   **`checklist.md` Güncellemesi:** Yapay Zeka entegrasyonuyla ilgili tüm maddeler "tamamlandı" olarak işaretlendi.

Bu değişiklikler, ActivityWatch'ın AI yeteneklerini genişletmek için temel altyapıyı ve entegrasyonu sağlamıştır. 