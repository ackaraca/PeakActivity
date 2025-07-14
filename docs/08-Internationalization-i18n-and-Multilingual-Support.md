# Internationalization (i18n) and Multilingual Support

PeakActivity offers comprehensive multilingual support to serve a global user base.

## Supported Languages

### Current Languages
- **Turkish (tr)**: Main language, full support
- **English (en)**: For international users
- **German (de)**: For the European market

### Planned Languages
- **French (fr)**: Q2 2025
- **Spanish (es)**: Q2 2025
- **Japanese (ja)**: Q3 2025
- **Chinese (zh)**: Q3 2025
- **Russian (ru)**: Q4 2025

## Technical Implementation

### Vue.js i18n Integration
```typescript
// i18n configuration
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
