# Sürüm Yönetimi ve Değişiklik Takibi

PeakActivity projesi için kapsamlı sürüm yönetimi stratejisi ve değişiklik takip sistemi.

## Semantic Versioning (SemVer)

### Versiyon Numaralandırma Sistemi
PeakActivity, **MAJOR.MINOR.PATCH** formatını kullanır:

- **MAJOR**: API'da breaking changes (geriye uyumsuz değişiklikler)
- **MINOR**: Yeni özellikler (geriye uyumlu)
- **PATCH**: Bug düzeltmeleri (geriye uyumlu)

### Pre-release Versiyonları
```
1.0.0-alpha.1    // Alpha sürümü
1.0.0-beta.2     // Beta sürümü  
1.0.0-rc.1       // Release candidate
```

### Versiyon Etiketleme Örnekleri
```bash
# Major release - ActivityWatch 2.0 entegrasyonu
v2.0.0

# Minor release - PraisonAI agents eklendi
v1.1.0

# Patch release - Firebase connection bug fix
v1.0.1

# Pre-release - Beta testing
v1.2.0-beta.1
```

## Git Workflow ve Branching Stratejisi

### Branch Yapısı
```
main (production)
├── dev01 (development)
├── feature/ai-insights
├── feature/firebase-sync
├── hotfix/auth-security
└── release/v1.1.0
```

### Branch Kuralları
- **main**: Üretim hazır, kararlı kod
- **dev01**: Geliştirme dalı, yeni özellikler buraya merge edilir
- **feature/***: Yeni özellik geliştirme
- **hotfix/***: Kritik hata düzeltmeleri
- **release/***: Sürüm hazırlık dalları

### Commit Message Standartları
```bash
# Format: <type>(<scope>): <description>
feat(auth): add Firebase Authentication integration
fix(ui): resolve dark mode toggle issue
docs(api): update endpoint documentation
```
