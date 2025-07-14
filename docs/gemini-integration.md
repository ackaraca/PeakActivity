# Gemini CLI Action Integration

Bu proje **PraisonAI** projesindeki Gemini CLI action'ını kullanarak otomatik kod incelemesi yapmaktadır.

## Özellikler

### 🤖 Otomatik Kod İncelemesi
- **Post-Copilot Review**: Copilot kodlaması sonrası otomatik Gemini analizi
- **PR Review**: Her pull request için detaylı kod incelemesi
- **Issue Triage**: Yeni issue'lar için otomatik etiketleme

### 🔄 Workflow Tetikleyicileri

1. **Copilot Sonrası İnceleme**: 
   - Push eventi sonrası
   - Diğer workflow'lar tamamlandığında

2. **Pull Request İncelemesi**:
   - PR açıldığında
   - PR güncellendiğinde
   - PR yeniden açıldığında

3. **Issue Triaging**:
   - Yeni issue açıldığında
   - Issue yorumlandığında (@gemini ile)

## Gemini AI Analiz Alanları

- ✅ **Kod Kalitesi**: Clean code, standards, structure
- 🔒 **Güvenlik**: Vulnerabilities, validation
- 🚀 **Performans**: Efficiency, scalability
- 🧪 **Test Coverage**: Unit test requirements
- 📖 **Dokümantasyon**: Comments, documentation
- 🎯 **PeakActivity Specific**: ActivityWatch, Firebase, AI components

## Custom Action Kullanımı

### Action Dosyası
`./.github/actions/gemini/action.yml` - PraisonAI projesinden adapte edildi

### Action Parametreleri
- `GEMINI_API_KEY`: Gemini API anahtarı (gerekli)
- `prompt`: Gemini için özel prompt (opsiyonel)
- `OTLP_GCP_WIF_PROVIDER`: GCP authentication (opsiyonel)
- `OTLP_GOOGLE_CLOUD_PROJECT`: Google Cloud project (opsiyonel)
- `version`: Gemini CLI versiyonu (varsayılan: 'latest')

## Kurulum

Gerekli secrets:
- `GEMINI_API_KEY`: Gemini API anahtarı
- `GITHUB_TOKEN`: Otomatik sağlanır

## Kaynak

Action Source: [PraisonAI Gemini Action](https://github.com/MervinPraison/PraisonAI/blob/main/.github/actions/gemini/action.yml)
