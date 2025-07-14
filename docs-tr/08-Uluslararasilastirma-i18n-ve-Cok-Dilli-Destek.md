# Uluslararasılaştırma (i18n) ve Çok Dilli Destek

PeakActivity, küresel kullanıcı tabanına hizmet vermek için kapsamlı çok dilli destek sunmaktadır.

## Desteklenen Diller

### Mevcut Diller
- **Türkçe (tr)**: Ana dil, tam destek
- **İngilizce (en)**: Uluslararası kullanıcılar için
- **Almanca (de)**: Avrupa pazarı için

### Planlanmış Diller
- **Fransızca (fr)**: Q2 2025
- **İspanyolca (es)**: Q2 2025
- **Japonca (ja)**: Q3 2025
- **Çince (zh)**: Q3 2025
- **Rusça (ru)**: Q4 2025

## Teknik Implementasyon

### Vue.js i18n Entegrasyonu
```typescript
// i18n konfigürasyonu
import { createI18n } from 'vue-i18n'

const messages = {
  en: {
    dashboard: {
      welcome: 'Welcome, {name}!'
      ...existing code...
    }
  },
  tr: {
    dashboard: {
      welcome: 'Hoş geldin, {name}!'
      ...existing code...
    }
  }
}
```
