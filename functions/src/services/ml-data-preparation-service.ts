import * as admin from 'firebase-admin';
import { ActivityService } from './activity-service';
import { ProjectPredictionService } from './project-prediction-service';
import { TrelloJiraService } from './trello-jira-service';

export class MLDataPreparationService {
  private db: admin.firestore.Firestore;
  private activityService: ActivityService;
  private projectService: ProjectPredictionService;
  private trelloJiraService: TrelloJiraService;

  constructor() {
    this.db = admin.firestore();
    this.activityService = new ActivityService();
    this.projectService = new ProjectPredictionService();
    this.trelloJiraService = new TrelloJiraService();
  }

  /**
   * ML modeli eğitimi için gerekli kullanıcı aktivite ve görev verilerini hazırlar.
   * @param userId Verileri hazırlanacak kullanıcının Firebase UID'si.
   * @param startDate Verilerin başlangıç tarihi (ISO string).
   * @param endDate Verilerin bitiş tarihi (ISO string).
   * @returns Hazırlanmış veri seti.
   */
  async prepareDataForML(userId: string, startDate: string, endDate: string) {
    try {
      const activities = await this.activityService.getActivitiesInInterval(userId, startDate, endDate);
      const projects = await this.projectService.getAllProjects(userId);

      // TODO: Trello/Jira görevlerini de bu fonksiyona dahil edin
      // Örneğin, her projenin ilişkili Trello/Jira görevlerini getirin ve bunları da veri setine ekleyin.
      // Bu, `associated_tasks` alanındaki görev ID'lerini kullanarak yapılabilir.
      let tasksFromExternalServices: any[] = [];
      for (const project of projects) {
        if (project.associated_tasks && project.associated_tasks.length > 0) {
          for (const taskId of project.associated_tasks) {
            // Basit bir örnek: Görev ID'sinin Trello veya Jira olup olmadığını kontrol edin
            // Gerçek bir uygulamada, görev ID'sinin kaynağını (Trello/Jira) depolayan bir alanınız olmalı.
            if (taskId.startsWith('trello')) { // Örnek bir kontrol
              const trelloTaskStatus = await this.trelloJiraService.getTrelloTaskStatus(userId, taskId.replace('trello-', ''));
              tasksFromExternalServices.push({ ...trelloTaskStatus, source: 'trello' });
            } else if (taskId.startsWith('jira')) { // Örnek bir kontrol
              const jiraTaskStatus = await this.trelloJiraService.getJiraTaskStatus(userId, taskId.replace('jira-', ''));
              tasksFromExternalServices.push({ ...jiraTaskStatus, source: 'jira' });
            }
          }
        }
      }

      // Verileri ML modeli için uygun bir formatta birleştirin ve dönüştürün.
      const preparedData = {
        activities: activities.map(activity => ({
          app: activity.data?.app,
          title: activity.data?.title,
          duration_sec: activity.duration_sec,
          timestamp_start: activity.timestamp_start,
          is_afk: activity.data?.is_afk,
        })),
        projects: projects.map(project => ({
          id: project.id,
          title: project.title,
          status: project.status,
          start_date: project.start_date,
          due_date: project.due_date,
          progress_percentage: project.progress_percentage,
          total_tracked_duration: project.total_tracked_duration,
        })),
        tasks: tasksFromExternalServices,
      };

      return preparedData;
    } catch (error) {
      console.error(`ML verisi hazırlanırken hata oluştu:`, error);
      throw error;
    }
  }
} 