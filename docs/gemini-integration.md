# Gemini Code Assist Integration

Bu proje GitHub Marketplace'deki **Gemini Code Assist** action'ını kullanarak otomatik kod incelemesi yapmaktadır.

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

## Kurulum

Gerekli secrets:
- `GEMINI_API_KEY`: Gemini API anahtarı
- `GITHUB_TOKEN`: Otomatik sağlanır

Action URL: https://github.com/marketplace/gemini-code-assist
