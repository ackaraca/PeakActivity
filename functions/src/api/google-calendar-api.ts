import { onRequest, HttpsError, onCall } from 'firebase-functions/v2/https';
import { google } from 'googleapis';
import { GoogleCalendarService } from '../services/google-calendar-service';

// TODO: Bu değerleri Firebase Functions çevre değişkenleri olarak yapılandırın
const GOOGLE_CLIENT_ID = process.env.GOOGLE_CLIENT_ID;
const GOOGLE_CLIENT_SECRET = process.env.GOOGLE_CLIENT_SECRET;
const GOOGLE_REDIRECT_URI = process.env.GOOGLE_REDIRECT_URI; // Örneğin: https://YOUR_REGION-YOUR_PROJECT_ID.cloudfunctions.net/googleCalendarOAuthCallback

import { admin, db } from "../firebaseAdmin";

const oAuth2Client = new google.auth.OAuth2(
  GOOGLE_CLIENT_ID,
  GOOGLE_CLIENT_SECRET,
  GOOGLE_REDIRECT_URI
);

const SCOPES = ['https://www.googleapis.com/auth/calendar.events.readonly', 'https://www.googleapis.com/auth/calendar.events'];

const googleCalendarService = new GoogleCalendarService();

/**
 * Google Takvim OAuth akışını başlatan Firebase İşlevi.
 * Kullanıcıyı Google'ın yetkilendirme sayfasına yönlendirir.
 */
export const googleCalendarAuth = onRequest({
  cors: true,
}, async (req, res) => {
  const userId = req.query.userId as string; // Kullanıcı kimliğini query parametresinden al

  if (!userId) {
    throw new HttpsError('invalid-argument', "Kullanıcı ID'si eksik. Lütfen geçerli bir kullanıcı ID'si sağlayın.");
  }

  const authUrl = oAuth2Client.generateAuthUrl({
    access_type: 'offline',
    scope: SCOPES,
    prompt: 'consent',
    state: JSON.stringify({ userId }), // Kullanıcı ID'sini state parametresiyle taşı
  });
  res.redirect(authUrl);
});

/**
 * Google OAuth geri aramasını işleyen Firebase İşlevi.
 * Erişim ve yenileme jetonlarını alır ve güvenli bir şekilde saklar.
 */
export const googleCalendarOAuthCallback = onRequest({
  cors: true,
}, async (req, res) => {
  const code = req.query.code as string;
  const state = req.query.state as string; // State parametresini al

  if (!code) {
    throw new HttpsError('invalid-argument', 'Yetkilendirme kodu eksik.');
  }

  let userId: string | undefined;
  if (state) {
    try {
      const stateObj = JSON.parse(state);
      userId = stateObj.userId;
    } catch (e) {
      console.error("State ayrıştırma hatası:", e);
      throw new HttpsError('internal', 'State parametresi geçersiz.');
    }
  }

  if (!userId) {
    throw new HttpsError('unauthenticated', 'Kullanıcı kimliği doğrulanamadı. Lütfen tekrar deneyin.');
  }

  try {
    const { tokens } = await oAuth2Client.getToken(code);

    // Jetonları Firebase Firestore'da ilgili kullanıcıya bağlayarak saklayın.
    await db.collection('users').doc(userId).set({
      googleCalendarTokens: tokens,
      googleCalendarAuthDate: admin.firestore.FieldValue.serverTimestamp(),
    }, { merge: true });
    console.log(`Kullanıcı ${userId} için Google Takvim jetonları başarıyla saklandı.`);
    res.status(200).send('Google Takvim entegrasyonu başarıyla tamamlandı! Artık bu sekmeyi kapatabilirsiniz.');

  } catch (error: any) {
    console.error('Jeton alırken hata oluştu:', error);
    throw new HttpsError('internal', 'Jeton alırken hata oluştu.', error.message);
  }
});

/**
 * Kullanıcının Google Takvim etkinliklerini listeleyen Firebase İşlevi.
 */
export const listGoogleCalendarEvents = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  const userId = request.auth.uid;
  const { timeMin, timeMax } = request.data;

  if (!timeMin || !timeMax) {
    throw new HttpsError('invalid-argument', 'timeMin ve timeMax gereklidir.');
  }

  try {
    const events = await googleCalendarService.listEvents(userId, timeMin, timeMax);
    return { success: true, events };
  } catch (error: any) {
    console.error('Etkinlikleri listelerken hata oluştu:', error);
    throw new HttpsError('internal', error.message || 'Etkinlikleri listelerken bilinmeyen bir hata oluştu.');
  }
});

/**
 * Kullanıcının Google Takvim'inde yeni bir etkinlik oluşturan Firebase İşlevi.
 */
export const createGoogleCalendarEvent = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  const userId = request.auth.uid;
  const { eventResource } = request.data;

  if (!eventResource) {
    throw new HttpsError('invalid-argument', 'Etkinlik kaynağı gereklidir.');
  }

  try {
    const newEvent = await googleCalendarService.createEvent(userId, eventResource);
    return { success: true, event: newEvent };
  } catch (error: any) {
    console.error('Etkinlik oluşturulurken hata oluştu:', error);
    throw new HttpsError('internal', error.message || 'Etkinlik oluşturulurken bilinmeyen bir hata oluştu.');
  }
});

/**
 * Kullanıcının Google Takvim'indeki mevcut bir etkinliği güncelleyen Firebase İşlevi.
 */
export const updateGoogleCalendarEvent = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  const userId = request.auth.uid;
  const { eventId, eventResource } = request.data;

  if (!eventId || !eventResource) {
    throw new HttpsError('invalid-argument', "Etkinlik ID'si ve etkinlik kaynağı gereklidir.");
  }

  try {
    const updatedEvent = await googleCalendarService.updateEvent(userId, eventId, eventResource);
    return { success: true, event: updatedEvent };
  } catch (error: any) {
    console.error('Etkinlik güncellenirken hata oluştu:', error);
    throw new HttpsError('internal', error.message || 'Etkinlik güncellenirken bilinmeyen bir hata oluştu.');
  }
});

/**
 * Kullanıcının Google Takvim'deki boş/meşgul durumunu getiren Firebase İşlevi.
 */
export const getGoogleCalendarFreeBusy = onCall(async (request) => {
  if (!request.auth) {
    throw new HttpsError(
      'unauthenticated',
      'The function must be called while authenticated.'
    );
  }
  const userId = request.auth.uid;
  const { timeMin, timeMax, items } = request.data;

  if (!timeMin || !timeMax) {
    throw new HttpsError('invalid-argument', 'timeMin ve timeMax gereklidir.');
  }

  try {
    const freeBusyInfo = await googleCalendarService.getFreeBusy(userId, timeMin, timeMax, items);
    return { success: true, freeBusy: freeBusyInfo };
  } catch (error: any) {
    console.error('Boş/meşgul bilgisi alınırken hata oluştu:', error);
    throw new HttpsError('internal', error.message || 'Boş/meşgul bilgisi alınırken bilinmeyen bir hata oluştu.');
  }
}); 