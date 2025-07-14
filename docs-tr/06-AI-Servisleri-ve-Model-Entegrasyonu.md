# AI Servisleri ve Model Entegrasyonu

PeakActivity, kullanıcı gizliliğini koruyarak hem lokal hem de bulut tabanlı AI modelleri ile kapsamlı analizler sunar. Hibrit yaklaşımımız, hassas verilerin cihazda kalmasını sağlarken, karmaşık analizler için bulut gücünden yararlanır.

## Lokal Sınıflandırma (Edge AI)

### TensorFlow.js ile Tarayıcı Tabanlı İşleme
PeakActivity, kullanıcıların hassas verilerini korumak için öncelikle edge AI kullanır:

- **Aktivite Kategorilendirmesi**: Pencere başlıkları ve uygulama adları cihazda sınıflandırılır
- **Odak Kalitesi Değerlendirmesi**: Klavye ve fare aktivitesi patterns lokal olarak analiz edilir
- **Zaman Dilimi Segmentasyonu**: Çalışma/mola döngüleri cihazda tespit edilir

### Model Yapısı
```javascript
// Edge AI model mimarisi
const categoryModel = tf.sequential({
  layers: [
    tf.layers.dense({inputShape: [100], units: 64, activation: 'relu'}),
    tf.layers.dropout({rate: 0.2}),
    tf.layers.dense({units: 32, activation: 'relu'}),
    tf.layers.dense({units: 10, activation: 'softmax'}) // 10 ana kategori
  ]
});
```

### Desteklenen Kategoriler
- Geliştirme (coding, debugging, review)
- İletişim (email, chat, meetings)
- Araştırma (browsing, reading, documentation)
- Tasarım (design tools, graphics)
- Eğlence (social media, videos, games)
- Yönetim (planning, documentation, admin)

## Bulut AI (OpenAI/Gemini Integration)

### Google Gemini ile Gelişmiş Analizler
Karmaşık pattern analizi ve öngörücü analizler için Gemini API kullanılır:

```typescript
// Gemini ile insight generation
export const generateInsightFlow = ai.defineFlow({
  name: 'generateProductivityInsight',
  inputSchema: z.object({
    activities: z.array(ActivitySchema),
    timeRange: z.string(),
    userId: z.string()
  }),
  outputSchema: InsightSchema
}, async (input) => {
  const prompt = `
    Kullanıcının ${input.timeRange} aktivite verilerine dayanarak:
    1. Üretkenlik trendlerini analiz et
    2. Dikkat dağılma pattern'lerini tespit et
    3. Optimizasyon önerileri sun
    4. Hedef önerileri oluştur
  `;
  
  const result = await ai.generate({
    model: gemini15Pro,
    ...existing code...
  });
  return result;
});
```
