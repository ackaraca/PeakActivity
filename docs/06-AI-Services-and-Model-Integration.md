# AI Services and Model Integration

PeakActivity provides comprehensive analyses using both local and cloud-based AI models, while protecting user privacy. Our hybrid approach keeps sensitive data on the device and leverages cloud power for complex analyses.

## Local Classification (Edge AI)

### Browser-Based Processing with TensorFlow.js
PeakActivity primarily uses edge AI to protect users' sensitive data:

- **Activity Categorization**: Window titles and application names are classified on the device
- **Focus Quality Assessment**: Keyboard and mouse activity patterns are analyzed locally
- **Time Segment Detection**: Work/break cycles are detected on the device

### Model Structure
```javascript
// Edge AI model architecture
const categoryModel = tf.sequential({
  layers: [
    tf.layers.dense({inputShape: [100], units: 64, activation: 'relu'}),
    tf.layers.dropout({rate: 0.2}),
    tf.layers.dense({units: 32, activation: 'relu'}),
    tf.layers.dense({units: 10, activation: 'softmax'}) // 10 main categories
  ]
});
```

### Supported Categories
- Development (coding, debugging, review)
- Communication (email, chat, meetings)
- Research (browsing, reading, documentation)
- Design (design tools, graphics)
- Entertainment (social media, videos, games)
- Management (planning, documentation, admin)

## Cloud AI (OpenAI/Gemini Integration)

### Advanced Analysis with Google Gemini
Gemini API is used for complex pattern analysis and predictive analytics:

```typescript
// Insight generation with Gemini
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
    Based on the user's activity data for ${input.timeRange}:
    1. Analyze productivity trends
    2. Detect distraction patterns
    3. Provide optimization suggestions
    4. Generate goal recommendations
  `;
  
  const result = await ai.generate({
    model: gemini15Pro,
    ...existing code...
  });
  return result;
});
```
