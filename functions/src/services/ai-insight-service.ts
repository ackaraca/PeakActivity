import * as admin from 'firebase-admin';
import { MLDataPreparationService } from './ml-data-preparation-service';
// Firebase GenKit veya Google Cloud Natural Language API için gerekli importlar buraya gelecek
// import { genkit } from 'genkit';
// import { LanguageServiceClient } from '@google-cloud/language';

export class AIInsightService {
  private db: admin.firestore.Firestore;
  private mlDataPreparationService: MLDataPreparationService;

  constructor() {
    this.db = admin.firestore();
    this.mlDataPreparationService = new MLDataPreparationService();
  }

  /**
   * Kullanıcı aktivite ve proje verilerini analiz ederek AI destekli özetler ve içgörüler oluşturur.
   * @param userId Analiz edilecek kullanıcının Firebase UID'si.
   * @param startDate Analiz edilecek verilerin başlangıç tarihi (ISO string).
   * @param endDate Analiz edilecek verilerin bitiş tarihi (ISO string).
   * @returns Oluşturulan özetler ve içgörüler.
   */
  async generateInsights(userId: string, startDate: string, endDate: string) {
    try {
      const preparedData = await this.mlDataPreparationService.prepareDataForML(userId, startDate, endDate);
      console.log(`İçgörü oluşturmak için hazırlanan veri: Aktivite: ${preparedData.activities.length}, Projeler: ${preparedData.projects.length}, Görevler: ${preparedData.tasks.length}`);

      // TODO: Burada Firebase GenKit veya Cloud Natural Language API kullanarak gerçek AI analizi uygulayın.
      // Örneğin, aktivite başlıkları veya proje açıklamaları için özetler oluşturun.
      // Anormallikleri veya trendleri tespit etmek için aktiviteleri analiz edin.

      let summary = "";
      if (preparedData.activities.length > 0) {
        const topApps = preparedData.activities.reduce((acc: { [key: string]: number }, activity) => {
          const app = activity.app || 'Bilinmeyen Uygulama';
          acc[app] = (acc[app] || 0) + (activity.duration_sec || 0);
          return acc;
        }, {});
        const sortedApps = Object.entries(topApps).sort(([, a], [, b]) => b - a);
        summary += `Kullanıcı son ${Math.ceil((new Date(endDate).getTime() - new Date(startDate).getTime()) / (1000 * 60 * 60 * 24))} günde en çok ${sortedApps[0][0]} uygulamasını kullanmıştır.`;
      }
      if (preparedData.projects.length > 0) {
        const activeProjects = preparedData.projects.filter(p => p.status === 'active');
        if (activeProjects.length > 0) {
          summary += ` Şu anda ${activeProjects.length} aktif projesi bulunmaktadır.`;
        }
      }

      return {
        summary: summary || "Belirtilen dönem için AI içgörüleri oluşturulamadı.",
        trends: [],
        anomalies: [],
        recommendations: [],
      };
    } catch (error) {
      console.error(`AI içgörüleri oluşturulurken hata oluştu:`, error);
      throw error;
    }
  }
} 