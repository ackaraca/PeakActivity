import { google } from 'googleapis';
import { db } from '../firebaseAdmin';
import * as functions from 'firebase-functions';

// Bu, gerçek uygulamada kullanıcı başına depolanması gereken kimlik doğrulama bilgileri için bir yer tutucudur.
// Genellikle Firebase Authentication ve Firestore kullanılarak yönetilir.
interface UserGoogleAuth {
  accessToken: string;
  refreshToken: string;
  expiryDate: number;
}

export class GoogleCalendarService {
  private oAuth2Client: any; // GoogleAuth.OAuth2Client

  constructor() {
    // Ortam değişkenlerinden kimlik bilgilerini yükle
    const CLIENT_ID = functions.config().googleapi.client_id;
    const CLIENT_SECRET = functions.config().googleapi.client_secret;
    const REDIRECT_URI = functions.config().googleapi.redirect_uri;

    this.oAuth2Client = new google.auth.OAuth2(
      CLIENT_ID,
      CLIENT_SECRET,
      REDIRECT_URI
    );
  }

  // Kullanıcı kimlik doğrulama bilgilerini ayarlar
  async setCredentials(userId: string): Promise<boolean> {
    const userDoc = await db.collection('users').doc(userId).get();
    const userData = userDoc.data();

    if (userData && userData.googleCalendarAuth) {
      const auth: UserGoogleAuth = userData.googleCalendarAuth;
      this.oAuth2Client.setCredentials({
        access_token: auth.accessToken,
        refresh_token: auth.refreshToken,
        expiry_date: auth.expiryDate,
      });

      // Erişim tokenı süresi dolduysa yenile
      if (this.oAuth2Client.is === true) {
        const { credentials } = await this.oAuth2Client.refreshAccessToken();
        await db.collection('users').doc(userId).update({
          'googleCalendarAuth.accessToken': credentials.access_token,
          'googleCalendarAuth.expiryDate': credentials.expiry_date,
        });
        this.oAuth2Client.setCredentials(credentials);
      }
      return true;
    }
    return false;
  }

  // Google Calendar API istemcisini döndürür
  private getCalendarClient() {
    return google.calendar({ version: 'v3', auth: this.oAuth2Client });
  }

  // Kullanıcının takvim etkinliklerini çeker
  async getEvents(userId: string, timeMin: string, timeMax: string, calendarId: string = 'primary') {
    const credentialsSet = await this.setCredentials(userId);
    if (!credentialsSet) {
      throw new Error('Google Calendar kimlik bilgileri ayarlanmadı.');
    }

    const calendar = this.getCalendarClient();
    const res = await calendar.events.list({
      calendarId: calendarId,
      timeMin: timeMin,
      timeMax: timeMax,
      singleEvents: true,
      orderBy: 'startTime',
    });
    return res.data.items;
  }

  // Yeni bir takvim etkinliği oluşturur
  async createEvent(userId: string, event: any, calendarId: string = 'primary') {
    const credentialsSet = await this.setCredentials(userId);
    if (!credentialsSet) {
      throw new Error('Google Calendar kimlik bilgileri ayarlanmadı.');
    }

    const calendar = this.getCalendarClient();
    const res = await calendar.events.insert({
      calendarId: calendarId,
      requestBody: event,
    });
    return res.data;
  }

  // Takvim etkinliğini günceller
  async updateEvent(userId: string, eventId: string, event: any, calendarId: string = 'primary') {
    const credentialsSet = await this.setCredentials(userId);
    if (!credentialsSet) {
      throw new Error('Google Calendar kimlik bilgileri ayarlanmadı.');
    }

    const calendar = this.getCalendarClient();
    const res = await calendar.events.update({
      calendarId: calendarId,
      eventId: eventId,
      requestBody: event,
    });
    return res.data;
  }

  // Takvim etkinliğini siler
  async deleteEvent(userId: string, eventId: string, calendarId: string = 'primary') {
    const credentialsSet = await this.setCredentials(userId);
    if (!credentialsSet) {
      throw new Error('Google Calendar kimlik bilgileri ayarlanmadı.');
    }

    const calendar = this.getCalendarClient();
    await calendar.events.delete({
      calendarId: calendarId,
      eventId: eventId,
    });
    return true;
  }

  // Kullanıcının takvim listesini çeker
  async listCalendars(userId: string) {
    const credentialsSet = await this.setCredentials(userId);
    if (!credentialsSet) {
      throw new Error('Google Calendar kimlik bilgileri ayarlanmadı.');
    }

    const calendar = this.getCalendarClient();
    const res = await calendar.calendarList.list();
    return res.data.items;
  }
} 