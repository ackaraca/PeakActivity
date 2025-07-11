# PeakActivity - Versiyon Geçmişi

## Sürüm Güncellemesi - 2025-07-11 18:09:59

### Firebase Fonksiyonları Dağıtımı ve Uyumluluk İyileştirmeleri:
- `@tensorflow/tfjs-node` bağımlılığı, Firebase Fonksiyonları ortamıyla daha iyi uyum sağlaması için `@tensorflow/tfjs` olarak güncellendi.
- İlgili import yolları (`functions/src/services/task-completion-prediction-service.ts` içinde) düzeltildi.
- Firebase fonksiyonları buluta başarıyla dağıtıldı.

### Web Arayüzü (aw-server/aw-webui) Vue 2 Uyumluluğu ve Hata Düzeltmeleri:
- Tüm `<script setup>` kullanımları (Vue 3 sözdizimi), Vue 2 Seçenekler API'sine (`export default defineComponent`) dönüştürüldü. Bu, `App.vue`, `Login.vue`, `Register.vue`, `Header.vue`, `AIInsightsDisplay.vue`, `AutomationRules.vue`, `CommunityRules.vue`, `ContextualCategorization.vue`, `Goals.vue`, `ProjectPrediction.vue` ve `Reports.vue` dosyalarını etkiledi.
- `useRouter` kullanımları `this.$router` ile değiştirilerek Vue Router hataları giderildi.
- Firebase istemci SDK'sının başlatılması ve `auth` ile `functions` servislerinin yönetimi için `aw-server/aw-webui/src/firebase.ts` adında merkezi bir dosya oluşturuldu.
- Kimlik doğrulama durumu yönetimi için `aw-server/aw-webui/src/stores/auth.ts` adında yeni bir Pinia store eklendi ve tüm ilgili bileşenler bu store'u kullanacak şekilde güncellendi.
- `AWClient` üzerinde `post` metodunun bulunmaması sorununu gidermek için `aw-server/aw-webui/src/globals.d.ts` dosyasına `post` metodu için tip tanımı eklendi. 