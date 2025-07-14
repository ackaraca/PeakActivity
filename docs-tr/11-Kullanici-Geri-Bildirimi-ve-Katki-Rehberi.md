# Kullanıcı Geri Bildirimi ve Katkı Rehberi

PeakActivity topluluğu için kapsamlı geri bildirim sistemi ve katkı yönergeleri.

## Geri Bildirim Kanalları

### 1. GitHub Issues
Ana geri bildirim kanalımız GitHub Issues sistemidir:

**Bug Reports** 🐛
```markdown
**Bug Açıklaması**
Kısa ve net bir bug açıklaması

**Yeniden Üretme Adımları**
1. '...' bölümüne git
2. '....' butonuna tıkla
3. Aşağı kaydır
4. Hatayı gör

**Beklenen Davranış**
Ne olması gerektiğini açıkla

**Ekran Görüntüleri**
Varsa ekran görüntüsü ekle

**Ortam Bilgileri:**
- OS: [Windows/Mac/Linux]
- Tarayıcı: [Chrome/Firefox/Safari]
- PeakActivity Versiyonu: [1.2.0]
```

**Feature Requests** 💡
```markdown
**Özellik İsteği**
Özelliğin açık bir açıklaması

**Problem Çözümü**
Bu özellik hangi sorunu çözüyor?

**Önerilen Çözüm**
Bu özelliğin nasıl çalışmasını istiyorsun?

**Alternatifler**
Düşündüğün başka çözümler var mı?

**Ek Bağlam**
Bu özellik hakkında başka bilgi var mı?
```

### 2. In-App Feedback System
```typescript
interface FeedbackEntry {
  id: string
  userId: string
  type: 'bug' | 'feature' | 'improvement' | 'question'
  title: string
  description: string
  category: string
  priority: 'low' | 'medium' | 'high' | 'critical'
  ...existing code...
}
```
