import { onRequest, HttpsError } from 'firebase-functions/v2/https';
import { GoalService } from '../services/goal-service';
import * as admin from 'firebase-admin';

// Hedef oluşturma
export const createGoal = onRequest({
  cors: true,
}, async (req, res) => {
  try {
    if (req.method !== 'POST') {
      throw new HttpsError('permission-denied', 'Yöntem izin verilmiyor.');
    }

    const { userId, ...goalData } = req.body;

    if (!userId) {
      throw new HttpsError('invalid-argument', `Kullanıcı ID'si gerekli.`);
    }
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      throw new HttpsError('unauthenticated', `Kimlik doğrulama token'ı eksik.`);
    }
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (decodedToken.uid !== userId) {
      throw new HttpsError('permission-denied', `Yetkisiz erişim. Kullanıcı ID'si eşleşmiyor.`);
    }

    const newGoal = await GoalService.createGoal(goalData, userId);
    res.status(201).json({ success: true, data: newGoal });
  } catch (error: any) {
    const code = error.code || 'internal';
    const message = error.message || 'Bilinmeyen bir hata oluştu.';
    const statusCode = error.httpStatusCode || 500;
    res.status(statusCode).json({ error: message, code });
  }
});

// Hedefleri listeleme
export const getGoals = onRequest({
  cors: true,
}, async (req, res) => {
  try {
    if (req.method !== 'GET') {
      throw new HttpsError('permission-denied', 'Yöntem izin verilmiyor.');
    }

    const { userId } = req.query;
    if (!userId) {
      throw new HttpsError('invalid-argument', `Kullanıcı ID'si gerekli.`);
    }
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      throw new HttpsError('unauthenticated', `Kimlik doğrulama token'ı eksik.`);
    }
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (decodedToken.uid !== userId) {
      throw new HttpsError('permission-denied', `Yetkisiz erişim. Kullanıcı ID'si eşleşmiyor.`);
    }

    // Bu API, tüm hedefleri listelemek için GoalService'de bir metod gerektirecektir.
    // Şimdilik sadece örnek bir dönüş yapıyorum.
    res.status(200).json({ success: true, data: [] });
  } catch (error: any) {
    const code = error.code || 'internal';
    const message = error.message || 'Bilinmeyen bir hata oluştu.';
    const statusCode = error.httpStatusCode || 500;
    res.status(statusCode).json({ error: message, code });
  }
});

// Hedef güncelleme
export const updateGoal = onRequest({
  cors: true,
}, async (req, res) => {
  try {
    if (req.method !== 'PUT') {
      throw new HttpsError('permission-denied', 'Yöntem izin verilmiyor.');
    }

    const { goalId, userId, ...updates } = req.body;

    if (!goalId || !userId) {
      throw new HttpsError('invalid-argument', `Hedef ID ve Kullanıcı ID'si gerekli.`);
    }
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      throw new HttpsError('unauthenticated', `Kimlik doğrulama token'ı eksik.`);
    }
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (decodedToken.uid !== userId) {
      throw new HttpsError('permission-denied', `Yetkisiz erişim. Kullanıcı ID'si eşleşmiyor.`);
    }

    await GoalService.updateGoal(goalId, updates, userId);
    res.status(200).json({ success: true, message: 'Hedef başarıyla güncellendi' });
  } catch (error: any) {
    const code = error.code || 'internal';
    const message = error.message || 'Bilinmeyen bir hata oluştu.';
    const statusCode = error.httpStatusCode || 500;
    res.status(statusCode).json({ error: message, code });
  }
});

// Hedef silme
export const deleteGoal = onRequest({
  cors: true,
}, async (req, res) => {
  try {
    if (req.method !== 'DELETE') {
      throw new HttpsError('permission-denied', 'Yöntem izin verilmiyor.');
    }

    const { goalId, userId } = req.body;

    if (!goalId || !userId) {
      throw new HttpsError('invalid-argument', `Hedef ID ve Kullanıcı ID'si gerekli.`);
    }
    const idToken = req.headers.authorization?.split('Bearer ')[1];
    if (!idToken) {
      throw new HttpsError('unauthenticated', `Kimlik doğrulama token'ı eksik.`);
    }
    
    const decodedToken = await admin.auth().verifyIdToken(idToken);
    if (decodedToken.uid !== userId) {
      throw new HttpsError('permission-denied', `Yetkisiz erişim. Kullanıcı ID'si eşleşmiyor.`);
    }

    await GoalService.deleteGoal(goalId, userId);
    res.status(200).json({ success: true, message: 'Hedef başarıyla silindi' });
  } catch (error: any) {
    const code = error.code || 'internal';
    const message = error.message || 'Bilinmeyen bir hata oluştu.';
    const statusCode = error.httpStatusCode || 500;
    res.status(statusCode).json({ error: message, code });
  }
}); 