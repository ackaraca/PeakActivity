import { db } from "../firebaseAdmin";
import { google } from 'googleapis';

export class GoogleCalendarService {
  private db: any;
  private oAuth2Clients: Map<string, any>;

  constructor() {
    this.db = db;
    this.oAuth2Clients = new Map();
  }

  private async getOAuth2Client(userId: string) {
    if (this.oAuth2Clients.has(userId)) {
      return this.oAuth2Clients.get(userId);
    }

    const userDoc = await this.db.collection('users').doc(userId).get();
    const tokens = userDoc.data()?.googleCalendarTokens;

    if (!tokens) {
      throw new Error('Google Takvim jetonları bulunamadı. Lütfen entegrasyonu yeniden yapın.');
    }

    const oAuth2Client = new google.auth.OAuth2(
      process.env.GOOGLE_CLIENT_ID,
      process.env.GOOGLE_CLIENT_SECRET,
      process.env.GOOGLE_REDIRECT_URI
    );

    oAuth2Client.setCredentials(tokens);

    // Jetonların süresi dolmuşsa yenile
    oAuth2Client.on('tokens', async (newTokens) => {
      if (newTokens.refresh_token) {
        await this.db.collection('users').doc(userId).update({
          'googleCalendarTokens.access_token': newTokens.access_token,
          'googleCalendarTokens.expiry_date': newTokens.expiry_date,
          'googleCalendarTokens.refresh_token': newTokens.refresh_token, // Yenileme jetonu değişirse güncelle
        });
      } else {
        await this.db.collection('users').doc(userId).update({
          'googleCalendarTokens.access_token': newTokens.access_token,
          'googleCalendarTokens.expiry_date': newTokens.expiry_date,
        });
      }
      console.log('Google Takvim jetonları yenilendi ve güncellendi.');
    });

    this.oAuth2Clients.set(userId, oAuth2Client);
    return oAuth2Client;
  }

  /**
   * Belirli bir kullanıcı için Google Takvim etkinliklerini getirir.
   * @param userId Kullanıcının Firebase UID'si.
   * @param timeMin Etkinlikleri getirmek için başlangıç zamanı (ISO formatında string).
   * @param timeMax Etkinlikleri getirmek için bitiş zamanı (ISO formatında string).
   * @returns Takvim etkinlikleri listesi.
   */
  async listEvents(userId: string, timeMin: string, timeMax: string) {
    const auth = await this.getOAuth2Client(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const res = await calendar.events.list({
      calendarId: 'primary',
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });

    return res.data.items;
  }

  /**
   * Belirli bir kullanıcı için Google Takvim'de yeni bir etkinlik oluşturur.
   * @param userId Kullanıcının Firebase UID'si.
   * @param eventResource Etkinlik kaynağı nesnesi (Google Calendar API formatında).
   * @returns Oluşturulan etkinlik bilgileri.
   */
  async createEvent(userId: string, eventResource: any) {
    const auth = await this.getOAuth2Client(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const res = await calendar.events.insert({
      calendarId: 'primary',
      requestBody: eventResource,
    });

    return res.data;
  }

  /**
   * Belirli bir kullanıcı için Google Takvim'deki mevcut bir etkinliği günceller.
   * @param userId Kullanıcının Firebase UID'si.
   * @param eventId Güncellenecek etkinliğin ID'si.
   * @param eventResource Güncellenmiş etkinlik kaynağı nesnesi.
   * @returns Güncellenen etkinlik bilgileri.
   */
  async updateEvent(userId: string, eventId: string, eventResource: any) {
    const auth = await this.getOAuth2Client(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const res = await calendar.events.update({
      calendarId: 'primary',
      eventId: eventId,
      requestBody: eventResource,
    });

    return res.data;
  }

  /**
   * Belirli bir kullanıcının Google Takvim'deki boş/meşgul durumunu kontrol eder.
   * @param userId Kullanıcının Firebase UID'si.
   * @param timeMin Boş/meşgul kontrolü için başlangıç zamanı (ISO formatında string).
   * @param timeMax Boş/meşgul kontrolü için bitiş zamanı (ISO formatında string).
   * @param items Kontrol edilecek takvimlerin listesi (varsayılan olarak birincil takvim).
   * @returns Boş/meşgul bilgileri.
   */
  async getFreeBusy(userId: string, timeMin: string, timeMax: string, items: { id: string }[] = [{ id: 'primary' }]) {
    const auth = await this.getOAuth2Client(userId);
    const calendar = google.calendar({ version: 'v3', auth });

    const res = await calendar.freebusy.query({
      requestBody: {
        timeMin: timeMin,
        timeMax: timeMax,
        items: items,
      },
    });

    return res.data;
  }
} 