import * as admin from 'firebase-admin';
import { MLDataPreparationService } from './ml-data-preparation-service';
// TensorFlow.js veya GenKit ML entegrasyonu için gerekli importlar buraya gelecek
// import * as tf from '@tensorflow/tfjs-node';
// import { genkit } from 'genkit'; // GenKit kullanımı için

export class TaskCompletionPredictionService {
  private db: admin.firestore.Firestore;
  private mlDataPreparationService: MLDataPreparationService;

  constructor() {
    this.db = admin.firestore();
    this.mlDataPreparationService = new MLDataPreparationService();
  }

  /**
   * Görev tamamlama süresini tahmin eden fonksiyon.
   * Bu bir yer tutucu uygulamadır ve gerçek bir ML modeli entegrasyonu gerektirecektir.
   * @param userId Tahmin yapılacak kullanıcının Firebase UID'si.
   * @param projectId Tahmin yapılacak projenin ID'si.
   * @returns Tahmini tamamlama süresi (saat cinsinden) ve ek istatistikler.
   */
  async predictTaskCompletion(userId: string, projectId: string) {
    try {
      // ML modeli için veri hazırlama (örneğin, son 30 günlük aktiviteler ve ilgili projeler/görevler)
      const endDate = new Date().toISOString();
      const startDate = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString(); // Son 30 gün

      const preparedData = await this.mlDataPreparationService.prepareDataForML(userId, startDate, endDate);
      console.log(`ML modeli için hazırlanan veri boyutu: Aktivite: ${preparedData.activities.length}, Projeler: ${preparedData.projects.length}, Görevler: ${preparedData.tasks.length}`);

      // TODO: Burada gerçek ML modeli çıkarım mantığını uygulayın.
      // Örneğin, daha önce eğitilmiş bir TensorFlow.js modeli yüklenebilir veya
      // Firebase GenKit üzerinden bir Vertex AI veya başka bir model çağrılabilir.

      // Basit bir yer tutucu tahmin: Projeye bağlı aktivite sürelerinin ortalamasını alalım.
      // Gerçek bir senaryoda, bu çok daha karmaşık bir model olacaktır (regresyon, zaman serisi vb.).
      const relevantActivities = preparedData.activities.filter(activity => 
        preparedData.projects.some(p => p.id === projectId && (p.title.includes(activity.app) || p.title.includes(activity.title))) // Basit bir eşleştirme
      );

      const totalDurationSec = relevantActivities.reduce((sum, activity) => sum + (activity.duration_sec || 0), 0);
      const averageDurationHours = relevantActivities.length > 0 ? (totalDurationSec / 3600) / relevantActivities.length : 0;

      return {
        predictedCompletionHours: averageDurationHours,
        confidence: 0.75, // Yer tutucu güven skoru
        details: "Bu tahmin, önceki aktivite kalıplarına dayanmaktadır ve bir ML modeli tarafından iyileştirilmelidir."
      };

    } catch (error) {
      console.error(`Görev tamamlama tahmini yapılırken hata oluştu:`, error);
      throw error;
    }
  }
} 