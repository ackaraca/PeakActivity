import * as admin from 'firebase-admin';
import { google } from 'googleapis';
import { GoogleCalendarService } from './google-calendar-service';

export class CalendarSyncService {
  private db: admin.firestore.Firestore;
  private googleCalendarService: GoogleCalendarService;

  constructor() {
    this.db = admin.firestore();
    this.googleCalendarService = new GoogleCalendarService();
  }

  /**
   * Belirli bir kullanıcının Google Takvim etkinliklerini uygulamamızın veritabanı ile senkronize eder.
   * @param userId Senkronize edilecek kullanıcının Firebase UID'si.
   */
  async syncUserCalendar(userId: string) {
    try {
      const now = new Date();
      const twoMonthsAgo = new Date();
      twoMonthsAgo.setMonth(now.getMonth() - 2);

      const events = await this.googleCalendarService.listEvents(
        userId,
        twoMonthsAgo.toISOString(),
        now.toISOString() // Şimdilik son 2 ayı senkronize edelim
      );

      const userCalendarRef = this.db.collection('users').doc(userId).collection('calendarEvents');
      const batch = this.db.batch();

      // Mevcut etkinlikleri al
      const existingEventsSnapshot = await userCalendarRef.get();
      const existingEventsMap = new Map<string, any>();
      existingEventsSnapshot.forEach(doc => {
        existingEventsMap.set(doc.id, doc.data());
      });

      for (const event of (events || [])) {
        if (event.id) {
          const existingEvent = existingEventsMap.get(event.id);
          if (!existingEvent || JSON.stringify(existingEvent) !== JSON.stringify(event)) {
            // Yeni etkinlik veya güncellenmiş etkinlik
            batch.set(userCalendarRef.doc(event.id), event, { merge: true });
            existingEventsMap.delete(event.id); // İşlenenleri haritadan kaldır
          }
        }
      }

      // Kalanlar, Google Takvim'den kaldırılmış olabilecek etkinliklerdir.
      // TODO: Gerçekte silmeden önce daha sofistike bir silme stratejisi düşünün (örn. soft delete).
      for (const eventId of existingEventsMap.keys()) {
        // batch.delete(userCalendarRef.doc(eventId));
        console.log(`Etkinlik ${eventId} Google Takvim'de bulunamadı. Yerel olarak silinmedi.`);
      }

      await batch.commit();
      console.log(`Kullanıcı ${userId} için Google Takvim senkronizasyonu tamamlandı.`);
    } catch (error) {
      console.error(`Kullanıcı ${userId} için takvim senkronizasyonunda hata:`, error);
    }
  }

  /**
   * Tüm yetkilendirilmiş kullanıcılar için Google Takvim senkronizasyonunu tetikler.
   */
  async syncAllUsersCalendars() {
    const usersSnapshot = await this.db.collection('users').where('googleCalendarTokens', '!=', null).get();
    
    const syncPromises: Promise<void>[] = [];

    usersSnapshot.forEach(doc => {
      const userId = doc.id;
      syncPromises.push(this.syncUserCalendar(userId));
    });

    await Promise.all(syncPromises);
    console.log('Tüm kullanıcılar için takvim senkronizasyonu tamamlandı.');
  }
} 